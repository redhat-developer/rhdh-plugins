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
import type {
  GitlabCredentials,
  GitLabIntegrationConfig,
} from '@backstage/integration';

import { Octokit } from '@octokit/rest';

import { logErrorIfNeeded, paginateArray } from '../../helpers';
import {
  DefaultPageNumber,
  DefaultPageSize,
} from '../../service/handlers/handlers';
import type { CustomGitlabCredentialsProvider } from '../GitlabAppManager';
import type { GitlabFetchError, GitlabGroup } from '../types';
import { computeTotalCountFromPaginationInfo, handleError } from './utils';

export async function addGitlabTokenGroups(
  deps: {
    logger: LoggerService;
  },
  gitlab: any,
  credential: GitlabCredentials,
  params: {
    search: string | undefined;
    groups: Map<string, GitlabGroup>;
    errors: Map<number, GitlabFetchError>;
    pageNumber: number;
    pageSize: number;
  },
): Promise<{ totalCount?: number }> {
  const search = params.search;
  const groups = params.groups;
  const errors = params.errors;
  const pageNumber = params.pageNumber ?? DefaultPageNumber;
  const pageSize = params.pageSize ?? DefaultPageSize;

  let totalCount: number | undefined;
  try {
    let matchingGroups;
    if (search) {
      // Initial idea was to leverage octokit.rest.search.users({q: `${search} type:org`}),
      // but this searches across all of GitHub, not only the orgs accessible by the current creds.
      // That's why we are searching in everything, hoping the list of organizations to not be that big in size
      // const resp = await octokit.paginate(
      //   octokit.rest.orgs.listForAuthenticatedUser,
      //   {
      //     sort: 'full_name',
      //     direction: 'asc',
      //   },
      // );
      // const allMatchingOrgs =
      //   resp?.filter(org =>
      //     org.login.toLowerCase().includes(search.toLowerCase()),
      //   ) ?? [];
      // const matchingOrgsPage = paginateArray(
      //   allMatchingOrgs,
      //   pageNumber,
      //   pageSize,
      // );
      // matchingOrgs = matchingOrgsPage.result;
      // totalCount = matchingOrgsPage.totalCount;
    } else {
      /**
       * The Groups all endpoint will grab all the groups the gitlab token has explicit access to.
       */

      const { data, paginationInfo } = await gitlab.Groups.all({
        all_available: false,
        perPage: pageSize,
        page: pageNumber,
        showExpanded: true,
      });

      matchingGroups = data ?? [];

      totalCount = await computeTotalCountFromPaginationInfo(
        deps,
        paginationInfo,
        pageSize, // Not thrilled with this for some reason
      );
    }

    // Gitlab groups don't provide the same info that the github org provides, but some might not be needed
    // All the info we need is already part of that first request, so no need to go out again
    // Just in case we need it in the future, the gitlab.Groups.show('GROUP_ID') can be used to get a few more pieced of info
    for (const group of matchingGroups) {
      console.log(group);
      // const groupData = await octokit.request(group.url);
      const glGroup: GitlabGroup = {
        id: group.id,
        name: group.name,
        description: group.description ?? undefined,
        url: group.web_url,
        repos_url: group.repos_url,
        hooks_url: group.hooks_url,
        issues_url: group.issues_url,
        members_url: group.members_url,
        public_members_url: group.public_members_url,
        avatar_url: group.avatar_url,
        public_repos: group?.data?.public_repos,
        total_private_repos: group?.data?.total_private_repos,
        owned_private_repos: group?.data?.owned_private_repos,
      };
      groups.set(group.name, glGroup);
    }
  } catch (err) {
    handleError(
      { logger: deps.logger },
      'Fetching groups with token from token',
      credential,
      errors,
      err,
    );
  }
  return { totalCount };
}
