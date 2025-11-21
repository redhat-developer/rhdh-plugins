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

import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { BackstageCredentials } from '@backstage/backend-plugin-api';
import {
  konfluxResourceModels,
  SubcomponentClusterConfig,
  Filters,
  K8sResourceCommonWithClusterInfo,
  PAGINATION_CONFIG,
  ClusterError,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

import {
  createResourceWithClusterInfo,
  filterResourcesByApplication,
} from '../helpers/kubernetes';
import {
  determineClusterNamespaceCombinations,
  getKonfluxConfig,
} from '../helpers/config';

import {
  decodeContinuationToken,
  encodeContinuationToken,
  PaginationState,
} from '../helpers/pagination';
import { buildLabelSelector } from '../helpers/label-selector';
import { FetchContext, ResourceFetcherService } from './resource-fetcher';
import { KonfluxLogger } from '../helpers/logger';
import { validateUserEmailForImpersonation } from '../helpers/validation';
import { extractKubernetesErrorDetails } from '../helpers/error-extraction';

export interface AggregatedResourcesResponse {
  data: K8sResourceCommonWithClusterInfo[];
  metadata?: {
    totalLoaded: number;
    clustersQueried: string[];
    possiblyMoreData: boolean;
  };
  clusterErrors?: ClusterError[];
  continuationToken?: string;
}

export class KonfluxService {
  private readonly konfluxLogger: KonfluxLogger;
  private readonly catalog?: CatalogService;
  private readonly config: Config;
  private readonly resourceFetcher: ResourceFetcherService;

  constructor(config: Config, logger: LoggerService, catalog: CatalogService) {
    this.konfluxLogger = new KonfluxLogger(logger);
    this.catalog = catalog;
    this.config = config;
    this.resourceFetcher = new ResourceFetcherService(logger);
  }

  static fromConfig(
    config: Config,
    logger: LoggerService,
    catalog: CatalogService,
  ): KonfluxService {
    return new KonfluxService(config, logger, catalog);
  }

  /**
   * Aggregate resources from multiple clusters based on entity configuration
   */
  async aggregateResources(
    entityRef: string,
    resource: string,
    credentials: BackstageCredentials,
    userEmail: string,
    filters?: Filters,
    oidcToken?: string,
    userEntityRef?: string,
  ): Promise<AggregatedResourcesResponse> {
    if (!this.catalog) {
      this.konfluxLogger.error('Catalog service not available', undefined, {
        entityRef,
        resource,
      });
      throw new Error('Catalog service not available');
    }

    // Create validated filters with page size
    const validatedFilters = {
      ...filters,
      limitPerCluster: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    };

    // fetch the main entity
    const entity = await this.catalog.getEntityByRef(entityRef, {
      credentials,
    });
    if (!entity) {
      this.konfluxLogger.error('Entity not found', undefined, {
        entityRef,
        resource,
      });
      throw new Error(`Entity not found: ${entityRef}`);
    }

    const konfluxConfig = await getKonfluxConfig(
      this.config,
      entity,
      credentials,
      this.catalog,
      this.konfluxLogger,
    );

    // determine cluster-namespace combinations
    let combinations = await determineClusterNamespaceCombinations(
      entity,
      credentials,
      konfluxConfig,
      this.konfluxLogger,
      this.catalog,
    );

    if (combinations.length === 0) {
      this.konfluxLogger.warn('No cluster-namespace combinations found', {
        entityRef,
        resource,
      });
      return { data: [] };
    }

    if (filters?.subcomponent) {
      const beforeCount = combinations.length;
      combinations = combinations.filter(
        c => c.subcomponent === filters.subcomponent,
      );
      this.konfluxLogger.debug('Applied subcomponent filter', {
        entityRef,
        resource,
        subcomponent: filters.subcomponent,
        beforeCount,
        afterCount: combinations.length,
      });
    }

    if (filters?.clusters && filters.clusters.length > 0) {
      const beforeCount = combinations.length;
      combinations = combinations.filter(c =>
        filters.clusters?.includes(c.cluster),
      );
      this.konfluxLogger.debug('Applied cluster filter', {
        entityRef,
        resource,
        clusters: filters.clusters,
        beforeCount,
        afterCount: combinations.length,
      });
    }

    // decode continuation token to get pagination state for each source
    let paginationState: PaginationState = {};
    const isLoadMoreRequest = !!validatedFilters?.continuationToken;

    const userId = userEntityRef || userEmail || 'unknown';

    if (validatedFilters?.continuationToken) {
      try {
        paginationState = decodeContinuationToken(
          validatedFilters.continuationToken,
          userId,
        );
      } catch (error) {
        this.konfluxLogger.error('Failed to decode continuation token', error, {
          userId,
          entityRef,
          resource,
        });
        throw error instanceof Error
          ? error
          : new Error('Invalid continuation token');
      }
    }

    // fetch resources from all clusters in parallel
    const aggregatedData: K8sResourceCommonWithClusterInfo[] = [];
    const clusterErrors: ClusterError[] = [];

    // Track new pagination tokens for next page
    const newPaginationState: PaginationState = {};

    const resourceModel = konfluxResourceModels[resource];

    if (!resourceModel) {
      this.konfluxLogger.error('Invalid resource type', undefined, {
        entityRef,
        resource,
        availableResources: Object.keys(konfluxResourceModels),
      });
      throw new Error(`Invalid resource type: ${resource}`);
    }

    // Create fetch promises for all resource types across all combinations
    const fetchPromises = combinations.map(async combination => {
      const sourceKey = `${combination.cluster}:${combination.namespace}`;

      // ceck if source is exhausted (for Load More requests)
      const sourceState = paginationState[sourceKey] || {};
      const hasAnyToken = sourceState.k8sToken || sourceState.kubearchiveToken;

      if (isLoadMoreRequest && !hasAnyToken) {
        return null;
      }

      if (!konfluxConfig) {
        this.konfluxLogger.warn('Konflux config missing for fetch', {
          entityRef,
          resource,
          cluster: combination.cluster,
          namespace: combination.namespace,
        });
        return null;
      }

      try {
        const labelSelector = buildLabelSelector(
          resource,
          combination,
          filters,
        );

        // Validate email if impersonation is required
        const validatedEmail = validateUserEmailForImpersonation(
          userEmail,
          konfluxConfig?.authProvider,
        );

        const fetchContext: FetchContext = {
          cluster: combination.cluster,
          namespace: combination.namespace,
          userEmail: validatedEmail,
          konfluxConfig,
          resourceModel,
          credentials,
          oidcToken,
        };

        const { items, newPaginationState: updatedState } =
          await this.resourceFetcher.fetchFromSource(
            fetchContext,
            sourceState,
            {
              limit: validatedFilters?.limitPerCluster,
              labelSelector,
            },
          );

        if (this.resourceFetcher.hasMoreData(updatedState)) {
          newPaginationState[sourceKey] = updatedState;
        }

        const filteredItems = this.applyInMemoryFiltering(
          items,
          combination,
          resource,
          filters,
          labelSelector,
        );

        return {
          combination,
          resource,
          items: filteredItems,
        };
      } catch (error) {
        // Determine error source based on pagination state
        // If we have kubearchiveToken but no k8sToken, error likely from kubearchive
        // Otherwise, default to kubernetes
        const errorSource: 'kubernetes' | 'kubearchive' =
          sourceState.kubearchiveToken && !sourceState.k8sToken
            ? 'kubearchive'
            : 'kubernetes';

        // Extract detailed error information
        const errorDetails = extractKubernetesErrorDetails(
          error,
          resourceModel,
          combination.namespace,
          errorSource,
        );

        this.konfluxLogger.error(
          `Error fetching ${resource} from ${combination.cluster}/${combination.namespace}`,
          error,
          {
            cluster: combination.cluster,
            namespace: combination.namespace,
            resource,
            errorType: errorDetails.errorType,
            statusCode: errorDetails.statusCode,
            source: errorSource,
          },
        );

        clusterErrors.push({
          cluster: combination.cluster,
          namespace: combination.namespace,
          errorType: errorDetails.errorType,
          message: errorDetails.message,
          statusCode: errorDetails.statusCode,
          reason: errorDetails.reason,
          resourcePath: errorDetails.resourcePath,
          source: errorDetails.source,
        });
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);

    const possiblyMoreData = validatedFilters?.limitPerCluster
      ? results.some(
          result => result?.items?.length === validatedFilters?.limitPerCluster,
        )
      : false;

    // aggregate the results
    for (const result of results) {
      if (result && result.items) {
        const clusterInfo = konfluxConfig?.clusters[result.combination.cluster];
        const enrichedItems = result.items.map(
          (item: K8sResourceCommonWithClusterInfo) =>
            createResourceWithClusterInfo(
              item,
              result.combination.cluster,
              result.combination.subcomponent,
              clusterInfo?.uiUrl,
            ),
        );

        aggregatedData.push(...enrichedItems);
      }
    }

    // Sort by creation timestamp (newest first) across all sources
    aggregatedData.sort((a, b) => {
      const timeA = a.metadata?.creationTimestamp
        ? new Date(a.metadata.creationTimestamp).getTime()
        : 0;
      const timeB = b.metadata?.creationTimestamp
        ? new Date(b.metadata.creationTimestamp).getTime()
        : 0;
      return timeB - timeA; // Descending (newest first)
    });

    // Generate continuation token if there are more pages available
    const hasMoreData = Object.keys(newPaginationState).length > 0;
    const continuationToken = hasMoreData
      ? encodeContinuationToken(newPaginationState, userId)
      : undefined;

    if (continuationToken) {
      this.konfluxLogger.debug('Returning continuation token', {
        sourceCount: Object.keys(newPaginationState).length,
        entityRef,
        resource,
      });
    }

    this.konfluxLogger.info('Aggregation completed', {
      entityRef,
      resource,
      totalItems: aggregatedData.length,
      clustersQueried: combinations.map(c => c.cluster),
      clusterErrors: clusterErrors.length,
      hasContinuationToken: !!continuationToken,
    });

    return {
      data: aggregatedData,
      metadata: {
        totalLoaded: aggregatedData.length,
        clustersQueried: combinations.map(c => c.cluster),
        possiblyMoreData,
      },
      clusterErrors: clusterErrors.length > 0 ? clusterErrors : undefined,
      continuationToken,
    };
  }

  private applyInMemoryFiltering(
    items: K8sResourceCommonWithClusterInfo[],
    combination: SubcomponentClusterConfig,
    resource: string,
    filters: Filters | undefined,
    labelSelector: string | undefined,
  ): K8sResourceCommonWithClusterInfo[] {
    const needsInMemoryFiltering = !labelSelector;

    if (!needsInMemoryFiltering || !combination.applications?.length) {
      return items;
    }

    let filteredApplications = combination.applications;
    if (filters?.application) {
      filteredApplications = combination.applications.filter(
        app => app === filters.application,
      );
    }

    if (!filteredApplications.length) {
      return [];
    }

    const filtered = filterResourcesByApplication(
      items,
      resource,
      filteredApplications,
    );

    this.konfluxLogger.debug('In-memory filtered resources', {
      resource,
      filteredCount: filtered.length,
      totalCount: items.length,
      applications: filteredApplications.join(', '),
    });

    return filtered;
  }
}
