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
  EntityMetricDetailResponse,
  EntityMetricDetail,
  ScorecardEntityHealthSummary,
  aggregationTypes,
  AggregatedMetric,
  MetricTimeSeriesResponse,
  MetricTimeSeriesPoint,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  RELATION_MEMBER_OF,
  RELATION_OWNED_BY,
  stringifyEntityRef,
  type Entity,
} from '@backstage/catalog-model';
import { normalizeOwnerRef } from '../utils/normalizeOwnerRef';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import {
  NotAllowedError,
  NotFoundError,
  stringifyError,
} from '@backstage/errors';
import {
  AuthService,
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { filterAuthorizedMetrics } from '../permissions/permissionUtils';
import {
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { DatabaseMetricValues } from '../database/DatabaseMetricValues';
import { isMetricCalculationError } from '../utils/metricCalculationError';
import { isMetricIdDisabled } from '../utils/metricUtils';
import { AggregatedMetricMapper } from './mappers';
import { DbMetricValue } from '../database/types';
import { ThresholdResolver } from '../threshold/ThresholdResolver';
import { ThresholdEvaluator } from '../threshold/ThresholdEvaluator';

type CatalogMetricServiceOptions = {
  catalog: CatalogService;
  auth: AuthService;
  registry: MetricProvidersRegistry;
  database: DatabaseMetricValues;
  logger: LoggerService;
  thresholdResolver: ThresholdResolver;
  config: Config;
};

const QUERY_ENTITIES_BATCH_SIZE = 50;

export class CatalogMetricService {
  private static entityHealthSummary(
    accessibleRows: DbMetricValue[],
    countsArePartial: boolean,
  ): ScorecardEntityHealthSummary {
    const calculationErrorCount = accessibleRows.filter(row =>
      isMetricCalculationError(row),
    ).length;
    return {
      totalEntities: accessibleRows.length,
      calculationErrorCount,
      countsArePartial,
    };
  }

  private readonly logger: LoggerService;
  private readonly config: Config;

  private readonly catalog: CatalogService;
  private readonly auth: AuthService;
  private readonly registry: MetricProvidersRegistry;
  private readonly database: DatabaseMetricValues;
  private readonly thresholdResolver: ThresholdResolver;
  private readonly thresholdEvaluator = new ThresholdEvaluator();
  private readonly globalDisabledMetrics: string[];

  private static readonly MAX_FETCHABLE_ROWS = 10_000;
  private static readonly BATCH_SIZE = 100;

  constructor(options: CatalogMetricServiceOptions) {
    this.catalog = options.catalog;
    this.auth = options.auth;
    this.registry = options.registry;
    this.database = options.database;
    this.logger = options.logger;
    this.thresholdResolver = options.thresholdResolver;
    this.config = options.config;
    this.globalDisabledMetrics =
      options.config.getOptionalStringArray('scorecard.disabledMetrics') ?? [];
  }

  /**
   * Get latest metric results for a specific catalog entity.
   *
   * @param entityRef - Entity reference in format "kind:namespace/name"
   * @param metricIds - Optional array of metric IDs to get latest metrics of.
   *                    If not provided, gets all available latest metrics.
   * @param filter - Permission filter
   * @returns Metric results with entity-specific thresholds applied
   */
  async getLatestEntityMetrics(
    entityRef: string,
    metricIds?: string[],
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

    const metricsToFetch = this.registry.listMetrics(metricIds);

    const authorizedMetricsToFetch = filterAuthorizedMetrics(
      metricsToFetch,
      filter,
    );
    const metricIdsToFetch = authorizedMetricsToFetch
      .filter(m => !isMetricIdDisabled(this.config, m.id, entity, this.logger))
      .map(m => m.id);

    const rawResults = await this.database.readLatestEntityMetricValues(
      entityRef,
      metricIdsToFetch,
    );

    return rawResults.map(
      ({ metricId, value, errorMessage, timestamp, status }) => {
        let thresholds: ThresholdConfig | undefined;
        let thresholdError: string | undefined;

        const metric = this.registry.getMetric(metricId);

        try {
          thresholds = this.thresholdResolver.resolveEntityThresholds(
            entity,
            metric,
          );

          if (value === null) {
            thresholdError =
              'Unable to evaluate thresholds, metric value is missing';
          } else if (errorMessage) {
            thresholdError = errorMessage;
          }
        } catch (error) {
          thresholdError = stringifyError(error);
        }

        const isMetricCalcError = isMetricCalculationError({
          value,
          errorMessage,
        });

        return {
          id: metric.id,
          status: isMetricCalcError ? 'error' : 'success',
          metadata: {
            title: metric.title,
            description: metric.description,
            type: metric.type,
            unit: metric.unit,
            history: metric.history,
            defaultVisualization: metric.defaultVisualization,
            collectorIds: metric.collectorIds,
          },
          ...(isMetricCalcError && {
            error:
              errorMessage ??
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
   * Get a daily time series for one metric on one catalog entity.
   *
   * Returns at most one point per UTC calendar day: the latest sample
   * (`MAX(id)`), whether success or calculation error. Calculation failures
   * use `value: null` and `error`. Threshold evaluation failures also set
   * `error` (with `thresholdEvaluation` null). When entity threshold
   * resolution fails, `thresholdsError` is set on the response and points are
   * not classified (`thresholdEvaluation` null, no per-point `error`).
   *
   * @param entityRef - Entity reference in format "kind:namespace/name"
   * @param metricId - Metric ID to fetch
   * @param from - Inclusive range start
   * @param to - Inclusive range end
   * @param filter - Permission filter
   */
  async getEntityMetricTimeSeries(
    entityRef: string,
    metricId: string,
    from: Date,
    to: Date,
    filter?: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    >,
  ): Promise<MetricTimeSeriesResponse> {
    const entity = await this.catalog.getEntityByRef(entityRef, {
      credentials: await this.auth.getOwnServiceCredentials(),
    });
    if (!entity) {
      throw new NotFoundError(`Entity not found: ${entityRef}`);
    }

    const metric = this.registry.getMetric(metricId);
    const authorizedMetrics = filterAuthorizedMetrics([metric], filter);
    if (authorizedMetrics.length === 0) {
      throw new NotAllowedError(
        `To view the scorecard metrics, your administrator must grant you the required permission.`,
      );
    }

    let thresholds: ThresholdConfig | undefined;
    let thresholdsError: string | undefined;
    try {
      thresholds = this.thresholdResolver.resolveEntityThresholds(
        entity,
        metric,
      );
    } catch (err) {
      thresholdsError = stringifyError(err);
      this.logger.warn(
        `Failed to resolve thresholds for metric '${metric.id}' on entity '${entityRef}': ${thresholdsError}`,
      );
    }

    if (isMetricIdDisabled(this.config, metricId, entity, this.logger)) {
      return {
        metricId: metric.id,
        entityRef,
        points: [],
        metadata: {
          title: metric.title,
          description: metric.description,
          type: metric.type,
          unit: metric.unit,
          history: metric.history,
          defaultVisualization: metric.defaultVisualization,
          collectorIds: metric.collectorIds,
        },
        ...(thresholds ? { thresholds } : {}),
        ...(thresholdsError ? { thresholdsError } : {}),
      };
    }

    const rows = await this.database.readLatestEntityMetricValuesPerUtcDay(
      entityRef,
      metricId,
      from,
      to,
    );

    const points: MetricTimeSeriesPoint[] = rows.map(row => {
      if (isMetricCalculationError(row)) {
        return {
          value: null,
          timestamp: row.timestamp.toISOString(),
          error: row.errorMessage!,
        };
      }

      let thresholdEvaluation: string | null = null;
      let error: string | undefined;
      if (row.value !== null && thresholds) {
        try {
          thresholdEvaluation =
            this.thresholdEvaluator.getFirstMatchingThreshold(
              row.value,
              metric.type,
              thresholds,
            ) ?? null;
        } catch (err) {
          error = stringifyError(err);
          this.logger.warn(
            `Failed to evaluate thresholds for metric '${metric.id}' on entity '${entityRef}': ${error}`,
          );
        }
      }

      return {
        value: row.value,
        timestamp: row.timestamp.toISOString(),
        thresholdEvaluation,
        ...(error ? { error } : {}),
      };
    });

    return {
      metricId: metric.id,
      entityRef,
      points,
      metadata: {
        title: metric.title,
        description: metric.description,
        type: metric.type,
        unit: metric.unit,
        history: metric.history,
        defaultVisualization: metric.defaultVisualization,
        collectorIds: metric.collectorIds,
      },
      ...(thresholds ? { thresholds } : {}),
      ...(thresholdsError ? { thresholdsError } : {}),
    };
  }

  /**
   * Get an aggregated metric by status grouped for multiple entities and a single metric ID.
   *
   * @param entityRefs - Array of entity references in format "kind:namespace/name"
   * @param metricId - Metric ID to aggregate.
   * @returns Aggregated metric by status grouped results
   */
  async getStatusGroupedAggregatedMetrics(
    entityRefs: string[],
    metricId: string,
  ): Promise<AggregatedMetric> {
    const aggregatedMetric =
      await this.database.readAggregatedMetricByEntityRefs(
        entityRefs,
        metricId,
      );

    return AggregatedMetricMapper.toAggregatedMetric(aggregatedMetric);
  }

  /**
   * Get an aggregated metric by aggregation type.
   *
   * @param entityRefs - Array of entity references in format "kind:namespace/name"
   * @param metricId - Metric ID to aggregate.
   * @param aggregationType - Aggregation type to use.
   * @returns Aggregated metric by aggregation type results
   */
  async getAggregatedMetricByEntityRefs(
    entityRefs: string[],
    metricId: string,
    aggregationType: string,
  ): Promise<AggregatedMetric> {
    if (entityRefs.length !== 0) {
      if (aggregationType === aggregationTypes.statusGrouped) {
        return this.getStatusGroupedAggregatedMetrics(entityRefs, metricId);
      }
      throw new Error(`Unsupported aggregation type: ${aggregationType}`);
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
   * @param metricId - Metric ID to fetch (e.g., "github.openPRs")
   * @param options - Query options for filtering, sorting, and pagination
   * @param options.status - Filter by threshold status (database-level)
   * @param options.owner - Filter by owner entity reference (database-level)
   * @param options.kind - Filter by entity kind (database-level)
   * @param options.entityName - Substring search against the entity ref `kind:namespace/name` (database-level)
   * @param options.namespace - Exact match against the entity namespace (database-level)
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
      status?: string;
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
        | 'namespace'
        | 'status';
      sortOrder?: 'asc' | 'desc';
      page: number;
      limit: number;
    },
  ): Promise<EntityMetricDetailResponse> {
    // Get metric metadata
    const metric = this.registry.getMetric(metricId);
    const thresholds = this.thresholdResolver.resolveMetricThresholds(metric);

    const emptyResponse = (): EntityMetricDetailResponse => ({
      metricId: metric.id,
      thresholds,
      metricMetadata: {
        title: metric.title,
        description: metric.description,
        type: metric.type,
        unit: metric.unit,
      },
      entities: [],
      pagination: {
        page: options.page,
        pageSize: options.limit,
        total: 0,
        totalPages: 0,
        isCapped: false,
      },
      entityHealth: CatalogMetricService.entityHealthSummary([], false),
    });

    if (this.globalDisabledMetrics.includes(metricId)) {
      this.logger.debug(`Disabled metric by app-config: ${metricId}`);
      return emptyResponse();
    }

    // High-page early-exit guard
    if (
      (options.page - 1) * options.limit >=
      CatalogMetricService.MAX_FETCHABLE_ROWS
    ) {
      return emptyResponse();
    }

    // Fetch successive DB windows in sort order, then apply catalog authorization and
    // disabled-metric filtering until we have MAX_FETCHABLE_ROWS eligible rows or the
    // database is exhausted. Cost is intentional to avoid leaking pre-auth counts;
    // MAX_FETCHABLE_ROWS and BATCH_SIZE tune the performance tradeoff.
    const entityMap = new Map<string, Entity>();
    const accessibleRows: DbMetricValue[] = [];
    let dbOffset = 0;
    let moreDbRowsMayExist = false;

    const dbFilterOptions = {
      status: options.status,
      entityName: options.entityName,
      entityKind: options.kind,
      entityNamespace: options.namespace,
      entityOwner: options.owner,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    };

    try {
      while (accessibleRows.length < CatalogMetricService.MAX_FETCHABLE_ROWS) {
        const rows = await this.database.readEntityMetricsWithFilters(
          metricId,
          {
            ...dbFilterOptions,
            pagination: {
              limit: CatalogMetricService.MAX_FETCHABLE_ROWS,
              offset: dbOffset,
            },
          },
        );

        if (rows.length === 0) {
          moreDbRowsMayExist = false;
          break;
        }

        // Filter to authorized rows by batching through catalog.getEntitiesByRefs with
        // user credentials. The catalog enforces auth natively: null = unauthorized or
        // deleted. Cache Entity objects so we can enrich the page without a second
        // catalog round-trip. Sequential processing preserves DB sort order.
        let stoppedAtEligibleCap = false;
        for (
          let i = 0;
          i < rows.length && !stoppedAtEligibleCap;
          i += CatalogMetricService.BATCH_SIZE
        ) {
          const batch = rows.slice(i, i + CatalogMetricService.BATCH_SIZE);
          const response = await this.catalog.getEntitiesByRefs(
            {
              entityRefs: batch.map(row => row.catalogEntityRef),
              fields: [
                'kind',
                'metadata.name',
                'metadata.namespace',
                'metadata.annotations',
                'spec.owner',
              ],
            },
            { credentials },
          );

          for (let j = 0; j < batch.length; j++) {
            const entity = response.items[j];
            if (!entity) continue; // null = unauthorized or not found, skip
            if (
              isMetricIdDisabled(this.config, metricId, entity, this.logger)
            ) {
              continue;
            }
            if (
              accessibleRows.length >= CatalogMetricService.MAX_FETCHABLE_ROWS
            ) {
              // Eligible cap reached with remaining rows in this window (or later
              // windows) that have not been fully evaluated.
              stoppedAtEligibleCap = true;
              moreDbRowsMayExist = true;
              break;
            }
            entityMap.set(batch[j].catalogEntityRef, entity);
            accessibleRows.push(batch[j]);
          }
        }

        if (stoppedAtEligibleCap) {
          break;
        }

        if (rows.length < CatalogMetricService.MAX_FETCHABLE_ROWS) {
          // Database exhausted for the current filters/sort.
          moreDbRowsMayExist = false;
          break;
        }

        // Full DB window consumed; more rows may exist beyond this offset.
        dbOffset += rows.length;
        moreDbRowsMayExist = true;

        if (accessibleRows.length >= CatalogMetricService.MAX_FETCHABLE_ROWS) {
          break;
        }
      }
    } catch (error) {
      // Fail secure: if the catalog is unavailable we cannot confirm authorization,
      // so return empty rather than potentially unauthorized data.
      this.logger.error('Failed to fetch entities from catalog', { error });
      return emptyResponse();
    }

    // True when the eligible-result cap was reached while more DB rows may exist;
    // pagination.total / entityHealth counts may undercount the full dataset.
    const isCapped =
      accessibleRows.length === CatalogMetricService.MAX_FETCHABLE_ROWS &&
      moreDbRowsMayExist;

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
        thresholds,
        metricMetadata: {
          title: metric.title,
          description: metric.description,
          type: metric.type,
          unit: metric.unit,
        },
        entities: [],
        pagination: {
          page: options.page,
          pageSize: options.limit,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / options.limit),
          isCapped,
        },
        entityHealth: CatalogMetricService.entityHealthSummary(
          accessibleRows,
          isCapped,
        ),
      };
    }

    // Enrich page rows from the cached entity map
    const enrichedEntities: EntityMetricDetail[] = [];
    for (const row of pageRows) {
      const entity = entityMap.get(row.catalogEntityRef);
      if (!entity) continue;
      enrichedEntities.push({
        entityRef: row.catalogEntityRef,
        entityNamespace: entity.metadata.namespace,
        entityName: entity.metadata.name,
        entityKind: entity.kind,
        owner: normalizeOwnerRef(entity.spec?.owner) ?? '',
        metricValue: row.value,
        timestamp: new Date(row.timestamp).toISOString(),
        status: row.status,
      });
    }

    // Format and return response
    return {
      metricId: metric.id,
      thresholds,
      metricMetadata: {
        title: metric.title,
        description: metric.description,
        type: metric.type,
        unit: metric.unit,
      },
      entities: enrichedEntities,
      pagination: {
        page: options.page,
        pageSize: options.limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / options.limit),
        isCapped,
      },
      entityHealth: CatalogMetricService.entityHealthSummary(
        accessibleRows,
        isCapped,
      ),
    };
  }

  /**
   * Get the entities owned by a user and their groups.
   *
   * @param userEntityRef - User entity reference in format "kind:namespace/name"
   * @param metricId - Metric ID to filter entities by
   * @param options - Options for the query
   * @param options.credentials - Backstage credentials
   * @returns Array of entity references in format "kind:namespace/name"
   */
  async getEntitiesOwnedByUser(
    userEntityRef: string,
    metricId: string,
    options: {
      credentials: BackstageCredentials;
    },
  ): Promise<string[]> {
    const { credentials } = options;

    if (this.globalDisabledMetrics.includes(metricId)) {
      this.logger.debug(`Disabled metric by app-config: ${metricId}`);
      return [];
    }

    const userEntity = await this.catalog.getEntityByRef(userEntityRef, {
      credentials,
    });

    if (!userEntity) {
      throw new NotFoundError('User entity not found in catalog');
    }

    const ownerRefs: string[] = [userEntityRef];

    const memberOfRelations =
      userEntity.relations?.filter(
        relation => relation.type === RELATION_MEMBER_OF,
      ) ?? [];

    if (memberOfRelations.length > 0) {
      for (const relation of memberOfRelations) {
        ownerRefs.push(relation.targetRef);
      }
    }

    const entitiesOwnedByUserAndGroups: string[] = [];

    for (const ownerRef of ownerRefs) {
      let cursor: string | undefined = undefined;

      do {
        const entities = await this.catalog.queryEntities(
          {
            filter: {
              [`relations.${RELATION_OWNED_BY}`]: ownerRef,
            },
            fields: ['kind', 'metadata'],
            limit: QUERY_ENTITIES_BATCH_SIZE,
            ...(cursor ? { cursor } : {}),
          },
          { credentials },
        );

        cursor = entities.pageInfo.nextCursor;

        for (const entity of entities.items) {
          if (isMetricIdDisabled(this.config, metricId, entity, this.logger)) {
            continue;
          }
          entitiesOwnedByUserAndGroups.push(stringifyEntityRef(entity));
        }
      } while (cursor !== undefined);
    }

    return entitiesOwnedByUserAndGroups;
  }
}
