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
  CacheService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import {
  GitLabIntegrationConfig,
  ScmIntegrations,
} from '@backstage/integration';

import { Gitlab } from '@gitbeaker/rest';
import gitUrlParse from 'git-url-parse';

import { getBranchName, getCatalogFilename } from '../catalog/catalogUtils';
import {
  computeTotalCount,
  extractLocationOwnerMap,
  logErrorIfNeeded,
} from '../helpers';
import {
  DefaultPageNumber,
  DefaultPageSize,
} from '../service/handlers/handlers';
import { CustomGitlabCredentialsProvider } from './GitlabAppManager';
import {
  ExtendedGitlabCredentials,
  GitlabFetchError,
  GitlabOrganization,
  GitlabOrganizationResponse,
  GitlabRepository,
  GitlabRepositoryResponse,
} from './types';
import { buildGitlab } from './utils/glUtils';
import { addGitlabTokenGroups } from './utils/orgUtils';
import { closePRWithComment, findOpenPRForBranch } from './utils/prUtils';
import {
  addGitlabTokenOrgRepositories,
  addGitlabTokenRepositories,
  createOrUpdateFileInBranch,
  fileExistsInDefaultBranch,
  ValidatedRepo,
} from './utils/repoUtils';
import {
  executeFunctionOnFirstSuccessfulIntegration,
  fetchFromAllIntegrations,
  getCredentialsForConfig,
} from './utils/utils';

export class GitlabApiService {
  private readonly logger: LoggerService;
  private readonly integrations: ScmIntegrations;
  private readonly gitlabCredentialsProvider: CustomGitlabCredentialsProvider;
  private readonly config: Config;
  // Cache for storing ETags (used for efficient caching of unchanged data returned by GitHub)
  private readonly cache: CacheService;
  constructor(
    logger: LoggerService,
    config: Config,
    cacheService: CacheService,
  ) {
    this.logger = logger;
    this.config = config;
    this.integrations = ScmIntegrations.fromConfig(config);
    this.gitlabCredentialsProvider =
      CustomGitlabCredentialsProvider.fromIntegrations(this.integrations);
    this.cache = cacheService;
  }

  async getRepositoryFromIntegrations(repoUrl: string): Promise<{
    repository?: GitlabRepository;
    errors?: GitlabFetchError[];
  }> {
    const gitUrl = gitUrlParse(repoUrl);

    const glConfig = this.integrations.gitlab.byUrl(repoUrl)?.config;
    if (!glConfig) {
      throw new Error(
        `No Gitlab integration config found for repo ${repoUrl}. Please add a configuration entry under 'integrations.gitlab`,
      );
    }

    const credentials = await getCredentialsForConfig(
      this.gitlabCredentialsProvider,
      glConfig,
    );
    let repository: GitlabRepository | undefined = undefined;
    for (const credential of credentials) {
      const glKit = buildGitlab(
        {
          logger: this.logger,
          cache: this.cache,
        },
        { credential, owner: gitUrl.owner },
        glConfig.baseUrl,
      );
      const repo = await glKit.Projects.show(`${gitUrl.owner}/${gitUrl.name}`);
      if (!repo) {
        continue;
      }
      repository = {
        name: repo.name,
        full_name: repo.path_with_namespace,
        url: repo._links.self,
        html_url: repo.web_url,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
      };
      break;
    }

    return {
      repository,
      errors: [],
    };
  }

  async getOrganizationsFromIntegrations(
    search?: string,
    pageNumber: number = DefaultPageNumber,
    pageSize: number = DefaultPageSize,
  ): Promise<GitlabOrganizationResponse> {
    const groups = new Map<string, GitlabOrganization>();
    const result = await fetchFromAllIntegrations(
      {
        logger: this.logger,
        cache: this.cache,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        dataFetcher: async (
          glApi: InstanceType<typeof Gitlab<false>>,
          credential: ExtendedGitlabCredentials,
          glConfig: GitLabIntegrationConfig,
        ) => {
          const dataFetchErrors = new Map<number, GitlabFetchError>();
          const resp = await addGitlabTokenGroups(
            {
              logger: this.logger,
            },
            glApi,
            credential,
            {
              search,
              groups,
              pageNumber,
              pageSize,
              errors: dataFetchErrors,
            },
          );
          this.logger.debug(
            `Got ${resp.totalCount} groups(s) for ${glConfig.host}`,
          );
          return {
            result: resp.totalCount ?? 0,
            errors: Array.from(dataFetchErrors.values()),
          };
        },
      },
    );

    const groupList = Array.from(groups.values());
    const totalCount = computeTotalCount(groupList, result.data, pageSize);
    return {
      organizations: groupList,
      errors: Array.from(result.errors?.values() ?? []),
      totalCount,
    };
  }

