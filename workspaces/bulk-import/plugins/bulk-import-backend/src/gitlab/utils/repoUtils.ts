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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import type {
  GitlabCredentials,
  GitLabIntegrationConfig,
  ScmIntegrations,
} from '@backstage/integration';

import { Gitlab } from '@gitbeaker/rest';

// import gitUrlParse from 'git-url-parse';

// import { getBranchName } from '../../catalog/catalogUtils';
// import { logErrorIfNeeded } from '../../helpers';
import {
  DefaultPageNumber,
  DefaultPageSize,
} from '../../service/handlers/handlers';
// import type { CustomGithubCredentialsProvider } from '../GithubAppManager';
import type {
  ExtendedGitlabCredentials,
  // GitlabAppCredentials,
  GitlabFetchError,
  GitlabRepository,
} from '../types';
// import { getAllAppOrgs } from './orgUtils';
import {
  computeTotalCountFromPaginationInfo,
  // computeTotalCountFromGitHubToken,
  // createCredentialError,
  handleError,
} from './utils';

// export type ValidatedRepo = {
//   ghConfig: GithubIntegrationConfig;
//   credentials: ExtendedGithubCredentials[];
//   owner: string;
//   repo: string;
//   branchName: string;
// };

// export async function validateAndBuildRepoData(
//   githubCredentialsProvider: CustomGithubCredentialsProvider,
//   integrations: ScmIntegrations,
//   config: Config,
//   input: {
//     repoUrl: string;
//   },
// ): Promise<ValidatedRepo> {
//   const ghConfig = integrations.github.byUrl(input.repoUrl)?.config;
//   if (!ghConfig) {
//     throw new Error(`Could not find GH integration from ${input.repoUrl}`);
//   }

//   const gitUrl = gitUrlParse(input.repoUrl);
//   const owner = gitUrl.organization;
//   const repo = gitUrl.name;

//   const credentials = await githubCredentialsProvider.getAllCredentials({
//     host: ghConfig.host,
//   });
//   if (credentials.length === 0) {
//     throw new Error(`No credentials for GH integration`);
//   }

//   const branchName = getBranchName(config);
//   return { ghConfig, owner, repo, credentials, branchName };
// }

export async function searchRepos(
  gitlab: any,
  glSearchQuery: string,
  pageNumber: number = DefaultPageNumber,
  pageSize: number = DefaultPageSize,
): Promise<{ totalCount?: number; repositories: GitlabRepository[] }> {
  const repoSearchResp = await gitlab.Projects.all({
    search: glSearchQuery,
    membership: true,
    perPage: pageSize,
    page: pageNumber,
    showExpanded: true,
  });

  return {
    totalCount: repoSearchResp?.paginationInfo?.total,
    repositories:
      repoSearchResp?.data?.map(repo => {
        return {
          name: repo.name,
          full_name: repo.path_with_namespace,
          url: `${gitlab.url}/projects/${repo.id}`,
          html_url: repo.web_url,
          default_branch: repo.default_branch,
          updated_at: repo.updated_at,
        };
      }) ?? [],
  };
}

/**
 * Adds the user or organization repositories accessible by the github token to the provided repositories Map<string, GithubRepository> if they're owned by the specified owner
 * If any errors occurs, adds them to the provided errors Map<number, GithubFetchError>
 */
export async function addGitlabTokenRepositories(
  deps: {
    logger: LoggerService;
  },
  gitlab: any,
  // octokit: Octokit,
  credential: any,
  repositories: Map<string, GitlabRepository>,
  errors: Map<number, GitlabFetchError>,
  reqParams?: {
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  },
): Promise<{ totalCount?: number }> {
  const search = reqParams?.search;
  const pageNumber = reqParams?.pageNumber ?? DefaultPageNumber;
  const pageSize = reqParams?.pageSize ?? DefaultPageSize;
  let totalCount: number | undefined;
  try {
    if (search) {
      // Use the projects api with the search param
      // that api gives us all the things the token has access to including the different projects in various groups

      const searchResp = await searchRepos(
        gitlab,
        search,
        pageNumber,
        pageSize,
      );
      totalCount = searchResp.totalCount;
      searchResp.repositories.forEach(repo =>
        repositories.set(repo.full_name, repo),
      );
    } else {
      /**
       * The Projects.all method with the membership: true option will grab all the repositories/projects the gitlab token has explicit access to.
       * These would include repositories they own, repositories where they are a collaborator,
       * and repositories that they can access through an organization membership(TODO: see if that is true in gitlab).
       */
      const { data, paginationInfo } = await gitlab.Projects.all({
        membership: true,
        perPage: pageSize,
        page: pageNumber,
        showExpanded: true,
      });

      data?.forEach(
        (repo: {
          id: string;
          path_with_namespace: string;
          full_name: string;
          name: any;
          url: any;
          html_url: any;
          web_url: any;
          default_branch: any;
          updated_at: any;
        }) => {
          repositories.set(repo.path_with_namespace, {
            name: repo.name,
            path_with_namespace: repo.path_with_namespace,
            full_name: repo.path_with_namespace,
            url: `${gitlab.url}/projects/${repo.id}`,
            html_url: repo.web_url,
            default_branch: repo.default_branch,
            updated_at: repo.updated_at,
          });
        },
      );

      /*
      paginationInfo: {
        total: , This is the total amount of repos, but will be NaN if the value is above 10k, see: https://github.com/jdalrymple/gitbeaker/issues/839#issuecomment-636482319
        next: ,
        current: ,
        previous: ,
        perPage: ,
        totalPages:
      }
      */

      totalCount = await computeTotalCountFromPaginationInfo(
        deps,
        paginationInfo,
        pageSize, // Not thrilled with this for some reason
      );
    }
  } catch (err) {
    handleError(
      deps,
      'Fetching repositories with token from token',
      credential,
      errors,
      err,
    );
  }
  return { totalCount };
}

