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

import { useMemo } from 'react';
import { useAsync } from 'react-use';

import {
  configApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';

import { useQuery } from '@tanstack/react-query';

import { bulkImportApiRef } from '../api/BulkImportBackendClient';
import {
  AddRepositoryData,
  ApprovalTool,
  OrgAndRepoResponse,
  RepositoriesError,
} from '../types';
import {
  prepareDataForOrganizations,
  prepareDataForRepositories,
} from '../utils/repository-utils';

export interface DataFetcherQueryParams {
  showOrganizations?: boolean;
  orgName?: string;
  page?: number;
  querySize?: number;
  searchString?: string;
  approvalTool: ApprovalTool;
}

export const useRepositories = (
  options: DataFetcherQueryParams,
  pollInterval?: number,
): {
  loading: boolean;
  data: {
    repositories?: { [id: string]: AddRepositoryData };
    organizations?: { [id: string]: AddRepositoryData };
    totalRepositories?: number;
    totalOrganizations?: number;
  } | null;
  error: RepositoriesError | undefined;
} => {
  const identityApi = useApi(identityApiRef);
  const configApi = useApi(configApiRef);
  const bulkImportApi = useApi(bulkImportApiRef);

  const { value: user } = useAsync(async () => {
    const identityRef = await identityApi.getBackstageIdentity();
    return identityRef.userEntityRef;
  });

  const { value: baseUrl } = useAsync(async () => {
    const url = configApi.getString('app.baseUrl');
    return url;
  });

  const fetchRepositories = async (queryOptions: DataFetcherQueryParams) => {
    if (queryOptions?.showOrganizations) {
      return await bulkImportApi.dataFetcher(
        queryOptions?.page ?? 0,
        queryOptions?.querySize ?? 0,
        queryOptions?.searchString || '',
        queryOptions?.approvalTool,
        {
          fetchOrganizations: true,
        },
      );
    }
    if (queryOptions?.orgName) {
      return await bulkImportApi.dataFetcher(
        queryOptions?.page ?? 0,
        queryOptions?.querySize ?? 0,
        queryOptions?.searchString || '',
        queryOptions?.approvalTool,
        {
          orgName: queryOptions?.orgName,
        },
      );
    }
    return await bulkImportApi.dataFetcher(
      queryOptions?.page ?? 0,
      queryOptions?.querySize ?? 0,
      queryOptions?.searchString || '',
      queryOptions?.approvalTool,
    );
  };

  const {
    data: value,
    error,
    isLoading: isQueryLoading,
  } = useQuery(
    [options?.showOrganizations ? 'organizations' : 'repositories', options],
    () => fetchRepositories(options),
    { refetchInterval: pollInterval || 60000, refetchOnWindowFocus: false },
  );

  const prepareData = useMemo(() => {
    if (options?.showOrganizations) {
      return prepareDataForOrganizations(value as OrgAndRepoResponse);
    }
    return prepareDataForRepositories(
      value as OrgAndRepoResponse,
      user || 'user:default/guest',
      baseUrl || '',
    );
  }, [options?.showOrganizations, value, user, baseUrl]);

  return {
    loading: isQueryLoading,
    data: prepareData,
    error: {
      ...(error ?? {}),
      ...((value?.errors && value.errors.length > 0) ||
      (value as any as Response)?.statusText
        ? { errors: value?.errors || (value as any as Response)?.statusText }
        : {}),
    } as RepositoriesError,
  };
};
