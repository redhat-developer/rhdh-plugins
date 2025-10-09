/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { CatalogApi } from '@backstage/catalog-client';
import type { Config } from '@backstage/config';

import gitUrlParse from 'git-url-parse';

import { CatalogHttpClient } from '../../../catalog/catalogHttpClient';
import type { CatalogInfoGenerator } from '../../../catalog/catalogInfoGenerator';
import {
  getCatalogFilename,
  getCatalogUrl,
} from '../../../catalog/catalogUtils';
import {
  RepositoryDao,
  ScaffolderTaskDao,
  TaskLocationsDao,
} from '../../../database/repositoryDao';
import type { Components, Paths } from '../../../generated/openapi';
import type { GithubApiService } from '../../../github';
import { GitlabApiService } from '../../../gitlab';
import {
  getNestedValue,
  logErrorIfNeeded,
  paginateArray,
  parseGitURLForApprovalTool,
} from '../../../helpers';
import {
  DefaultPageNumber,
  DefaultPageSize,
  DefaultSortColumn,
  DefaultSortOrder,
  type HandlerResponse,
} from '../handlers';

type CreateImportDryRunStatus =
  | 'CATALOG_ENTITY_CONFLICT'
  | 'CATALOG_INFO_FILE_EXISTS_IN_REPO'
  | 'CODEOWNERS_FILE_NOT_FOUND_IN_REPO'
  | 'REPO_EMPTY';

type FindAllImportsResponse =
  | Components.Schemas.Import[]
  | Components.Schemas.ImportJobListV2;

