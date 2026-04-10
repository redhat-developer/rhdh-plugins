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
  useApiHolder,
} from '@backstage/core-plugin-api';
import { scmAuthApiRef } from '@backstage/integration-react';

import { useQuery } from '@tanstack/react-query';

import { bulkImportApiRef } from '../api/BulkImportBackendClient';
import {
  AddRepositoryData,
  APITypes,
  ApprovalTool,
  DataFetcherQueryParams,
  OrgAndRepoResponse,
  RepositoriesError,
} from '../types';
import {
  prepareDataForOrganizations,
  prepareDataForRepositories,
} from '../utils/repository-utils';

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
  const apiHolder = useApiHolder();
  const scmAuth = apiHolder.get(scmAuthApiRef);

  const { value: user } = useAsync(async () => {
    const identityRef = await identityApi.getBackstageIdentity();
    return identityRef.userEntityRef;
  });

  const { value: baseUrl } = useAsync(async () => {
    const url = configApi.getString('app.baseUrl');
    return url;
  });

  const {
    value: scmAuthTokens,
    loading: tokenLoading,
    error: tokenFetchError,
  } = useAsync(async () => {
    if (!scmAuth) return undefined;
    const hosts = await bulkImportApi.getSCMHosts();
    if (!hosts || hosts instanceof Response || !('github' in hosts))
      return undefined;
    const urls =
      options.approvalTool === ApprovalTool.Gitlab
        ? hosts.gitlab
        : hosts.github;

    if (!urls?.length) return undefined;

    const tokenRecord: Record<string, string> = {};
    for (const url of urls) {
      try {
        const { token } = await scmAuth.getCredentials({
          url,
          additionalScope: { repoWrite: false },
        });
        if (token) tokenRecord[url] = token;
      } catch {
        // No OAuth provider registered for this host — skip it.
      }
    }
    if (Object.keys(tokenRecord).length === 0) {
      throw new Error(
        'No user SCM credentials could be obtained. Please ensure your SCM OAuth integration is configured.',
      );
    }
    return tokenRecord;
  }, [scmAuth, bulkImportApi, options.approvalTool]);

  const fetchRepositories = async (queryOptions: DataFetcherQueryParams) => {
    const apiOptions: APITypes = {
      ...(queryOptions.showOrganizations && { fetchOrganizations: true }),
      ...(queryOptions.orgName && { orgName: queryOptions.orgName }),
      scmAuthTokens,
    };
    return bulkImportApi.dataFetcher(
      queryOptions.page ?? 0,
      queryOptions.querySize ?? 0,
      queryOptions.searchString ?? '',
      queryOptions.approvalTool,
      apiOptions,
    );
  };

  const scmAuthHosts = useMemo(
    () =>
      Object.keys(scmAuthTokens ?? {})
        .sort((a, b) => a.localeCompare(b))
        .join(','),
    [scmAuthTokens],
  );

  const {
    data: value,
    error,
    isLoading: isQueryLoading,
  } = useQuery(
    [
      options?.showOrganizations ? 'organizations' : 'repositories',
      options,
      scmAuthHosts,
    ],
    () => fetchRepositories(options),
    {
      enabled: !tokenLoading && !tokenFetchError,
      refetchInterval: pollInterval || 60000,
      refetchOnWindowFocus: false,
    },
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
    loading: tokenLoading || isQueryLoading,
    data: prepareData,
    error: {
      ...(tokenFetchError ? { errors: [tokenFetchError.message] } : {}),
      ...(error ?? {}),
      ...((value?.errors && value.errors.length > 0) ||
      (value as any as Response)?.statusText
        ? { errors: value?.errors || (value as any as Response)?.statusText }
        : {}),
    } as RepositoriesError,
  };
};