  async getOrgRepositoriesFromIntegrations(
    orgName: string,
    search?: string,
    pageNumber: number = DefaultPageNumber,
    pageSize: number = DefaultPageSize,
  ): Promise<GitlabRepositoryResponse> {
    const orgRepositories = new Map<string, GitlabRepository>();
    const result = await fetchFromAllIntegrations(
      {
        logger: this.logger,
        cache: this.cache,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        dataFetcher: async (
          glApi: InstanceType<typeof Gitlab<false>>,
          credential: ExtendedGitlabCredentials,
          glConfig: GitLabIntegrationConfig,
        ) => {
          const dataFetchErrors = new Map<number, GitlabFetchError>();
          const resp = await addGitlabTokenOrgRepositories(
            {
              logger: this.logger,
            },
            glApi,
            credential,
            orgName,
            orgRepositories,
            dataFetchErrors,
            {
              search,
              pageNumber,
              pageSize,
            },
          );
          this.logger.debug(
            `Got ${resp.totalCount} org repo(s) for ${glConfig.host}`,
          );
          return {
            stopFetchingData: true,
            result: resp.totalCount ?? 0,
            errors: Array.from(dataFetchErrors.values()),
          };
        },
      },
    );

    const repoList = Array.from(orgRepositories.values());
    const totalCount = computeTotalCount(repoList, result.data, pageSize);
    return {
      repositories: repoList,
      errors: Array.from(result.errors?.values() ?? []),
      totalCount,
    };
  }

  /**
   * Returns GitlabRepositoryResponse containing:
   *   - a list of unique repositories the gitlab integrations have access to
   *   - a list of errors encountered by each token (if any exist)
   */
  async getRepositoriesFromIntegrations(
    search?: string,
    pageNumber: number = DefaultPageNumber,
    pageSize: number = DefaultPageSize,
  ): Promise<GitlabRepositoryResponse> {
    const repositories = new Map<string, GitlabRepository>();
    const result = await fetchFromAllIntegrations(
      {
        logger: this.logger,
        cache: this.cache,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        dataFetcher: async (
          glApi: InstanceType<typeof Gitlab<false>>,
          credential: ExtendedGitlabCredentials,
          glConfig: GitLabIntegrationConfig,
        ) => {
          const dataFetchErrors = new Map<number, GitlabFetchError>();
          const resp = await addGitlabTokenRepositories(
            {
              logger: this.logger,
            },
            glApi,
            credential,
            repositories,
            dataFetchErrors,
            {
              search,
              pageNumber,
              pageSize,
            },
          );
          this.logger.debug(
            `Got ${resp.totalCount} repo(s) for ${glConfig.host}`,
          );
          return {
            result: resp.totalCount ?? 0,
            errors: Array.from(dataFetchErrors.values()),
          };
        },
      },
    );

    const repoList = Array.from(repositories.values());
    const totalCount = computeTotalCount(repoList, result.data, pageSize);
    return {
      repositories: repoList,
      errors: Array.from(result.errors?.values() ?? []),
      totalCount,
    };
  }

  async filterLocationsAccessibleFromIntegrations(
    locationUrls: string[],
  ): Promise<string[]> {
    const locationGitOwnerMap = extractLocationOwnerMap(locationUrls);

    const allAccessibleTokenOrgs = new Set<string>();
    const allAccessibleUsernames = new Set<string>();
    await fetchFromAllIntegrations(
      {
        logger: this.logger,
        cache: this.cache,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        dataFetcher: async (gitlab: InstanceType<typeof Gitlab<false>>) => {
          // find authenticated gitlab owner...
          try {
            const username = (await gitlab.Users.showCurrentUser()).username;
            if (username) {
              allAccessibleUsernames.add(username);
            }
          } catch (err) {
            logErrorIfNeeded(
              this.logger,
              'failed to fetch gitlab current user',
              err,
            );
            return {};
          }

          // ... along with orgs accessible from the token auth
          try {
            const allGroups = await gitlab.Groups.all<false, 'offset'>({
              allAvailable: false,
            });
            allGroups
              .map(org => org.path)
              ?.forEach((orgName: string) =>
                allAccessibleTokenOrgs.add(orgName),
              );
          } catch (err) {
            logErrorIfNeeded(this.logger, 'failed to fetch gitlab groups', err);
            return {};
          }

          return {};
        },
      },
    );

    return locationUrls.filter(loc => {
      if (!locationGitOwnerMap.has(loc)) {
        return false;
      }
      const owner = locationGitOwnerMap.get(loc)!;
      return (
        allAccessibleTokenOrgs.has(owner) || allAccessibleUsernames.has(owner)
      );
    });
  }

