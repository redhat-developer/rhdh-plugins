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
  LoggerService,
  BackstageCredentials,
} from '@backstage/backend-plugin-api';
import { CustomObjectsApi } from '@kubernetes/client-node';
import {
  GroupVersionKind,
  K8sResourceCommonWithClusterInfo,
  KonfluxConfig,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { KubearchiveService } from './kubearchive-service';
import uniqBy from 'lodash/uniqBy';
import { createKubeConfig } from '../helpers/client-factory';
import { KonfluxLogger } from '../helpers/logger';
import { getAuthToken } from '../helpers/auth';

/**
 * Options for fetching resources from a single source
 */
export interface FetchOptions {
  limit?: number;
  labelSelector?: string;
  continue?: string;
}

/**
 * Result of fetching resources from a source
 */
export interface FetchResult {
  items: K8sResourceCommonWithClusterInfo[];
  continueToken?: string;
}

/**
 * State for tracking pagination across K8s and Kubearchive sources
 */
export interface SourcePaginationState {
  k8sToken?: string;
  kubearchiveToken?: string;
}

/**
 * Context needed to fetch from a specific source
 */
export interface FetchContext {
  cluster: string;
  namespace: string;
  userEmail: string;
  konfluxConfig: KonfluxConfig;
  resourceModel: GroupVersionKind;
  credentials?: BackstageCredentials;
  oidcToken?: string;
}

const AVAILABLE_KUBEARCHIVE_RESOURCES_TO_FETCH = new Set([
  'pipelineruns',
  'releases',
]);

/**
 * Service responsible for fetching Kubernetes resources from multiple sources
 * (live K8s clusters and Kubearchive) with pagination support.
 */
export class ResourceFetcherService {
  private readonly konfluxLogger: KonfluxLogger;
  private readonly kubearchiveService: KubearchiveService;

  constructor(logger: LoggerService) {
    this.konfluxLogger = new KonfluxLogger(logger);
    this.kubearchiveService = new KubearchiveService(logger);
  }

  /**
   * Fetch resources from live Kubernetes API using CustomObjectsApi.
   *
   * Handles authentication based on authProvider:
   * - 'impersonationHeaders': Uses serviceAccountToken with Impersonate-User header
   * - 'serviceAccount': Uses serviceAccountToken from cluster config
   * - 'oidc': Uses OIDC token from context
   *
   * Supports pagination via continue token, label filtering, and result limiting.
   *
   * @param context - The fetch context containing cluster, namespace, userEmail, konfluxConfig, resourceModel, credentials, and optional oidcToken
   * @param options - Query options including pagination tokens (continue), filters (labelSelector), and limit
   * @returns The fetched items and optional continuation token for pagination
   * @throws Error if authentication fails, cluster not found, or API call fails
   */
  async fetchFromKubernetes(
    context: FetchContext,
    options?: FetchOptions,
  ): Promise<FetchResult> {
    const { cluster, namespace, userEmail, konfluxConfig, resourceModel } =
      context;

    const clusterConfig = konfluxConfig?.clusters[cluster];
    const apiUrl = clusterConfig?.apiUrl || 'unknown';

    const { token, requiresImpersonation } = getAuthToken(
      konfluxConfig,
      clusterConfig,
      context.oidcToken,
      userEmail,
      this.konfluxLogger,
      {
        cluster,
        namespace,
        resource: resourceModel.plural,
      },
    );

    const kc = createKubeConfig(
      konfluxConfig,
      cluster,
      this.konfluxLogger,
      token,
    );
    if (!kc) {
      this.konfluxLogger.error(
        'Failed to create KubeConfig - cluster not found',
        undefined,
        {
          cluster,
          namespace,
          resource: resourceModel.plural,
        },
      );
      throw new Error(`Cluster '${cluster}' not found`);
    }

    try {
      const { apiGroup, apiVersion, plural } = resourceModel;

      const customApi = kc.makeApiClient(CustomObjectsApi);

      const response = await customApi.listNamespacedCustomObject(
        apiGroup,
        apiVersion,
        namespace,
        plural,
        undefined,
        undefined,
        options?.continue,
        undefined,
        options?.labelSelector,
        options?.limit,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            ...(requiresImpersonation && {
              'Impersonate-User': userEmail,
              'Impersonate-Group': 'system:authenticated',
            }),
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const responseBody = response?.body as {
        items: K8sResourceCommonWithClusterInfo[];
        metadata?: { continue?: string };
      };

      const items = responseBody?.items || [];
      const continueToken = responseBody?.metadata?.continue;

      this.konfluxLogger.info('Fetched resources from Kubernetes', {
        cluster,
        namespace,
        resource: plural,
        itemCount: items.length,
        hasMore: !!continueToken,
        apiUrl,
      });

      return { items, continueToken };
    } catch (error) {
      this.konfluxLogger.error(
        `Error fetching ${resourceModel.plural} from ${cluster}/${namespace}`,
        error,
        {
          cluster,
          namespace,
          resource: resourceModel.plural,
          apiGroup: resourceModel.apiGroup,
          apiVersion: resourceModel.apiVersion,
        },
      );
      throw error;
    }
  }

  /**
   * Fetch resources from Kubearchive .
   *
   * Delegates to KubearchiveService to fetch archived resources with pagination
   * and label filtering support.
   *
   * @param context - The fetch context containing cluster, namespace, userEmail, konfluxConfig, resourceModel, credentials, and optional oidcToken
   * @param pageSize - Maximum number of items to fetch per page
   * @param pageToken - Optional pagination token from previous request
   * @param labelSelector - Optional Kubernetes label selector for filtering resources
   * @returns The fetched items and optional next page token for continued pagination
   */
  async fetchFromKubearchive(
    context: FetchContext,
    pageSize?: number,
    pageToken?: string,
    labelSelector?: string,
  ): Promise<FetchResult> {
    const { cluster, namespace, userEmail, konfluxConfig, resourceModel } =
      context;

    const { results, nextPageToken } =
      await this.kubearchiveService.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup: resourceModel.apiGroup,
        apiVersion: resourceModel.apiVersion,
        resource: resourceModel.plural,
        namespace,
        options: {
          pageSize,
          pageToken,
          labelSelector,
        },
        oidcToken: context.oidcToken,
      });

    return {
      items: results || [],
      continueToken: nextPageToken,
    };
  }

  /**
   * Check if Kubearchive is available for this resource type and cluster.
   *
   * Kubearchive is available when:
   * - Resource type is in AVAILABLE_KUBEARCHIVE_RESOURCES_TO_FETCH (pipelineruns, releases)
   * - Namespace is provided
   * - Cluster config has kubearchiveApiUrl configured
   *
   * @param resourceModel - The resource type to check
   * @param namespace - The namespace to check
   * @param clusterConfig - The cluster configuration
   * @returns True if Kubearchive is available, false otherwise
   */
  private hasKubearchive(
    resourceModel: GroupVersionKind,
    namespace: string,
    clusterConfig: any,
  ): boolean {
    return (
      AVAILABLE_KUBEARCHIVE_RESOURCES_TO_FETCH.has(resourceModel.plural) &&
      !!namespace &&
      !!clusterConfig?.kubearchiveApiUrl
    );
  }

  /**
   * cntinue pagination from Kubearchive when K8s is exhausted
   */
  private async continueFromKubearchive(
    context: FetchContext,
    kubearchiveToken: string,
    options?: FetchOptions,
  ): Promise<{
    items: K8sResourceCommonWithClusterInfo[];
    newPaginationState: SourcePaginationState;
  }> {
    this.konfluxLogger.debug('Continuing pagination from Kubearchive', {
      cluster: context.cluster,
      namespace: context.namespace,
      resource: context.resourceModel.plural,
    });

    const { items, continueToken } = await this.fetchFromKubearchive(
      context,
      options?.limit,
      kubearchiveToken,
      options?.labelSelector,
    );

    return {
      items,
      newPaginationState: continueToken
        ? { kubearchiveToken: continueToken }
        : {},
    };
  }

  /**
   * Merge K8s and Kubearchive results when K8s is exhausted
   */
  private async mergeKubearchiveResults(
    context: FetchContext,
    k8sItems: K8sResourceCommonWithClusterInfo[],
    options?: FetchOptions,
  ): Promise<{
    items: K8sResourceCommonWithClusterInfo[];
    newPaginationState: SourcePaginationState;
  } | null> {
    this.konfluxLogger.debug('k8s exhausted, fetching from Kubearchive', {
      cluster: context.cluster,
      namespace: context.namespace,
      resource: context.resourceModel.plural,
      k8sItemCount: k8sItems.length,
    });

    const limit = options?.limit;
    const remainingLimit =
      limit === undefined ? undefined : limit - k8sItems.length;

    if (
      limit !== undefined &&
      remainingLimit !== undefined &&
      remainingLimit <= 0
    ) {
      return null;
    }

    const { items: kubearchiveItems, continueToken: kaToken } =
      await this.fetchFromKubearchive(
        context,
        remainingLimit,
        undefined,
        options?.labelSelector,
      );

    if (kubearchiveItems.length === 0) {
      return null;
    }

    // merge and deduplicate by resource name
    const mergedItems = uniqBy(
      [...k8sItems, ...kubearchiveItems],
      r => r.metadata?.name,
    );

    this.konfluxLogger.debug('Merged k8s and Kubearchive results', {
      cluster: context.cluster,
      namespace: context.namespace,
      resource: context.resourceModel.plural,
      k8sItemCount: k8sItems.length,
      kubearchiveItemCount: kubearchiveItems.length,
      mergedItemCount: mergedItems.length,
      duplicatesRemoved:
        k8sItems.length + kubearchiveItems.length - mergedItems.length,
    });

    return {
      items: mergedItems,
      newPaginationState: kaToken ? { kubearchiveToken: kaToken } : {},
    };
  }

  /**
   * Fetch resources from a single source (cluster + namespace) with
   * multi-source pagination.
   *
   * Strategy:
   * 1. If kubearchiveToken exists (and no k8sToken) -> Continue from Kubearchive
   * 2. Otherwise -> Fetch from K8s (with optional continue token)
   *    - If K8s has more pages ->return K8s results only
   *    - If K8s exhausted on initial load -> Merge wit Kubearchive results
   *
   * @param context - The fetch context
   * @param paginationState - Current pagination state for this source
   * @param options - Fetch options (limit, labelSelector)
   * @returns Fetched items and updated pagination state
   */
  async fetchFromSource(
    context: FetchContext,
    paginationState: SourcePaginationState = {},
    options?: FetchOptions,
  ): Promise<{
    items: K8sResourceCommonWithClusterInfo[];
    newPaginationState: SourcePaginationState;
  }> {
    const { konfluxConfig, resourceModel } = context;
    const { k8sToken, kubearchiveToken } = paginationState;

    const clusterConfig = konfluxConfig.clusters?.[context.cluster];
    const hasKubearchive = this.hasKubearchive(
      resourceModel,
      context.namespace,
      clusterConfig,
    );

    // case 1: continue from Kubearchive (k8s already exhausted)
    if (kubearchiveToken && !k8sToken && hasKubearchive) {
      return this.continueFromKubearchive(context, kubearchiveToken, options);
    }

    // case 2: fetch from K8s (either continuing or initial load)
    const { items: k8sItems, continueToken } = await this.fetchFromKubernetes(
      context,
      { ...options, continue: k8sToken },
    );

    // if K8s has more pages, return K8s results and save token
    if (continueToken) {
      return {
        items: k8sItems,
        newPaginationState: { k8sToken: continueToken },
      };
    }

    // k8s exhausted - if this was initial load, try to fill from Kubearchiv
    if (hasKubearchive && !k8sToken) {
      const mergedResult = await this.mergeKubearchiveResults(
        context,
        k8sItems,
        options,
      );
      if (mergedResult) {
        return mergedResult;
      }
    }

    // k8s exhausted and no Kubearchive
    return {
      items: k8sItems,
      newPaginationState: {},
    };
  }

  /**
   * Check if a source has more data available for pagination.
   *
   * Returns true if either k8sToken or kubearchiveToken exists in the pagination state,
   * indicating there are more pages to fetch.
   *
   * @param paginationState - The pagination state for a source (cluster + namespace)
   * @returns True if there are more pages available, false if pagination is complete
   */
  hasMoreData(paginationState: SourcePaginationState): boolean {
    return !!(paginationState.k8sToken || paginationState.kubearchiveToken);
  }
}
