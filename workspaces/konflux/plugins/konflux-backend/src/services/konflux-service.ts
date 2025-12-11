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
import { Config } from '@backstage/config';
import { CatalogService } from '@backstage/plugin-catalog-node';
import {
  konfluxResourceModels,
  SubcomponentClusterConfig,
  Filters,
  K8sResourceCommonWithClusterInfo,
  PAGINATION_CONFIG,
  ClusterError,
  GroupVersionKind,
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

/**
 * Options for fetching resources for a combination
 */
interface FetchCombinationOptions {
  combination: SubcomponentClusterConfig;
  resource: string;
  resourceModel: GroupVersionKind;
  konfluxConfig: any;
  filters: Filters | undefined;
  validatedFilters: Filters & { limitPerCluster?: number };
  paginationState: PaginationState;
  isLoadMoreRequest: boolean;
  userEmail: string;
  credentials: BackstageCredentials;
  oidcToken: string | undefined;
  newPaginationState: PaginationState;
  clusterErrors: ClusterError[];
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
   * apply filters to cluster-namespace combinations
   */
  private applyFiltersToCombinations(
    combinations: SubcomponentClusterConfig[],
    filters: Filters | undefined,
    entityRef: string,
    resource: string,
  ): SubcomponentClusterConfig[] {
    const beforeFilterCount = combinations.length;
    const filtered = combinations.filter(combination => {
      if (
        filters?.subcomponent &&
        combination.subcomponent !== filters.subcomponent
      ) {
        return false;
      }
      if (
        filters?.clusters?.length &&
        !filters.clusters.includes(combination.cluster)
      ) {
        return false;
      }
      return true;
    });

    if (filtered.length !== beforeFilterCount) {
      this.konfluxLogger.debug('Applied filters', {
        entityRef,
        resource,
        subcomponent: filters?.subcomponent,
        clusters: filters?.clusters,
        beforeCount: beforeFilterCount,
        afterCount: filtered.length,
      });
    }

    return filtered;
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

    if (!konfluxConfig) {
      this.konfluxLogger.warn('No Konflux configuration found', {
        entityRef,
        resource,
      });
      return { data: [] };
    }

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

    // apply filters to combinations
    combinations = this.applyFiltersToCombinations(
      combinations,
      filters,
      entityRef,
      resource,
    );

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
    const fetchPromises = combinations.map(combination =>
      this.fetchResourcesForCombination({
        combination,
        resource,
        resourceModel,
        konfluxConfig,
        filters,
        validatedFilters,
        paginationState,
        isLoadMoreRequest,
        userEmail,
        credentials,
        oidcToken,
        newPaginationState,
        clusterErrors,
      }),
    );

    const results = await Promise.all(fetchPromises);

    const possiblyMoreData = validatedFilters?.limitPerCluster
      ? results.some(
          result => result?.items?.length === validatedFilters?.limitPerCluster,
        )
      : false;

    // aggregate the results
    const aggregatedData = results
      .filter((r): r is NonNullable<typeof r> => !!r && !!r.items)
      .flatMap(result => {
        const clusterInfo = konfluxConfig.clusters[result.combination.cluster];
        return result.items.map((item: K8sResourceCommonWithClusterInfo) =>
          createResourceWithClusterInfo(
            item,
            result.combination.cluster,
            result.combination.subcomponent,
            clusterInfo?.uiUrl,
          ),
        );
      });

    // Sort by creation timestamp (newest first) across all sources
    aggregatedData.sort((a, b) => {
      const timeA = this.getCreationTimestamp(a);
      const timeB = this.getCreationTimestamp(b);
      return timeB - timeA; // descending (newest first)
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

    const clustersQueried = combinations.map(c => c.cluster);

    this.konfluxLogger.info('Aggregation completed', {
      entityRef,
      resource,
      totalItems: aggregatedData.length,
      clustersQueried,
      clusterErrors: clusterErrors.length,
      hasContinuationToken: !!continuationToken,
    });

    return {
      data: aggregatedData,
      metadata: {
        totalLoaded: aggregatedData.length,
        clustersQueried,
        possiblyMoreData,
      },
      clusterErrors: clusterErrors.length > 0 ? clusterErrors : undefined,
      continuationToken,
    };
  }

  /**
   * Fetch resources for a single cluster-namespace combination
   */
  private async fetchResourcesForCombination(
    options: FetchCombinationOptions,
  ): Promise<{
    combination: SubcomponentClusterConfig;
    resource: string;
    items: K8sResourceCommonWithClusterInfo[];
  } | null> {
    const {
      combination,
      resource,
      resourceModel,
      konfluxConfig,
      filters,
      validatedFilters,
      paginationState,
      isLoadMoreRequest,
      userEmail,
      credentials,
      oidcToken,
      newPaginationState,
      clusterErrors,
    } = options;
    const sourceKey = `${combination.cluster}:${combination.namespace}`;
    const sourceState = paginationState[sourceKey] || {};
    const hasAnyToken = sourceState.k8sToken || sourceState.kubearchiveToken;

    if (isLoadMoreRequest && !hasAnyToken) {
      return null;
    }

    try {
      const labelSelector = buildLabelSelector(resource, combination, filters);

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
        await this.resourceFetcher.fetchFromSource(fetchContext, sourceState, {
          limit: validatedFilters?.limitPerCluster,
          labelSelector,
        });

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
      const clusterError = this.handleFetchError(
        error,
        sourceState,
        resourceModel,
        combination,
        resource,
      );
      clusterErrors.push(clusterError);
      return null;
    }
  }

  /**
   * Handles fetch errors and returns a ClusterError object
   */
  private handleFetchError(
    error: Error | undefined,
    sourceState: { k8sToken?: string; kubearchiveToken?: string },
    resourceModel: GroupVersionKind,
    combination: SubcomponentClusterConfig,
    resource: string,
  ): ClusterError {
    // Determine error source based on pagination state
    // If we have kubearchiveToken but no k8sToken, error likely from kubearchive
    // Otherwise, default to kubernetes
    const errorSource: 'kubernetes' | 'kubearchive' =
      sourceState.kubearchiveToken && !sourceState.k8sToken
        ? 'kubearchive'
        : 'kubernetes';

    // extract detailed error information
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

    return {
      cluster: combination.cluster,
      namespace: combination.namespace,
      errorType: errorDetails.errorType,
      message: errorDetails.message,
      statusCode: errorDetails.statusCode,
      reason: errorDetails.reason,
      resourcePath: errorDetails.resourcePath,
      source: errorDetails.source,
    };
  }

  /**
   * Extracts creation timestamp from resource metadata
   */
  private getCreationTimestamp(
    resource: K8sResourceCommonWithClusterInfo,
  ): number {
    return resource.metadata?.creationTimestamp
      ? new Date(resource.metadata.creationTimestamp).getTime()
      : 0;
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
