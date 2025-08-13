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

import gitUrlParse from 'git-url-parse';

import { getBranchName, getCatalogFilename } from '../catalog/catalogUtils';
import { logErrorIfNeeded } from '../helpers';
import {
  DefaultPageNumber,
  DefaultPageSize,
} from '../service/handlers/handlers';
import { CustomGitlabCredentialsProvider } from './GitlabAppManager';
import {
  ExtendedGitlabCredentials,
  GitlabFetchError,
  GitlabGroup,
  GitlabGroupResponse,
  GitlabRepository,
  GitlabRepositoryResponse,
} from './types';
import { buildGitlab } from './utils/glUtils';
// import { buildOcto } from './utils/ghUtils';
import {
  // addGithubAppOrgs,
  addGitlabTokenGroups,
  // getAllAppOrgs,
} from './utils/groupUtils';
import { closePRWithComment, findOpenPRForBranch } from './utils/prUtils';
import {
  // addGithubAppRepositories,
  // addGithubTokenOrgRepositories,
  addGitlabTokenOrgRepositories,
  addGitlabTokenRepositories,
  createOrUpdateFileInBranch,
  fileExistsInDefaultBranch,
  ValidatedRepo,
  // createOrUpdateFileInBranch,
  // fileExistsInDefaultBranch,
  // type ValidatedRepo,
} from './utils/repoUtils';
import {
  computeTotalCount,
  executeFunctionOnFirstSuccessfulIntegration,
  //   extractLocationOwnerMap,
  fetchFromAllIntegrations,
  //   getCredentialsForConfig,
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

    const ghConfig = this.integrations.github.byUrl(repoUrl)?.config;
    if (!ghConfig) {
      throw new Error(
        `No GitHub integration config found for repo ${repoUrl}. Please add a configuration entry under 'integrations.github`,
      );
    }

    const credentials = await getCredentialsForConfig(
      this.githubCredentialsProvider,
      ghConfig,
    );
    const errors = new Map<number, GithubFetchError>();
    let repository: GithubRepository | undefined = undefined;
    for (const credential of credentials) {
      const octokit = buildOcto(
        {
          logger: this.logger,
          cache: this.cache,
        },
        { credential, errors, owner: gitUrl.owner },
        ghConfig.apiBaseUrl,
      );
      if (!octokit) {
        continue;
      }
      const resp = await octokit.rest.repos.get({
        owner: gitUrl.owner,
        repo: gitUrl.name,
      });
      const repo = resp?.data;
      if (!repo) {
        continue;
      }
      repository = {
        name: repo.name,
        full_name: repo.full_name,
        url: repo.url,
        html_url: repo.html_url,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
      };
      break;
    }

    return {
      repository,
      errors: Array.from(errors.values()),
    };
  }

  async getGroupFromIntegrations(
    search?: string,
    pageNumber: number = DefaultPageNumber,
    pageSize: number = DefaultPageSize,
  ): Promise<GitlabGroupResponse> {
    const groups = new Map<string, GitlabGroup>();
    const result = await fetchFromAllIntegrations(
      {
        logger: this.logger,
        cache: this.cache,
        gitlabCredentialsProvider: this.gitlabCredentialsProvider,
      },
      this.integrations,
      {
        dataFetcher: async (
          glApi: any,
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
          glApi: any,
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
            repositories,
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

    const repoList = Array.from(repositories.values());
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
          glApi: any,
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
          console.log('gitlab total count', resp);
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

  //   async filterLocationsAccessibleFromIntegrations(
  //     locationUrls: string[],
  //   ): Promise<string[]> {
  //     const locationGitOwnerMap = extractLocationOwnerMap(locationUrls);

  //     const allAccessibleAppOrgs = new Set<string>();
  //     const allAccessibleTokenOrgs = new Set<string>();
  //     const allAccessibleUsernames = new Set<string>();
  //     await fetchFromAllIntegrations(
  //       {
  //         logger: this.logger,
  //         cache: this.cache,
  //         githubCredentialsProvider: this.githubCredentialsProvider,
  //       },
  //       this.integrations,
  //       {
  //         dataFetcher: async (
  //           octokit: Octokit,
  //           credential: ExtendedGithubCredentials,
  //           ghConfig: GithubIntegrationConfig,
  //         ) => {
  //           if (isGithubAppCredential(credential)) {
  //             const appOrgMap = await getAllAppOrgs(
  //               this.githubCredentialsProvider,
  //               ghConfig,
  //               credential.accountLogin,
  //             );
  //             for (const [_, ghOrg] of appOrgMap) {
  //               allAccessibleAppOrgs.add(ghOrg.name);
  //             }
  //           } else {
  //             // find authenticated GitHub owner...
  //             const username = (await octokit.rest.users.getAuthenticated())?.data
  //               ?.login;
  //             if (username) {
  //               allAccessibleUsernames.add(username);
  //             }
  //             // ... along with orgs accessible from the token auth
  //             (await octokit.paginate(octokit.rest.orgs.listForAuthenticatedUser))
  //               ?.map(org => org.login)
  //               ?.forEach(orgName => allAccessibleTokenOrgs.add(orgName));
  //           }
  //           return {};
  //         },
  //       },
  //     );

  //     return locationUrls.filter(loc => {
  //       if (!locationGitOwnerMap.has(loc)) {
  //         return false;
  //       }
  //       const owner = locationGitOwnerMap.get(loc)!;
  //       return (
  //         allAccessibleAppOrgs.has(owner) ||
  //         allAccessibleTokenOrgs.has(owner) ||
  //         allAccessibleUsernames.has(owner)
  //       );
  //     });
  //   }

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
        glConfig.apiBaseUrl,
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
          gitlab: any,
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

            // const repoData = await octo.rest.repos.get({
            //   owner,
            //   repo,
            // });
            const repoData = await gitlab.Projects.show(`${owner}/${repo}`);

            // const parentRef = await octo.rest.git.getRef({
            //   owner,
            //   repo,
            //   ref: `heads/${repoData.default_branch}`,
            // });
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
              const pullRequestResponse = await octo.rest.pulls.update({
                owner,
                repo,
                pull_number: existingPrForBranch.prNum,
                title: input.prTitle,
                body: input.prBody,
                head: branchName,
                base: repoData.data.default_branch,
              });
              return {
                successful: true,
                result: {
                  prNumber: existingPrForBranch.prNum,
                  prUrl: pullRequestResponse.data.html_url,
                  lastUpdate: pullRequestResponse.data.updated_at,
                },
              };
            }

            let branchExists = false;
            try {
              // await octo.rest.git.getRef({
              //   owner,
              //   repo,
              //   ref: `heads/${branchName}`,
              // });
              await gitlab.Branches.show(`${owner}/${repo}`, branchName);
              branchExists = true;
            } catch (error: any) {
              if (error.message.includes('404')) {
                // await octo.rest.git.createRef({
                //   owner,
                //   repo,
                //   ref: `refs/heads/${branchName}`,
                //   sha: parentRef.data.object.sha,
                // });
                await gitlab.Branches.create(
                  `${owner}/${repo}`,
                  branchName,
                  parentRef.name,
                );
              } else {
                throw error;
              }
            }

            if (branchExists) {
              // update it in case it is outdated compared to the base branch
              try {
                await octo.repos.merge({
                  owner: owner,
                  repo: repo,
                  base: branchName,
                  head: repoData.data.default_branch,
                });
              } catch (error: any) {
                logErrorIfNeeded(
                  this.logger,
                  `Could not merge default branch ${repoData.data.default_branch} into import branch ${branchName}`,
                  error,
                );
              }
            }

            await createOrUpdateFileInBranch(
              octo,
              owner,
              repo,
              branchName,
              fileName,
              input.catalogInfoContent,
            );

            const pullRequestResponse = await octo.rest.pulls.create({
              owner,
              repo,
              title: input.prTitle,
              body: input.prBody,
              head: branchName,
              base: repoData.data.default_branch,
            });
            return {
              successful: true,
              result: {
                prNumber: pullRequestResponse.data.number,
                prUrl: pullRequestResponse.data.html_url,
                lastUpdate: pullRequestResponse.data.updated_at,
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
      `Tried all possible GitHub credentials, but could not create PR in ${input.repoUrl}. Please try again later...`,
    );

    return {
      errors: errors,
    };
  }

  //   async hasFileInRepo(input: {
  //     repoUrl: string;
  //     defaultBranch?: string;
  //     fileName: string;
  //   }) {
  //     const fileExists = await executeFunctionOnFirstSuccessfulIntegration(
  //       {
  //         logger: this.logger,
  //         cache: this.cache,
  //         config: this.config,
  //         githubCredentialsProvider: this.githubCredentialsProvider,
  //       },
  //       this.integrations,
  //       {
  //         repoUrl: input.repoUrl,
  //         fn: async (validatedRepo: ValidatedRepo, octo: Octokit) => {
  //           const { owner, repo } = validatedRepo;
  //           const exists = await fileExistsInDefaultBranch(
  //             this.logger,
  //             octo,
  //             owner,
  //             repo,
  //             input.fileName,
  //             input.defaultBranch,
  //           );
  //           if (exists === undefined) {
  //             return { successful: false };
  //           }
  //           return { successful: true, result: exists };
  //         },
  //       },
  //     );

  //     if (fileExists === undefined) {
  //       throw new Error(
  //         `Could not determine if repo at ${input.repoUrl} already has a file named ${input.fileName} in its default branch (${input.defaultBranch})`,
  //       );
  //     }

  //     return fileExists;
  //   }

  //   async closeImportPR(
  //     logger: LoggerService,
  //     input: {
  //       repoUrl: string;
  //       gitUrl: gitUrlParse.GitUrl;
  //       comment: string;
  //     },
  //   ) {
  //     await executeFunctionOnFirstSuccessfulIntegration(
  //       {
  //         logger: this.logger,
  //         cache: this.cache,
  //         config: this.config,
  //         githubCredentialsProvider: this.githubCredentialsProvider,
  //       },
  //       this.integrations,
  //       {
  //         repoUrl: input.repoUrl,
  //         fn: async (validatedRepo: ValidatedRepo, octo: Octokit) => {
  //           const { owner, repo, branchName } = validatedRepo;
  //           try {
  //             const existingPrForBranch = await findOpenPRForBranch(
  //               logger,
  //               this.config,
  //               octo,
  //               owner,
  //               repo,
  //               branchName,
  //             );
  //             if (existingPrForBranch.prNum) {
  //               await closePRWithComment(
  //                 octo,
  //                 owner,
  //                 repo,
  //                 existingPrForBranch.prNum,
  //                 input.comment,
  //               );
  //             }
  //             return { successful: true };
  //           } catch (e: any) {
  //             logErrorIfNeeded(
  //               this.logger,
  //               `Couldn't close PR in ${input.repoUrl}`,
  //               e,
  //             );
  //             return { successful: false };
  //           }
  //         },
  //       },
  //     );
  //   }

  //   async deleteImportBranch(input: {
  //     repoUrl: string;
  //     gitUrl: gitUrlParse.GitUrl;
  //   }) {
  //     await executeFunctionOnFirstSuccessfulIntegration(
  //       {
  //         logger: this.logger,
  //         cache: this.cache,
  //         config: this.config,
  //         githubCredentialsProvider: this.githubCredentialsProvider,
  //       },
  //       this.integrations,
  //       {
  //         repoUrl: input.repoUrl,
  //         fn: async (validatedRepo: ValidatedRepo, octo: Octokit) => {
  //           const { owner, repo, branchName } = validatedRepo;
  //           try {
  //             await octo.git.deleteRef({
  //               owner: owner,
  //               repo: repo,
  //               ref: `heads/${branchName}`,
  //             });
  //             return { successful: true };
  //           } catch (e: any) {
  //             logErrorIfNeeded(
  //               this.logger,
  //               `Couldn't close import PR and/or delete import branch in ${input.repoUrl}`,
  //               e,
  //             );
  //             return { successful: false };
  //           }
  //         },
  //       },
  //     );
  //   }

  //   async isRepoEmpty(input: { repoUrl: string }) {
  //     return await executeFunctionOnFirstSuccessfulIntegration(
  //       {
  //         logger: this.logger,
  //         cache: this.cache,
  //         config: this.config,
  //         githubCredentialsProvider: this.githubCredentialsProvider,
  //       },
  //       this.integrations,
  //       {
  //         repoUrl: input.repoUrl,
  //         fn: async (validatedRepo: ValidatedRepo, octo: Octokit) => {
  //           const { owner, repo } = validatedRepo;
  //           const resp = await octo.rest.repos.listContributors({
  //             owner: owner,
  //             repo: repo,
  //             page: 1,
  //             per_page: 1,
  //           });
  //           const status = resp.status as 200 | 204;
  //           return { successful: true, result: status === 204 };
  //         },
  //       },
  //     );
  //   }
}
