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
import { Entity } from '@backstage/catalog-model';

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
   * Supports database-level filtering (status, owner, kind, entityName) and
   * database-level sorting and pagination. Falls back to database values if catalog is unavailable.
   *
   * @param metricId - Metric ID to fetch (e.g., "github.open_prs")
   * @param options - Query options for filtering, sorting, and pagination
   * @param options.status - Filter by threshold status (database-level)
   * @param options.owner - Filter by owner entity reference (database-level)
   * @param options.kind - Filter by entity kind (database-level)
   * @param options.entityName - Substring search against the entity ref `kind:namespace/name` (database-level)
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
      sortBy?:
        | 'entityName'
        | 'owner'
        | 'entityKind'
        | 'timestamp'
        | 'metricValue';
      sortOrder?: 'asc' | 'desc';
      page: number;
      limit: number;
    },
  ): Promise<EntityMetricDetailResponse> {
    const dbPagination = {
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
    };

    // Fetch raw metric data from database
    const { rows, total: dbTotal } =
      await this.database.readEntityMetricsByStatus(metricId, {
        status: options.status,
        entityName: options.entityName,
        entityKind: options.kind,
        entityOwner: options.owner,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        pagination: dbPagination,
      });

    // Get metric metadata
    const metric = this.registry.getMetric(metricId);

    // Batch-fetch entities from catalog using user credentials.
    // The catalog enforces catalog.entity.read permissions — entities the user
    // cannot access are returned as null in response.items.
    const entityRefsToFetch = rows.map(row => row.catalog_entity_ref);
    const entityMap = new Map<string, Entity>();

    if (entityRefsToFetch.length > 0) {
      try {
        const response = await this.catalog.getEntitiesByRefs(
          {
            entityRefs: entityRefsToFetch,
            fields: ['kind', 'metadata', 'spec'],
          },
          { credentials },
        );

        // Build map of ref -> entity (null entries = unauthorized, not added to map)
        entityRefsToFetch.forEach((ref, index) => {
          const entity = response.items[index];
          if (entity) {
            entityMap.set(ref, entity);
          }
        });
      } catch (error) {
        // Catalog unavailable — entityMap stays empty, so the filter below removes all rows.
        // Fail secure: authorization cannot be confirmed without the catalog, so no results
        // are returned rather than risking exposure of unauthorized entity metric data.
        this.logger.error('Failed to fetch entities from catalog', { error });
      }
    }

    // Only include entities the catalog confirmed the user can access.
    // Unauthorized entities are returned as null by getEntitiesByRefs and are never added
    // to entityMap, so they are silently excluded here.
    const enrichedEntities: EntityMetricDetail[] = rows
      .filter(row => entityMap.has(row.catalog_entity_ref))
      .map(row => {
        const entity = entityMap.get(row.catalog_entity_ref);
        return {
          entityRef: row.catalog_entity_ref,
          entityName: entity?.metadata?.name ?? 'Unknown',
          entityKind: entity?.kind ?? row.entity_kind ?? 'Unknown',
          owner:
            (entity?.spec?.owner as string) ?? row.entity_owner ?? 'Unknown',
          metricValue: row.value,
          timestamp: new Date(row.timestamp).toISOString(),
          status: row.status ?? 'error', // default to error if status is null
        };
      });

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
        total: dbTotal,
        totalPages: Math.ceil(dbTotal / options.limit),
      },
    };
  }
}
