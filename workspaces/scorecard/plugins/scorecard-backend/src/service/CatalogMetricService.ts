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
  MetricResult,
  ThresholdConfig,
  AggregatedMetric,
  EntityMetricDetailResponse,
  EntityMetricDetail,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { Entity } from '@backstage/catalog-model';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { NotFoundError, stringifyError } from '@backstage/errors';
import {
  AuthService,
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { filterAuthorizedMetrics } from '../permissions/permissionUtils';
import {
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { DatabaseMetricValues } from '../database/DatabaseMetricValues';
import { mergeEntityAndProviderThresholds } from '../utils/mergeEntityAndProviderThresholds';
import { AggregatedMetricMapper } from './mappers';
import { DbMetricValue } from '../database/types';

type CatalogMetricServiceOptions = {
  catalog: CatalogService;
  auth: AuthService;
  registry: MetricProvidersRegistry;
  database: DatabaseMetricValues;
  logger: LoggerService;
};

export class CatalogMetricService {
  private readonly logger: LoggerService;

  private readonly catalog: CatalogService;
  private readonly auth: AuthService;
  private readonly registry: MetricProvidersRegistry;
  private readonly database: DatabaseMetricValues;

  private static readonly MAX_FETCHABLE_ROWS = 10_000;
  private static readonly BATCH_SIZE = 100;

  constructor(options: CatalogMetricServiceOptions) {
    this.catalog = options.catalog;
    this.auth = options.auth;
    this.registry = options.registry;
    this.database = options.database;
    this.logger = options.logger;
  }

  /**
   * Get latest metric results for a specific catalog entity and metric providers.
   *
   * @param entityRef - Entity reference in format "kind:namespace/name"
   * @param providerIds - Optional array of provider IDs to get latest metrics of.
   *                      If not provided, gets all available latest metrics.
   * @param filter - Permission filter
   * @returns Metric results with entity-specific thresholds applied
   */
  async getLatestEntityMetrics(
    entityRef: string,
    providerIds?: string[],
    filter?: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    >,
  ): Promise<MetricResult[]> {
    const entity = await this.catalog.getEntityByRef(entityRef, {
      credentials: await this.auth.getOwnServiceCredentials(),
    });
    if (!entity) {
      throw new NotFoundError(`Entity not found: ${entityRef}`);
    }

    const metricsToFetch = this.registry.listMetrics(providerIds);

    const authorizedMetricsToFetch = filterAuthorizedMetrics(
      metricsToFetch,
      filter,
    );
    const rawResults = await this.database.readLatestEntityMetricValues(
      entityRef,
      authorizedMetricsToFetch.map(m => m.id),
    );

    return rawResults.map(
      ({ metric_id, value, error_message, timestamp, status }) => {
        let thresholds: ThresholdConfig | undefined;
        let thresholdError: string | undefined;

        const provider = this.registry.getProvider(metric_id);
        const metric = provider.getMetric();

        try {
          thresholds = mergeEntityAndProviderThresholds(entity, provider);

          if (value === null) {
            thresholdError =
              'Unable to evaluate thresholds, metric value is missing';
          } else if (error_message) {
            thresholdError = error_message;
          }
        } catch (error) {
          thresholdError = stringifyError(error);
        }

        const isMetricCalcError = error_message !== null && value === null;

        return {
          id: metric.id,
          status: isMetricCalcError ? 'error' : 'success',
          metadata: {
            title: metric.title,
            description: metric.description,
            type: metric.type,
            history: metric.history,
          },
          ...(isMetricCalcError && {
            error:
              error_message ??
              stringifyError(new Error(`Metric value is 'undefined'`)),
          }),
          result: {
            value,
            timestamp: new Date(timestamp).toISOString(),
            thresholdResult: {
              definition: thresholds,
              status: thresholdError ? 'error' : 'success',
              evaluation: status,
              ...(thresholdError && { error: thresholdError }),
            },
          },
        };
      },
    );
  }

  /**
   * Get an aggregated metric for multiple entities and a single metric ID.
   *
   * @param entityRefs - Array of entity references in format "kind:namespace/name"
   * @param metricId - Metric ID to aggregate.
   * @returns Aggregated metric results
   */
  async getAggregatedMetricByEntityRefs(
    entityRefs: string[],
    metricId: string,
  ): Promise<AggregatedMetric> {
    if (entityRefs.length !== 0) {
      const aggregatedMetric =
        await this.database.readAggregatedMetricByEntityRefs(
          entityRefs,
          metricId,
        );

      return AggregatedMetricMapper.toAggregatedMetric(aggregatedMetric);
    }

    return AggregatedMetricMapper.toAggregatedMetric();
  }

  /**
   * Get detailed entity metrics for drill-down with filtering, sorting, and pagination.
   *
   * Fetches individual entity metric values and enriches them with catalog metadata.
   * Supports database-level filtering (status, owner, kind, entityName),
   * database-level sorting, and in-memory pagination over the permission-filtered result set.
   * Returns empty entities if the catalog is unavailable (fail-secure).
   *
   * @param metricId - Metric ID to fetch (e.g., "github.open_prs")
   * @param options - Query options for filtering, sorting, and pagination
   * @param options.status - Filter by threshold status (database-level)
   * @param options.owner - Filter by owner entity reference (database-level)
   * @param options.kind - Filter by entity kind (database-level)
   * @param options.entityName - Substring search against the entity ref `kind:namespace/name` (database-level)
   * @param options.namespace - Substring search against the entity namespace (database-level)
   * @param options.sortBy - Field to sort by (default: "timestamp")
   * @param options.sortOrder - Sort direction: "asc" or "desc" (default: "desc")
   * @param options.page - Page number (1-indexed)
   * @param options.limit - Entities per page (max: 100)
   * @returns Paginated entity metric details with metadata
   */
  async getEntityMetricDetails(
    metricId: string,
    credentials: BackstageCredentials,
    options: {
      status?: 'success' | 'warning' | 'error';
      owner?: string[];
      kind?: string;
      entityName?: string;
      namespace?: string;
      sortBy?:
        | 'entityName'
        | 'owner'
        | 'entityKind'
        | 'timestamp'
        | 'metricValue'
        | 'namespace';
      sortOrder?: 'asc' | 'desc';
      page: number;
      limit: number;
    },
  ): Promise<EntityMetricDetailResponse> {
    // Get metric metadata
    const metric = this.registry.getMetric(metricId);

    // High-page early-exit guard
    if (
      (options.page - 1) * options.limit >=
      CatalogMetricService.MAX_FETCHABLE_ROWS
    ) {
      return {
        metricId: metric.id,
        metricMetadata: {
          title: metric.title,
          description: metric.description,
          type: metric.type,
        },
        entities: [],
        pagination: {
          page: options.page,
          pageSize: options.limit,
          total: 0,
          totalPages: 0,
          isCapped: false,
        },
      };
    }

    // Query database with all DB filters first
    // At the moment, this is going to be an O(MAX_FETCHABLE_ROWS) cost and is intentional to avoid leaking
    // pre-auth counts. MAX_FETCHABLE_ROWS and BATCH_SIZE are to be used as a method to of adjustment to
    // find the right amount of performance
    const rows = await this.database.readEntityMetricsByStatus(metricId, {
      status: options.status,
      entityName: options.entityName,
      entityKind: options.kind,
      entityNamespace: options.namespace,
      entityOwner: options.owner,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      pagination: {
        limit: CatalogMetricService.MAX_FETCHABLE_ROWS,
        offset: 0,
      },
    });

    // Filter to authorized rows by batching through catalog.getEntitiesByRefs with user
    // credentials. The catalog enforces auth natively: null = unauthorized or deleted.
    // We also cache the returned Entity objects so we can enrich the page rows without
    // a second catalog round-trip. Sequential processing preserves DB sort order.
    const entityMap = new Map<string, Entity>();
    const accessibleRows: DbMetricValue[] = [];
    try {
      for (let i = 0; i < rows.length; i += CatalogMetricService.BATCH_SIZE) {
        const batch = rows.slice(i, i + CatalogMetricService.BATCH_SIZE);
        const response = await this.catalog.getEntitiesByRefs(
          {
            entityRefs: batch.map(row => row.catalog_entity_ref),
            fields: [
              'kind',
              'metadata.name',
              'metadata.namespace',
              'spec.owner',
            ],
          },
          { credentials },
        );

        // Filter out the unauthorized entities
        for (let j = 0; j < batch.length; j++) {
          const entity = response.items[j];
          if (!entity) continue; // null = unauthorized or not found, skip
          entityMap.set(batch[j].catalog_entity_ref, entity);
          accessibleRows.push(batch[j]);
        }
      }
    } catch (error) {
      // Fail secure: if the catalog is unavailable we cannot confirm authorization,
      // so return empty rather than potentially unauthorized data.
      this.logger.error('Failed to fetch entities from catalog', { error });
      return {
        metricId: metric.id,
        metricMetadata: {
          title: metric.title,
          description: metric.description,
          type: metric.type,
        },
        entities: [],
        pagination: {
          page: options.page,
          pageSize: options.limit,
          total: 0,
          totalPages: 0,
          isCapped: false,
        },
      };
    }

    // True when DB results were capped; pagination.total may undercount the full dataset.
    const isCapped = rows.length === CatalogMetricService.MAX_FETCHABLE_ROWS;

    // Apply pagination to filtered entities
    const totalFiltered = accessibleRows.length;
    const pageRows = accessibleRows.slice(
      (options.page - 1) * options.limit,
      options.page * options.limit,
    );

    // No rows on this page — either no matching results or the requested page is beyond
    // the last page.
    if (pageRows.length === 0) {
      return {
        metricId: metric.id,
        metricMetadata: {
          title: metric.title,
          description: metric.description,
          type: metric.type,
        },
        entities: [],
        pagination: {
          page: options.page,
          pageSize: options.limit,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / options.limit),
          isCapped,
        },
      };
    }

    // Enrich page rows from the cached entity map
    const enrichedEntities: EntityMetricDetail[] = [];
    for (const row of pageRows) {
      const entity = entityMap.get(row.catalog_entity_ref);
      if (!entity) continue;
      enrichedEntities.push({
        entityRef: row.catalog_entity_ref,
        entityNamespace: entity.metadata.namespace,
        entityName: entity.metadata.name,
        entityKind: entity.kind,
        owner: entity.spec?.owner as string,
        metricValue: row.value,
        timestamp: new Date(row.timestamp).toISOString(),
        status: row.status ?? 'error',
      });
    }

    // Format and return response
    return {
      metricId: metric.id,
      metricMetadata: {
        title: metric.title,
        description: metric.description,
        type: metric.type,
      },
      entities: enrichedEntities,
      pagination: {
        page: options.page,
        pageSize: options.limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / options.limit),
        isCapped,
      },
    };
  }
}
