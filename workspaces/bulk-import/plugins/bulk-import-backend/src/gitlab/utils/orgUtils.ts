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
import type { GitlabCredentials } from '@backstage/integration';

import { Gitlab } from '@gitbeaker/rest';

import {
  DefaultPageNumber,
  DefaultPageSize,
} from '../../service/handlers/handlers';
import type { GitlabFetchError, GitlabOrganization } from '../types';
import { computeTotalCountFromPaginationInfo, handleError } from './utils';

export async function addGitlabTokenGroups(
  deps: {
    logger: LoggerService;
  },
  gitlab: InstanceType<typeof Gitlab<false>>,
  credential: GitlabCredentials,
  params: {
    search: string | undefined;
    groups: Map<string, GitlabOrganization>;
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
      // Use the group api with the search param.
      // I noticed that using this api will only return values when 3 or more characters are used for the search
      // that api gives us all the things the token has access
      const { data, paginationInfo } = await gitlab.Groups.all<true, 'offset'>({
        allAvailable: false,
        search: search,
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
    } else {
      /**
       * The Groups all endpoint will grab all the groups the gitlab token has explicit access to.
       */

      const { data, paginationInfo } = await gitlab.Groups.all<true, 'offset'>({
        allAvailable: false,
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
      const glGroup: GitlabOrganization = {
        id: group.id,
        name: group.path,
        description: group.description ?? undefined,
        url: group.web_url,
        avatar_url: group.avatar_url,
        // From here down gitlab doesn't really have while calling the group api
        // public_repos: group?.data?.public_repos,
        // total_private_repos: group?.data?.total_private_repos,
        // owned_private_repos: group?.data?.owned_private_repos,
      };
      groups.set(group.path, glGroup);
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