  async findImportOpenPr(
    logger: LoggerService,
    input: {
      repoUrl: string;
      includeCatalogInfoContent?: boolean;
    },
  ): Promise<{
    prNum?: number;
    prUrl?: string;
    prTitle?: string;
    prBody?: string;
    prCatalogInfoContent?: string;
    lastUpdate?: string;
  }> {
    const glConfig = this.integrations.gitlab.byUrl(input.repoUrl)?.config;
    if (!glConfig) {
      throw new Error(`Could not find GL integration from ${input.repoUrl}`);
    }

    const gitUrl = gitUrlParse(input.repoUrl);
    const owner = gitUrl.organization;
    const repo = gitUrl.name;

    const credentials = await this.gitlabCredentialsProvider.getAllCredentials({
      host: glConfig.host,
    });
    if (credentials.length === 0) {
      throw new Error(`No credentials for GL integration`);
    }

    const branchName = getBranchName(this.config);
    for (const credential of credentials) {
      const glKit = buildGitlab(
        {
          logger: this.logger,
          cache: this.cache,
        },
        { credential, owner },
        glConfig.baseUrl,
      );
      try {
        return await findOpenPRForBranch(
          logger,
          this.config,
          glKit,
          owner,
          repo,
          branchName,
          input.includeCatalogInfoContent,
        );
      } catch (error: any) {
        logErrorIfNeeded(this.logger, 'Error fetching pull requests', error);
      }
    }
    return {};
  }

  async submitPrToRepo(
    logger: LoggerService,
    input: {
      repoUrl: string;
      gitUrl: gitUrlParse.GitUrl;
      defaultBranch?: string;
      prTitle: string;
      prBody: string;
      catalogInfoContent: string;
    },
  ): Promise<{
    prUrl?: string;
    prNumber?: number;
    hasChanges?: boolean;
    lastUpdate?: string;
    errors?: string[];
  }> {
    const fileName = getCatalogFilename(this.config);
    const errors: any[] = [];

    const result = await executeFunctionOnFirstSuccessfulIntegration(
      {
        logger: this.logger,
        cache: this.cache,
        config: this.config,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        repoUrl: input.repoUrl,
        fn: async (
          validatedRepo: ValidatedRepo,
          gitlab: InstanceType<typeof Gitlab<false>>,
        ): Promise<{
          successful: boolean;
          result?: {
            prUrl?: string;
            prNumber?: number;
            hasChanges?: boolean;
            lastUpdate?: string;
          };
        }> => {
          const { owner, repo, branchName } = validatedRepo;
          try {
            // Check if there is already a catalogInfo in the default branch
            const catalogInfoFileExists = await fileExistsInDefaultBranch(
              logger,
              gitlab,
              owner,
              repo,
              fileName,
              input.defaultBranch,
            );
            if (catalogInfoFileExists) {
              // No need to create a PR => component will be imported as is
              return {
                successful: true,
                result: {
                  hasChanges: false,
                },
              };
            }

            const existingPrForBranch = await findOpenPRForBranch(
              logger,
              this.config,
              gitlab,
              owner,
              repo,
              branchName,
            );

            const repoData = await gitlab.Projects.show(`${owner}/${repo}`);

            const parentRef = await gitlab.Branches.show(
              `${owner}/${repo}`,
              repoData.default_branch,
            ); // This might not be neccesarry

            if (existingPrForBranch.prNum) {
              await createOrUpdateFileInBranch(
                gitlab,
                owner,
                repo,
                branchName,
                fileName,
                input.catalogInfoContent,
              );
              const pullRequestResponse = await gitlab.MergeRequests.edit(
                `${owner}/${repo}`,
                existingPrForBranch.prNum,
                {
                  description: input.prBody,
                  title: input.prTitle,
                  targetBranch: repoData.default_branch,
                },
              );
              return {
                successful: true,
                result: {
                  prNumber: existingPrForBranch.prNum,
                  prUrl: pullRequestResponse.web_url,
                  lastUpdate: pullRequestResponse.updated_at,
                },
              };
            }

            try {
              await gitlab.Branches.show(`${owner}/${repo}`, branchName);
            } catch (error: any) {
              if (error.cause.response.status === 404) {
                await gitlab.Branches.create(
                  `${owner}/${repo}`,
                  branchName,
                  parentRef.name,
                );
              } else {
                throw error;
              }
            }

            // Might not be able to do this in the gitlab api
            // This is if the branch exists, but there wasn't a PR yet
            // if (branchExists) {
            //   // update it in case it is outdated compared to the base branch
            //   try {
            //     await octo.repos.merge({
            //       owner: owner,
            //       repo: repo,
            //       base: branchName,
            //       head: repoData.data.default_branch,
            //     });
            //   } catch (error: any) {
            //     logErrorIfNeeded(
            //       this.logger,
            //       `Could not merge default branch ${repoData.data.default_branch} into import branch ${branchName}`,
            //       error,
            //     );
            //   }
            // }

            await createOrUpdateFileInBranch(
              gitlab,
              owner,
              repo,
              branchName,
              fileName,
              input.catalogInfoContent,
            );

            const pullRequestResponse = await gitlab.MergeRequests.create(
              `${owner}/${repo}`,
              branchName,
              repoData.default_branch,
              input.prTitle,
              {
                description: input.prBody,
              },
            );
            return {
              successful: true,
              result: {
                prNumber: pullRequestResponse.iid,
                prUrl: pullRequestResponse.web_url,
                lastUpdate: pullRequestResponse.updated_at,
                hasChanges: true,
              },
            };
          } catch (e: any) {
            logErrorIfNeeded(
              this.logger,
              `Couldn't create PR in ${input.repoUrl}`,
              e,
            );
            errors.push(e.message);
            return { successful: false };
          }
        },
      },
    );

    if (result) {
      return result;
    }

    logger.warn(
      `Tried all possible Gitlab credentials, but could not create PR in ${input.repoUrl}. Please try again later...`,
    );

    return {
      errors: errors,
    };
  }