export function sortImports(
  imports: Components.Schemas.Import[],
  sortColumn: Components.Parameters.SortColumnQueryParam = DefaultSortColumn,
  sortOrder: Components.Parameters.SortOrderQueryParam = DefaultSortOrder,
) {
  imports.sort((a, b) => {
    const value1 = getNestedValue(a, sortColumn);
    const value2 = getNestedValue(b, sortColumn);
    // Handle cases where values are undefined
    if (value1 === undefined && value2 === undefined) return 0;
    if (value1 === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (value2 === undefined) return sortOrder === 'asc' ? 1 : -1;

    if (sortColumn === 'lastUpdate') {
      const date1 = new Date(value1); // Convert string to Date object
      const date2 = new Date(value2); // Convert string to Date object
      // Compare dates
      return sortOrder === 'asc'
        ? date2.getTime() - date1.getTime()
        : date1.getTime() - date2.getTime();
    }
    // Compare values based on sort order
    return sortOrder === 'asc'
      ? value1.localeCompare(value2)
      : value2.localeCompare(value1);
  });
}

export async function findAllImports(
  deps: {
    logger: LoggerService;
    config: Config;
    gitlabApiService: GitlabApiService;
    githubApiService: GithubApiService;
    catalogHttpClient: CatalogHttpClient;
  },
  requestHeaders?: {
    apiVersion?: Paths.FindAllImports.Parameters.ApiVersion;
  },
  queryParams?: {
    search?: string;
    pageNumber?: number;
    pageSize?: number;
    sortColumn?: Components.Parameters.SortColumnQueryParam;
    sortOrder?: Components.Parameters.SortOrderQueryParam;
  },
): Promise<HandlerResponse<FindAllImportsResponse>> {
  const apiVersion = requestHeaders?.apiVersion ?? 'v1';
  const search = queryParams?.search;
  const pageNumber = queryParams?.pageNumber ?? DefaultPageNumber;
  const pageSize = queryParams?.pageSize ?? DefaultPageSize;
  const sortColumn = queryParams?.sortColumn ?? DefaultSortColumn;
  const sortOrder = queryParams?.sortOrder ?? DefaultSortOrder;

  const catalogFilename = getCatalogFilename(deps.config);

  const allLocations = (
    await deps.catalogHttpClient.listCatalogUrlLocations(
      search,
      pageNumber,
      pageSize,
    )
  ).uniqueCatalogUrlLocations;

  // resolve default branches for each unique repo URL from GH,
  // because we cannot easily determine that from the location target URL.
  // It can be 'main' or something more convoluted like 'our/awesome/main'.
  const defaultBranchByRepoUrl = await resolveReposDefaultBranches(
    deps.logger,
    deps.gitlabApiService,
    deps.githubApiService,
    allLocations.keys(),
    catalogFilename,
  );

  // filter out locations that do not match what we are expecting, i.e.:
  // an URL to a catalog-info YAML file at the root of the repo
  const importCandidates = findImportCandidates(
    allLocations.keys(),
    defaultBranchByRepoUrl,
    catalogFilename,
  );

  // Keep only repos that are accessible from the configured GH/GL integrations
  const importsReachableFromGHIntegrations =
    await deps.githubApiService.filterLocationsAccessibleFromIntegrations(
      importCandidates.filter(val => {
        return parseGitURLForApprovalTool(val) === 'GIT';
      }),
    );

  const importsReachableFromGLIntegrations =
    await deps.gitlabApiService.filterLocationsAccessibleFromIntegrations(
      importCandidates.filter(val => {
        return parseGitURLForApprovalTool(val) === 'GITLAB';
      }),
    );

  // Merge the two lists together and map the appropriate approvalTool
  const mergedReachbleFromIntegrations = importsReachableFromGHIntegrations
    .map(val => {
      return {
        loc: val,
        approvalTool: 'GIT',
      };
    })
    .concat(
      importsReachableFromGLIntegrations.map(val => {
        return {
          loc: val,
          approvalTool: 'GITLAB',
        };
      }),
    );

  const repoUrlToLocation = new Map<string, string>();

  // now fetch the import statuses in different promises
  const importStatusPromises: Promise<
    HandlerResponse<Components.Schemas.Import>
  >[] = [];
  for (const imports of mergedReachbleFromIntegrations) {
    const repoUrl = repoUrlFromLocation(imports.loc);
    if (!repoUrl) {
      continue;
    }
    repoUrlToLocation.set(repoUrl, imports.loc);

    importStatusPromises.push(
      findImportStatusByRepo(
        {
          logger: deps.logger,
          config: deps.config,
          gitApiService:
            imports.approvalTool === 'GITLAB'
              ? deps.gitlabApiService
              : deps.githubApiService,
          catalogHttpClient: deps.catalogHttpClient,
          approvalTool: imports.approvalTool,
        },
        repoUrl,
        defaultBranchByRepoUrl.get(repoUrl),
        false,
      ),
    );
  }

  const result = await Promise.all(importStatusPromises);
  const imports = result
    .filter(res => res.responseBody)
    .map(res => res.responseBody!)
    .map(res => {
      const key = res?.repository?.url;
      const location = key ? repoUrlToLocation.get(key) : undefined;
      return {
        ...res,
        source: location ? allLocations.get(location)?.source : undefined,
      };
    });

  // sorting the output to make it deterministic and easy to navigate in the UI

  sortImports(imports, sortColumn, sortOrder);
  const paginated = paginateArray(imports, pageNumber, pageSize);
  if (apiVersion === 'v1') {
    return {
      statusCode: 200,
      responseBody: paginated.result,
    };
  }
  return {
    statusCode: 200,
    responseBody: {
      imports: paginated.result,
      totalCount: paginated.totalCount,
      page: pageNumber,
      size: pageSize,
    },
  };
}

async function resolveReposDefaultBranches(
  logger: LoggerService,
  gitlabApiService: GitlabApiService,
  githubApiService: GithubApiService,
  allLocations: Iterable<string>,
  catalogFilename: string,
) {
  const defaultBranchByRepoUrlPromises: Promise<{
    repoUrl: string;
    defaultBranch?: string;
  }>[] = [];
  for (const loc of allLocations) {
    // loc has the following format: https://github.com/<org>/<repo>/blob/<default-branch>/catalog-info.yaml
    // but it can have a more convoluted format like 'https://github.com/janus-idp/backstage-plugins/blob/main/plugins/scaffolder-annotator-action/examples/templates/01-scaffolder-template.yaml'
    // if registered manually from the 'Register existing component' feature in Backstage.
    if (!loc.endsWith(catalogFilename)) {
      logger.debug(
        `Ignored location ${loc} because it does not point to a file named ${catalogFilename}`,
      );
      continue;
    }
    const repoUrl = repoUrlFromLocation(loc);
    if (!repoUrl) {
      continue;
    }
    // Have to do this for Both the gitlab/github, possibly a better way?
    // Should probably parse the URL to figure out which to use?
    defaultBranchByRepoUrlPromises.push(
      (parseGitURLForApprovalTool(repoUrl) === 'GITLAB'
        ? gitlabApiService
        : githubApiService
      )
        .getRepositoryFromIntegrations(repoUrl)
        .then(resp => {
          return { repoUrl, defaultBranch: resp?.repository?.default_branch };
        })
        .catch((err: any) => {
          logErrorIfNeeded(
            logger,
            `Ignored repo ${repoUrl} due to an error while fetching details from GitHub`,
            err,
          );
          return {
            repoUrl,
            defaultBranch: undefined,
          };
        }),
    );
  }
  const defaultBranchesResponses = await Promise.all(
    defaultBranchByRepoUrlPromises,
  );
  return new Map(
    defaultBranchesResponses
      .flat()
      .filter(r => r.defaultBranch)
      .map(r => [r.repoUrl, r.defaultBranch!]),
  );
}

function repoUrlFromLocation(loc: string) {
  const split = loc.split('/blob/');
  if (split.length < 2) {
    return undefined;
  }
  return split[0];
}

function findImportCandidates(
  allLocations: Iterable<string>,
  defaultBranchByRepoUrl: Map<string, string>,
  catalogFilename: string,
) {
  const filteredLocations: string[] = [];
  for (const loc of allLocations) {
    const repoUrl = repoUrlFromLocation(loc);
    if (!repoUrl) {
      continue;
    }

    const defaultBranch = defaultBranchByRepoUrl.get(repoUrl);
    if (!defaultBranch) {
      continue;
    }
    if (loc !== `${repoUrl}/blob/${defaultBranch}/${catalogFilename}`) {
      // Because users can use the "Register existing component" workflow to register a Location
      // using any file path in the repo, we consider a repository as an Import Location only
      // if it is at the root of the repository, because that is what the import PR ultimately does.
      continue;
    }
    filteredLocations.push(loc);
  }
  return filteredLocations;
}

async function createPR(
  gitApiService: GithubApiService | GitlabApiService,
  logger: LoggerService,
  req: Components.Schemas.ImportRequest,
  gitUrl: gitUrlParse.GitUrl,
  catalogInfoGenerator: CatalogInfoGenerator,
  config: Config,
) {
  const appTitle =
    config.getOptionalString('app.title') ?? 'Red Hat Developer Hub';
  const appBaseUrl = config.getString('app.baseUrl');
  const catalogFileName = getCatalogFilename(config);
  return await gitApiService.submitPrToRepo(logger, {
    repoUrl: req.repository.url,
    gitUrl: gitUrl,
    defaultBranch: req.repository.defaultBranch,
    catalogInfoContent:
      req.catalogInfoContent ??
      (await catalogInfoGenerator.generateDefaultCatalogInfoContent(
        req.repository.url,
      )),
    prTitle:
      req[req.approvalTool === 'GITLAB' ? 'gitlab' : 'github']?.pullRequest
        ?.title ?? `Add ${catalogFileName}`,
    prBody:
      req[req.approvalTool === 'GITLAB' ? 'gitlab' : 'github']?.pullRequest
        ?.body ??
      `
This pull request adds a **Backstage entity metadata file** to this repository so that the component can be added to a Backstage application.

After this pull request is merged, the component will become available in the [${appTitle} software catalog](${appBaseUrl}).

For more information, read an [overview of the Backstage software catalog](https://backstage.io/docs/features/software-catalog/).
`,
  });
}

async function handleAddedReposFromCreateImportJobs(
  deps: {
    logger: LoggerService;
    config: Config;
    auth: AuthService;
    catalogApi: CatalogApi;
    gitlabApiService: GitlabApiService;
    githubApiService: GithubApiService;
    catalogInfoGenerator: CatalogInfoGenerator;
    catalogHttpClient: CatalogHttpClient;
  },
  importRequests: Components.Schemas.ImportRequest[],
) {
  const result: Components.Schemas.Import[] = [];

  for (const req of importRequests) {
    // Check if repo is already imported
    const repoCatalogUrl = getCatalogUrl(
      deps.config,
      req.repository.url,
      req.repository.defaultBranch,
    );
    const hasLocation =
      await deps.catalogHttpClient.verifyLocationExistence(repoCatalogUrl);
    if (!hasLocation) {
      continue;
    }
    const gitApiService =
      req.approvalTool === 'GITLAB'
        ? deps.gitlabApiService
        : deps.githubApiService;
    const hasCatalogInfoFileInRepo = await gitApiService.hasFileInRepo({
      repoUrl: req.repository.url,
      defaultBranch: req.repository.defaultBranch,
      fileName: getCatalogFilename(deps.config),
    });
    if (!hasCatalogInfoFileInRepo) {
      continue;
    }

    const ghRepo = await gitApiService.getRepositoryFromIntegrations(
      req.repository.url,
    );

    // Force a refresh of the Location, so that the entities from the catalog-info.yaml can show up quickly (not guaranteed however).
    await deps.catalogHttpClient.refreshLocationByRepoUrl(
      req.repository.url,
      req.repository.defaultBranch,
    );

    const gitUrl = gitUrlParse(req.repository.url);
    result.push({
      status: 'ADDED',
      lastUpdate: ghRepo?.repository?.updated_at ?? undefined,
      repository: {
        url: req.repository.url,
        name: gitUrl.name,
        organization: gitUrl.organization,
      },
    });
  }
  return result;
}

async function handlePrCreationRequest(
  deps: {
    logger: LoggerService;
    config: Config;
    auth: AuthService;
    catalogApi: CatalogApi;
    gitlabApiService: GitlabApiService;
    githubApiService: GithubApiService;
    catalogInfoGenerator: CatalogInfoGenerator;
    catalogHttpClient: CatalogHttpClient;
  },
  req: Components.Schemas.ImportRequest,
  gitUrl: gitUrlParse.GitUrl,
): Promise<Components.Schemas.Import> {
  const repoCatalogUrl = getCatalogUrl(
    deps.config,
    req.repository.url,
    req.repository.defaultBranch,
  );
  const gitApiService =
    req.approvalTool === 'GITLAB'
      ? deps.gitlabApiService
      : deps.githubApiService;
  const prToRepo = await createPR(
    gitApiService,
    deps.logger,
    req,
    gitUrl,
    deps.catalogInfoGenerator,
    deps.config,
  );
  if (prToRepo.errors && prToRepo.errors.length > 0) {
    return {
      errors: prToRepo.errors,
      status: 'PR_ERROR',
      repository: req.repository,
    };
  }
  if (prToRepo.prUrl) {
    deps.logger.debug(`Created new PR from request: ${prToRepo.prUrl}`);
  }

  // Create Location
  await deps.catalogHttpClient.possiblyCreateLocation(repoCatalogUrl);

  if (prToRepo.hasChanges === false) {
    deps.logger.debug(
      `No bulk import PR created on ${req.repository.url} since its default branch (${req.repository.defaultBranch}) already contains a catalog-info file`,
    );

    // Force a refresh of the Location, so that the entities from the catalog-info.yaml can show up quickly (not guaranteed however).
    await deps.catalogHttpClient.refreshLocationByRepoUrl(
      req.repository.url,
      req.repository.defaultBranch,
    );
    return {
      status: 'ADDED',
      lastUpdate: prToRepo.lastUpdate,
      repository: {
        url: req.repository.url,
        name: gitUrl.name,
        organization: gitUrl.organization,
      },
    };
  }

  return {
    approvalTool: req.approvalTool ?? 'GIT',
    errors: prToRepo.errors,
    status: 'WAIT_PR_APPROVAL',
    lastUpdate: prToRepo.lastUpdate,
    repository: {
      url: req.repository.url,
      name: gitUrl.name,
      organization: gitUrl.organization,
    },
    [req.approvalTool === 'GITLAB' ? 'gitlab' : 'github']: {
      pullRequest: {
        url: prToRepo.prUrl,
        number: prToRepo.prNumber,
      },
    },
  };
}

export async function createImportJobs(
  deps: {
    logger: LoggerService;
    config: Config;
    auth: AuthService;
    catalogApi: CatalogApi;
    gitlabApiService: GitlabApiService;
    githubApiService: GithubApiService;
    catalogInfoGenerator: CatalogInfoGenerator;
    catalogHttpClient: CatalogHttpClient;
  },
  reqParams: {
    importRequests: Paths.CreateImportJobs.RequestBody;
    dryRun?: boolean;
  },
): Promise<
  HandlerResponse<Components.Schemas.Import[] | { errors: string[] }>
> {
  const dryRun = reqParams.dryRun ?? false;
  const importRequests = reqParams.importRequests;
  deps.logger.debug(
    `Handling request to import ${importRequests?.length} repo(s) (dryRun=${dryRun})..`,
  );

  if (importRequests.length === 0) {
    deps.logger.debug('Missing import requests from request body');
    return {
      statusCode: 400,
      responseBody: [],
    };
  }

  if (dryRun) {
    return {
      statusCode: 202,
      responseBody: await dryRunCreateImportJobs(deps, importRequests),
    };
  }

  const result: Components.Schemas.Import[] = [];

  const addedRepos = await handleAddedReposFromCreateImportJobs(
    deps,
    importRequests,
  );
  result.push(...addedRepos);
  const addedReposMap = new Map(
    addedRepos.map(res => [res.repository?.url, res]),
  );
  const remainingRequests = importRequests.filter(
    req => !addedReposMap.has(req.repository.url),
  );

  for (const req of remainingRequests) {
    const gitUrl = gitUrlParse(req.repository.url);

    // Create PR
    try {
      result.push(await handlePrCreationRequest(deps, req, gitUrl));
    } catch (error: any) {
      result.push({
        errors: [error.message],
        status: 'PR_ERROR',
        repository: {
          url: req.repository.url,
          name: gitUrl.name,
          organization: gitUrl.organization,
        },
      } as Components.Schemas.Import);
    }
  }

  sortImports(result);

  return {
    statusCode: 202,
    responseBody: result,
  };
}

async function dryRunCreateImportJobs(
  deps: {
    logger: LoggerService;
    config: Config;
    auth: AuthService;
    catalogApi: CatalogApi;
    gitlabApiService: GitlabApiService;
    githubApiService: GithubApiService;
    catalogInfoGenerator: CatalogInfoGenerator;
    catalogHttpClient: CatalogHttpClient;
  },
  importRequests: Paths.CreateImportJobs.RequestBody,
) {
  const result: Components.Schemas.Import[] = [];
  for (const req of importRequests) {
    const gitUrl = gitUrlParse(req.repository.url);

    const dryRunChecks = await performDryRunChecks(deps, req);
    if (dryRunChecks.errors?.length > 0) {
      deps.logger.warn(
        `Errors while performing dry-run checks: ${dryRunChecks.errors}`,
      );
    }
    result.push({
      errors: dryRunChecks.dryRunStatuses,
      catalogEntityName: req.catalogEntityName,
      repository: {
        url: req.repository.url,
        name: gitUrl.name,
        organization: gitUrl.organization,
      },
    });
  }
  return result;
}

async function performDryRunChecks(
  deps: {
    logger: LoggerService;
    auth: AuthService;
    catalogApi: CatalogApi;
    config: Config;
    gitlabApiService: GitlabApiService;
    githubApiService: GithubApiService;
    catalogHttpClient: CatalogHttpClient;
  },
  req: Components.Schemas.ImportRequest,
): Promise<{ dryRunStatuses: CreateImportDryRunStatus[]; errors: string[] }> {
  const checkCatalog = async (
    catalogEntityName: string,
  ): Promise<{
    dryRunStatuses?: CreateImportDryRunStatus[];
    errors?: string[];
  }> => {
    const hasEntity =
      await deps.catalogHttpClient.hasEntityInCatalog(catalogEntityName);
    if (hasEntity) {
      return { dryRunStatuses: ['CATALOG_ENTITY_CONFLICT'] };
    }
    return {};
  };

  const gitApiService =
    req.approvalTool === 'GITLAB'
      ? deps.gitlabApiService
      : deps.githubApiService;
  const checkEmptyRepo = async (): Promise<{
    dryRunStatuses?: CreateImportDryRunStatus[];
    errors?: string[];
  }> => {
    const empty = await gitApiService.isRepoEmpty({
      repoUrl: req.repository.url,
    });
    if (empty) {
      return {
        dryRunStatuses: ['REPO_EMPTY'],
      };
    }
    return {};
  };

  const checkCatalogInfoPresenceInRepo = async (): Promise<{
    dryRunStatuses?: CreateImportDryRunStatus[];
    errors?: string[];
  }> => {
    const exists = await gitApiService.hasFileInRepo({
      repoUrl: req.repository.url,
      defaultBranch: req.repository.defaultBranch,
      fileName: getCatalogFilename(deps.config),
    });
    if (exists) {
      return {
        dryRunStatuses: ['CATALOG_INFO_FILE_EXISTS_IN_REPO'],
      };
    }
    return {};
  };

  const checkCodeOwnersFileInRepo = async (): Promise<{
    dryRunStatuses?: CreateImportDryRunStatus[];
    errors?: string[];
  }> => {
    const gitDirLocation =
      req.approvalTool === 'GITLAB' ? '.gitlab' : '.github';
    const exists = await gitApiService.hasFileInRepo({
      repoUrl: req.repository.url,
      defaultBranch: req.repository.defaultBranch,
      fileName: `${gitDirLocation}/CODEOWNERS`,
    });
    if (!exists) {
      return {
        dryRunStatuses: ['CODEOWNERS_FILE_NOT_FOUND_IN_REPO'],
      };
    }
    return {};
  };

  const dryRunStatuses: CreateImportDryRunStatus[] = [];
  const errors: string[] = [];
  const allChecksFn = [checkEmptyRepo(), checkCatalogInfoPresenceInRepo()];
  if (req.catalogEntityName?.trim()) {
    allChecksFn.push(checkCatalog(req.catalogEntityName));
  }
  if (req.codeOwnersFileAsEntityOwner) {
    allChecksFn.push(checkCodeOwnersFileInRepo());
  }
  const allChecks = await Promise.all(allChecksFn);
  allChecks.flat().forEach(res => {
    if (res.dryRunStatuses) {
      dryRunStatuses.push(...res.dryRunStatuses);
    }
    if (res.errors) {
      errors.push(...res.errors);
    }
  });

  dryRunStatuses.sort((a, b) => a.localeCompare(b));

  return {
    dryRunStatuses,
    errors,
  };
}

export async function findImportStatusByRepo(
  deps: {
    logger: LoggerService;
    config: Config;
    gitApiService: GitlabApiService | GithubApiService;
    catalogHttpClient: CatalogHttpClient;
    approvalTool: string | undefined;
  },
  repoUrl: string,
  defaultBranch?: string,
  includeCatalogInfoContent?: boolean,
): Promise<HandlerResponse<Components.Schemas.Import>> {
  deps.logger.debug(`Getting bulk import job status for ${repoUrl}..`);

  const gitUrl = gitUrlParse(repoUrl);

  const errors: string[] = [];
  const result = {
    id: repoUrl,
    repository: {
      url: repoUrl,
      name: gitUrl.name,
      organization: gitUrl.organization,
      id: `${gitUrl.organization}/${gitUrl.name}`,
      defaultBranch,
    },
    approvalTool: deps.approvalTool,
    status: null,
  } as Components.Schemas.Import;
  try {
    // Check to see if there are any PR
    const openImportPr = await deps.gitApiService.findImportOpenPr(
      deps.logger,
      {
        repoUrl: repoUrl,
        includeCatalogInfoContent,
      },
    );

    if (!openImportPr?.prUrl) {
      const catalogLocations = (
        await deps.catalogHttpClient.listCatalogUrlLocations()
      ).uniqueCatalogUrlLocations.keys();

      const catalogUrl = getCatalogUrl(deps.config, repoUrl, defaultBranch);
      let exists = false;
      for (const loc of catalogLocations) {
        if (loc === catalogUrl) {
          exists = true;
          break;
        }
      }
      if (
        exists &&
        (await deps.gitApiService.hasFileInRepo({
          repoUrl,
          defaultBranch,
          fileName: getCatalogFilename(deps.config),
        }))
      ) {
        result.status = 'ADDED';
        // Force a refresh of the Location, so that the entities from the catalog-info.yaml can show up quickly (not guaranteed however).
        await deps.catalogHttpClient.refreshLocationByRepoUrl(
          repoUrl,
          defaultBranch,
        );
      }
      // No import PR => let's determine last update from the repository
      const ghRepo =
        await deps.gitApiService.getRepositoryFromIntegrations(repoUrl);
      result.lastUpdate = ghRepo.repository?.updated_at ?? undefined;
      return {
        statusCode: 200,
        responseBody: result,
      };
    }
    result.status = 'WAIT_PR_APPROVAL';
    result[deps.approvalTool === 'GITLAB' ? 'gitlab' : 'github'] = {
      pullRequest: {
        number: openImportPr.prNum,
        url: openImportPr.prUrl,
        title: openImportPr.prTitle,
        body: openImportPr.prBody,
        catalogInfoContent: openImportPr.prCatalogInfoContent,
      },
    };

    result.lastUpdate = openImportPr.lastUpdate;
  } catch (error: any) {
    errors.push(error.message);
    result.errors = errors;
    if (error.message?.includes('Not Found')) {
      return {
        statusCode: 404,
        responseBody: result,
      };
    }
    result.status = 'PR_ERROR';
  }

  return {
    statusCode: 200,
    responseBody: result,
  };
}

export async function findTaskImportStatusByRepo(
  deps: {
    logger: LoggerService;
    config: Config;
    githubApiService: GithubApiService;
    gitlabApiService: GitlabApiService;
    catalogHttpClient: CatalogHttpClient;
    repositoryDao: RepositoryDao;
    taskDao: ScaffolderTaskDao;
    taskLocationsDao: TaskLocationsDao;
    discovery: DiscoveryService;
    auth: AuthService;
  },
  repoUrl: string,
  skipTasks?: boolean,
): Promise<HandlerResponse<Components.Schemas.Import>> {
  deps.logger.debug(`Getting bulk import job status for ${repoUrl}..`);

  const gitUrl = gitUrlParse(repoUrl);

  const errors: string[] = [];
  const result: Components.Schemas.Import = {
    id: repoUrl,
    repository: {
      url: repoUrl,
      name: gitUrl.name,
      organization: gitUrl.organization,
      id: `${gitUrl.organization}/${gitUrl.name}`,
    },
    approvalTool: 'GIT',
  };
  try {
    const repository = await deps.repositoryDao.findRepositoryByUrl(repoUrl);
    if (repository?.id) {
      const task = await deps.taskDao.lastExecutedTaskByRepoId(repository?.id);
      if (!task) {
        throw new Error(
          `Unable to find scaffolder task for repository: ${repository?.id}`,
        );
      }

      const scaffolderUrl = await deps.discovery.getBaseUrl('scaffolder');
      const { token } = await deps.auth.getPluginRequestToken({
        onBehalfOf: await deps.auth.getOwnServiceCredentials(),
        targetPluginId: 'scaffolder',
      });

      const response = await fetch(`${scaffolderUrl}/v2/tasks/${task.taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!skipTasks) {
        const tasks = await deps.taskDao.findTasksByRepositoryId(repository.id);
        const tasksWithLocations = await Promise.all(
          tasks.map(async taskItem => {
            const locations = await deps.taskLocationsDao.findLocationsByTaskId(
              taskItem.taskId,
            );
            const taskLocations = locations.map(location => location.location);
            return {
              ...taskItem,
              locations: taskLocations,
            };
          }),
        );
        result.tasks = tasksWithLocations;
      }

      result.task = { taskId: task.taskId };
      let data;
      if (response.ok) {
        data = await response.json();
        result.lastUpdate = data.lastHeartbeatAt;

        const approvalTool =
          repository.approvalTool as unknown as Components.Schemas.ApprovalTool;
        const pullRequest = await parsePullOrMergeRequestInfo(
          data.state?.checkpoints,
          deps.gitlabApiService,
          deps.githubApiService,
          approvalTool,
          deps.logger,
          repoUrl,
        );
        if (pullRequest && approvalTool === 'GITLAB') {
          result.gitlab = { pullRequest };
        }
        if (pullRequest && approvalTool === 'GIT') {
          result.github = { pullRequest };
        }

        result.status =
          `TASK_${(data.status as string)?.toLocaleUpperCase()}` as Components.Schemas.TaskImportStatus;
      } else {
        const errMsg =
          (await response.text()) ??
          `Failed to fetch task ${task.taskId}. Response status: ${response.status}`;
        throw new Error(errMsg);
      }
    }
  } catch (error: any) {
    errors.push(error.message);
    result.errors = errors;
    result.status = 'TASK_FETCH_FAILED';
    if (error.message?.includes('Not Found')) {
      return {
        statusCode: 404,
        responseBody: result,
      };
    }
  }

  return {
    statusCode: 200,
    responseBody: result,
  };
}

async function parsePullOrMergeRequestInfo(
  checkpoints: Record<string, any>,
  githubApiService: GitlabApiService,
  gitlabApiService: GithubApiService,
  approvalTool: Components.Schemas.ApprovalTool,
  logger: LoggerService,
  repoUrl: string,
): Promise<Components.Schemas.PullRequest | undefined> {
  // return errors ?
  if (approvalTool !== 'GITLAB' && approvalTool !== 'GIT') {
    return undefined;
  }
  const gitApiService =
    approvalTool === 'GITLAB' ? gitlabApiService : githubApiService;

  for (const key in checkpoints) {
    if (!checkpoints.hasOwnProperty(key)) {
      continue;
    }
    try {
      if (
        key.startsWith('v1.task.checkpoint.publish.create.pr') ||
        key.startsWith('v1.task.checkpoint.publish.create.mr')
      ) {
        const url =
          checkpoints[key]?.value?.html_url ??
          checkpoints[key]?.value?.mrWebUrl;
        if (!url) {
          continue;
        }
        const prNumber = Number.parseInt(url.split('/').pop()!, 10);
        const prDetails = await gitApiService.getPullRequest(repoUrl, prNumber);

        let catalogInfoContent: string | undefined;
        if (prDetails.prSha) {
          catalogInfoContent = await gitApiService.getCatalogInfoFile(logger, {
            repoUrl,
            prHeadSha: prDetails.prSha,
            prNumber,
          });
        }
        return {
          url,
          number: prNumber,
          title: prDetails.title,
          body: prDetails.body,
          status: prDetails.merged ? 'PR_MERGED' : 'WAIT_PR_APPROVAL',
          catalogInfoContent,
        };
      }
    } catch (err) {
      logger.warn(`Error while processing checkpoint ${key}: ${err}`);
      continue;
    }
  }

  return undefined;
}

export async function deleteImportByRepo(
  deps: {
    logger: LoggerService;
    config: Config;
    gitApiService: GithubApiService | GitlabApiService;
    catalogHttpClient: CatalogHttpClient;
  },
  repoUrl: string,
  defaultBranch?: string,
): Promise<HandlerResponse<void>> {
  deps.logger.debug(`Deleting bulk import job status for ${repoUrl}..`);

  // Check to see if there are any PR
  const openImportPr = await deps.gitApiService.findImportOpenPr(deps.logger, {
    repoUrl: repoUrl,
  });

  const gitUrl = gitUrlParse(repoUrl);
  if (openImportPr?.prUrl) {
    // Close PR
    const appTitle =
      deps.config.getOptionalString('app.title') ?? 'Red Hat Developer Hub';
    const appBaseUrl = deps.config.getString('app.baseUrl');

    await deps.gitApiService.closeImportPR(deps.logger, {
      repoUrl,
      gitUrl,
      comment: `Closing PR upon request for bulk import deletion. This request was created from [${appTitle}](${appBaseUrl}).`,
    });
  }
  // Also delete the import branch, so that it is not outdated if we try later to import the repo again
  await deps.gitApiService.deleteImportBranch({
    repoUrl,
    gitUrl,
  });
  // Remove Location from catalog
  const catalogUrl = getCatalogUrl(deps.config, repoUrl, defaultBranch);
  const findLocationFrom = (list: { id?: string; target: string }[]) => {
    for (const loc of list) {
      if (loc.target === catalogUrl) {
        return loc.id;
      }
    }
    return undefined;
  };

  const locationId = findLocationFrom(
    (
      await deps.catalogHttpClient.listCatalogUrlLocationsByIdFromLocationsEndpoint()
    ).locations,
  );
  if (locationId) {
    await deps.catalogHttpClient.deleteCatalogLocationById(locationId);
  }

  return {
    statusCode: 204,
    responseBody: undefined,
  };
}

export async function deleteTaskImportByRepo(
  deps: {
    logger: LoggerService;
    dao: RepositoryDao;
  },
  repoUrl: string,
): Promise<HandlerResponse<void>> {
  deps.logger.debug(`Deleting repository from database by name ${repoUrl}...`);
  try {
    await deps.dao.deleteRepository(repoUrl);

    return {
      statusCode: 204,
      responseBody: undefined,
    };
  } catch (error: any) {
    deps.logger.error(
      `Failed to delete repository from database by url ${repoUrl}`,
      error,
    );
    return {
      statusCode: 500,
    };
  }
}