export async function addGitlabTokenOrgRepositories(
  deps: {
    logger: LoggerService;
  },
  gitlab: any,
  credential: GitlabCredentials,
  org: string,
  repositories: Map<string, GitlabRepository>,
  errors: Map<number, GitlabFetchError>,
  reqParams?: {
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  },
): Promise<{ totalCount?: number }> {
  const search = reqParams?.search;
  const pageNumber = reqParams?.pageNumber ?? DefaultPageNumber;
  const pageSize = reqParams?.pageSize ?? DefaultPageSize;
  let totalCount: number | undefined;
  try {
    if (search) {
      // Use the group allProjects api with the search param.
      // I noticed that using this api will only return values when 3 or more characters are used for the search
      // that api gives us all the things the token has access
      const { data, paginationInfo } = await gitlab.Groups.allProjects(org, {
        perPage: pageSize,
        search: search,
        page: pageNumber,
        showExpanded: true,
      });

      data?.forEach(
        (repo: {
          id: string;
          path_with_namespace: string;
          full_name: string;
          name: any;
          url: any;
          html_url: any;
          web_url: any;
          default_branch: any;
          updated_at: any;
        }) => {
          repositories.set(repo.path_with_namespace, {
            name: repo.name,
            path_with_namespace: repo.path_with_namespace,
            full_name: repo.path_with_namespace,
            url: `${gitlab.url}/projects/${repo.id}`,
            html_url: repo.web_url,
            default_branch: repo.default_branch,
            updated_at: repo.updated_at,
          });
        },
      );

      totalCount = await computeTotalCountFromPaginationInfo(
        deps,
        paginationInfo,
        pageSize, // Not thrilled with this for some reason
      );
    } else {
      /**
       * The listForAuthenticatedUser endpoint will grab all the repositories the github token has explicit access to.
       * These would include repositories they own, repositories where they are a collaborator,
       * and repositories that they can access through an organization membership.
       */
      const { data, paginationInfo } = await gitlab.Groups.allProjects(org, {
        perPage: pageSize,
        page: pageNumber,
        showExpanded: true,
      });

      data?.forEach(
        (repo: {
          id: string;
          path_with_namespace: string;
          full_name: string;
          name: any;
          url: any;
          html_url: any;
          web_url: any;
          default_branch: any;
          updated_at: any;
        }) => {
          repositories.set(repo.path_with_namespace, {
            name: repo.name,
            path_with_namespace: repo.path_with_namespace,
            full_name: repo.path_with_namespace,
            url: `${gitlab.url}/projects/${repo.id}`,
            html_url: repo.web_url,
            default_branch: repo.default_branch,
            updated_at: repo.updated_at,
          });
        },
      );

      totalCount = await computeTotalCountFromPaginationInfo(
        deps,
        paginationInfo,
        pageSize, // Not thrilled with this for some reason
      );
    }
  } catch (err) {
    handleError(
      deps,
      'Fetching org repositories with token from token',
      credential,
      errors,
      err,
    );
  }
  return { totalCount };
}

// export async function fileExistsInDefaultBranch(
//   logger: LoggerService,
//   octo: Octokit,
//   owner: string,
//   repo: string,
//   fileName: string,
//   defaultBranch: string = 'main',
// ) {
//   try {
//     await octo.rest.repos.getContent({
//       owner,
//       repo,
//       path: fileName,
//       ref: defaultBranch,
//     });
//     return true;
//   } catch (error: any) {
//     if (error.status === 404) {
//       return false;
//     }
//     logger.debug(
//       `Unable to determine if a file named ${fileName} already exists in repo ${repo}: ${error}`,
//     );
//     return undefined;
//   }
// }

// export async function createOrUpdateFileInBranch(
//   octo: Octokit,
//   owner: string,
//   repo: string,
//   branchName: string,
//   fileName: string,
//   fileContent: string,
// ): Promise<void> {
//   try {
//     const { data: existingFile } = await octo.rest.repos.getContent({
//       owner: owner,
//       repo: repo,
//       path: fileName,
//       ref: branchName,
//     });
//     // Response can either be a directory (array of files) or a single file element. In this case, we ensure it has the sha property to update it.
//     if (Array.isArray(existingFile) || !('sha' in existingFile)) {
//       throw new Error(
//         `The content at path ${fileName} is not a file or the response from GitHub does not contain the 'sha' property.`,
//       );
//     }
//     // If the file already exists, update it
//     await octo.rest.repos.createOrUpdateFileContents({
//       owner,
//       repo,
//       path: fileName,
//       message: `Add ${fileName} config file`,
//       content: btoa(fileContent),
//       sha: existingFile.sha,
//       branch: branchName,
//     });
//   } catch (error: any) {
//     if (error.status === 404) {
//       // If the file does not exist, create it
//       await octo.rest.repos.createOrUpdateFileContents({
//         owner,
//         repo,
//         path: fileName,
//         message: `Add ${fileName} config file`,
//         content: btoa(fileContent),
//         branch: branchName,
//       });
//     } else {
//       throw error;
//     }
//   }
// }