  async hasFileInRepo(input: {
    repoUrl: string;
    defaultBranch?: string;
    fileName: string;
  }) {
    const fileExists = await executeFunctionOnFirstSuccessfulIntegration(
      {
        logger: this.logger,
        cache: this.cache,
        config: this.config,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        repoUrl: input.repoUrl,
        fn: async (
          validatedRepo: ValidatedRepo,
          gitlab: InstanceType<typeof Gitlab<false>>,
        ) => {
          const { owner, repo } = validatedRepo;
          const exists = await fileExistsInDefaultBranch(
            this.logger,
            gitlab,
            owner,
            repo,
            input.fileName,
            input.defaultBranch,
          );
          if (exists === undefined) {
            return { successful: false };
          }
          return { successful: true, result: exists };
        },
      },
    );

    if (fileExists === undefined) {
      throw new Error(
        `Could not determine if repo at ${input.repoUrl} already has a file named ${input.fileName} in its default branch (${input.defaultBranch})`,
      );
    }

    return fileExists;
  }

  async closeImportPR(
    logger: LoggerService,
    input: {
      repoUrl: string;
      gitUrl: gitUrlParse.GitUrl;
      comment: string;
    },
  ) {
    await executeFunctionOnFirstSuccessfulIntegration(
      {
        logger: this.logger,
        cache: this.cache,
        config: this.config,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        repoUrl: input.repoUrl,
        fn: async (
          validatedRepo: ValidatedRepo,
          gitlab: InstanceType<typeof Gitlab<false>>,
        ) => {
          const { owner, repo, branchName } = validatedRepo;
          try {
            const existingPrForBranch = await findOpenPRForBranch(
              logger,
              this.config,
              gitlab,
              owner,
              repo,
              branchName,
            );
            if (existingPrForBranch.prNum) {
              await closePRWithComment(
                gitlab,
                owner,
                repo,
                existingPrForBranch.prNum,
                input.comment,
              );
            }
            return { successful: true };
          } catch (e: any) {
            logErrorIfNeeded(
              this.logger,
              `Couldn't close PR in ${input.repoUrl}`,
              e,
            );
            return { successful: false };
          }
        },
      },
    );
  }

