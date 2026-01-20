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

import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
  createApiRef,
} from '@backstage/core-plugin-api';
import type { OpenIdConnectApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  K8sResourceCommonWithClusterInfo,
  ClusterError,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useKonfluxConfig } from './useKonfluxConfig';

export const oidcAuthApiRef = createApiRef<OpenIdConnectApi>({
  id: 'internal.auth.oidc',
});

export interface ResourcesResponse<
  TResource extends K8sResourceCommonWithClusterInfo,
> {
  data: TResource[];
  clusterErrors?: ClusterError[];
  continuationToken?: string;
}

export interface UseKonfluxResourcesReturn<
  TResource extends K8sResourceCommonWithClusterInfo,
> {
  data?: TResource[];
  loaded: boolean;
  isFetching: boolean;
  error?: string;
  clusterErrors?: ClusterError[];
  refetch: () => void;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export interface UseKonfluxResourcesOptions {
  subcomponent?: string;
  clusters?: string[];
  application?: string;
  enabled?: boolean;
}

/**
 * Generate query key for react-query caching
 * this ensures same queries are deduplicated and cached together
 */
function getQueryKey(
  resource: string,
  entityRef: string,
  options?: UseKonfluxResourcesOptions,
) {
  return [
    'konflux',
    'resources',
    resource,
    entityRef,
    options?.subcomponent,
    options?.clusters?.join(','),
    options?.application,
  ] as const;
}

async function fetchKonfluxResources<
  TResource extends K8sResourceCommonWithClusterInfo,
>(
  resource: string,
  entityRef: string,
  baseUrl: string,
  fetch: typeof globalThis.fetch,
  options?: UseKonfluxResourcesOptions,
  continuationToken?: string,
  oidcToken?: string,
): Promise<ResourcesResponse<TResource>> {
  const params = new URLSearchParams();
  if (options?.subcomponent) {
    params.append('subcomponent', options.subcomponent);
  }
  if (options?.clusters?.length) {
    params.append('clusters', options.clusters.join(','));
  }
  if (options?.application) {
    params.append('application', options.application);
  }
  if (continuationToken) {
    params.append('continuationToken', continuationToken);
  }

  const queryString = params.toString();
  const resourcePath = `/entity/${encodeURIComponent(
    entityRef,
  )}/resource/${resource}`;
  const url = queryString
    ? `${baseUrl}${resourcePath}?${queryString}`
    : `${baseUrl}${resourcePath}`;

  const headers: HeadersInit = {};
  if (oidcToken) {
    headers['X-OIDC-Token'] = oidcToken;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

export const useKonfluxResource = <
  TResource extends K8sResourceCommonWithClusterInfo,
>(
  resource: string,
  options?: {
    enabled?: boolean;
    subcomponent?: string;
    clusters?: string[];
    application?: string;
  },
): UseKonfluxResourcesReturn<TResource> => {
  const { entity } = useEntity();
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);
  const konfluxConfig = useKonfluxConfig();

  const oidcApi = useApi(oidcAuthApiRef);

  const entityRef = entity ? stringifyEntityRef(entity) : '';

  const query = useInfiniteQuery({
    queryKey: getQueryKey(resource, entityRef, options),
    queryFn: async ({ pageParam }) => {
      const baseUrl = await discoveryApi.getBaseUrl('konflux');

      let oidcToken: string | undefined;
      if (konfluxConfig?.authProvider === 'oidc') {
        try {
          if (oidcApi && typeof oidcApi.getIdToken === 'function') {
            oidcToken = await oidcApi.getIdToken();
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Failed to get OIDC token:', error);
        }
      }

      return fetchKonfluxResources<TResource>(
        resource,
        entityRef,
        baseUrl,
        fetch,
        options,
        pageParam as string | undefined,
        oidcToken,
      );
    },
    getNextPageParam: lastPage => lastPage.continuationToken,
    initialPageParam: undefined as string | undefined,
    enabled: !!entity && !!resource && options?.enabled !== false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const allData = query.data?.pages.flatMap(page => page.data) ?? [];
  const clusterErrors =
    query.data?.pages?.[query.data.pages.length - 1]?.clusterErrors;

  return {
    data: allData,
    loaded: query.isSuccess || query.isError || !query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : undefined,
    clusterErrors,
    refetch: () => query.refetch(),
    loadMore: async () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        await query.fetchNextPage();
      }
    },
    hasMore: query.hasNextPage ?? false,
  };
};