  async deleteImportBranch(input: {
    repoUrl: string;
    gitUrl: gitUrlParse.GitUrl;
  }) {
    await executeFunctionOnFirstSuccessfulIntegration(
      {
        logger: this.logger,
        cache: this.cache,
        config: this.config,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        repoUrl: input.repoUrl,
        fn: async (
          validatedRepo: ValidatedRepo,
          gitlab: InstanceType<typeof Gitlab<false>>,
        ) => {
          const { owner, repo, branchName } = validatedRepo;
          try {
            await gitlab.Branches.remove(`${owner}/${repo}`, branchName);
            return { successful: true };
          } catch (e: any) {
            logErrorIfNeeded(
              this.logger,
              `Couldn't close import PR and/or delete import branch in ${input.repoUrl}`,
              e,
            );
            return { successful: false };
          }
        },
      },
    );
  }

  async isRepoEmpty(input: { repoUrl: string }) {
    return await executeFunctionOnFirstSuccessfulIntegration(
      {
        logger: this.logger,
        cache: this.cache,
        config: this.config,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        repoUrl: input.repoUrl,
        fn: async (
          validatedRepo: ValidatedRepo,
          gitlab: InstanceType<typeof Gitlab<false>>,
        ) => {
          const { owner, repo } = validatedRepo;
          const resp = await gitlab.Repositories.allContributors(
            `${owner}/${repo}`,
            {
              showExpanded: true,
            },
          );
          return { successful: true, result: resp?.data?.length < 1 };
        },
      },
    );
  }

  async getPullRequest(
    repoUrl: string,
    pullRequestNumber: number,
  ): Promise<{
    title?: string;
    body?: string;
    merged?: boolean;
    lastUpdated?: string;
    prSha?: string;
    prBranch?: string;
  }> {
    const glConfig = this.integrations.gitlab.byUrl(repoUrl)?.config;
    if (!glConfig) {
      this.logger.error(
        `No Gitlab integration config found for repo ${repoUrl}`,
      );
      return {};
    }

    const gitUrl = gitUrlParse(repoUrl);
    const owner = gitUrl.owner;
    const repo = gitUrl.name;

    const credentials = await this.gitlabCredentialsProvider.getAllCredentials({
      host: glConfig.host,
    });

    if (credentials.length === 0) {
      this.logger.error(`No credentials for GL integration`);
      return {};
    }

    for (const credential of credentials) {
      const glKit = buildGitlab(
        {
          logger: this.logger,
          cache: this.cache,
        },
        { credential, owner },
        glConfig.baseUrl,
      );

      try {
        const pr = await glKit.MergeRequests.show(
          `${owner}/${repo}`,
          pullRequestNumber,
        );

        return {
          title: pr.title,
          body: pr.description || undefined,
          merged: pr.state === 'merged',
          lastUpdated: pr.updated_at,
          prSha: pr.sha,
          prBranch: pr.source_branch,
        };
      } catch (error: any) {
        this.logger.error(
          `Error fetching pull request ${pullRequestNumber} from ${repoUrl}`,
          error,
        );
      }
    }

    return {};
  }

  async getCatalogInfoFile(
    logger: LoggerService,
    input: {
      repoUrl: string;
      prNumber: number;
      prHeadSha: string;
    },
  ): Promise<string | undefined> {
    const glConfig = this.integrations.gitlab.byUrl(input.repoUrl)?.config;
    if (!glConfig) {
      logger.error(
        `No Gitlab integration config found for repo ${input.repoUrl}`,
      );
      return undefined;
    }

    const gitUrl = gitUrlParse(input.repoUrl);
    const owner = gitUrl.owner;
    const repo = gitUrl.name;

    const credentials = await this.gitlabCredentialsProvider.getAllCredentials({
      host: glConfig.host,
    });

    if (credentials.length === 0) {
      logger.error(`No credentials for GL integration`);
      return undefined;
    }

    for (const credential of credentials) {
      const glKit = buildGitlab(
        {
          logger: this.logger,
          cache: this.cache,
        },
        { credential, owner },
        glConfig.baseUrl,
      );

      try {
        const file = await glKit.RepositoryFiles.show(
          `${owner}/${repo}`,
          getCatalogFilename(this.config),
          input.prHeadSha,
        );

        if (file) {
          const content = Buffer.from(file.content, 'base64').toString('utf-8');
          return content;
        }
      } catch (error: any) {
        if (error.cause?.response?.status === 404) {
          logger.warn(
            `catalog-info.yaml not found in PR ${input.prNumber} of ${input.repoUrl}`,
          );
          return undefined;
        }
        logger.error(
          `Error fetching catalog-info.yaml from PR ${input.prNumber} of ${input.repoUrl}`,
          error,
        );
        return undefined;
      }
    }

    return undefined;
  }
}
