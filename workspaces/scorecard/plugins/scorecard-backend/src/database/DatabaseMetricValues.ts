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

import { Knex } from 'knex';
import type { AggregationConfigFilter } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  DbMetricValueCreate,
  DbMetricValue,
  DbAggregatedMetric,
  DbScalarAggregatedMetric,
  ScalarAggregationFn,
} from './types';
import { normalizeTimestamp } from '../utils/normalizeTimestamp';
import { mergeMaxTimestamp } from '../utils/mergeMaxTimestamp';
import { getAggregateExpression } from './utils/getAggregateExpression';
import {
  fromMetricValueRow,
  toMetricValueRow,
  type MetricValueRowWithId,
} from './utils/mapMetricValueRow';

type ReadEntityMetricsWithFiltersOptions = {
  status?: string;
  entityName?: string;
  entityKind?: string;
  entityNamespace?: string;
  entityOwner?: string[];
  sortBy?:
    | 'entityName'
    | 'owner'
    | 'entityKind'
    | 'timestamp'
    | 'metricValue'
    | 'namespace'
    | 'status';
  sortOrder?: 'asc' | 'desc';
  pagination?: { limit: number; offset: number };
};

type StatsRowResult = {
  latestIdsSubquery: Knex.QueryBuilder;
  latestRowCount: number;
  calculationErrorCount: number;
  maxTimestampAllLatest: Date;
};

type ScalarAggregationRowResult = {
  value: number;
  total: number;
  maxTimestamp: Date;
};

export class DatabaseMetricValues {
  private readonly tableName = 'metric_values';

  /**
   * `value` is a JSON column. Depending on database/driver, a "missing" metric value can
   * arrive either as SQL NULL or as JSON literal null (`CAST(value AS TEXT) = 'null'`).
   */
  private static readonly metricValueIsMissingExpr =
    "(value IS NULL OR CAST(value AS TEXT) = 'null')";

  constructor(private readonly dbClient: Knex<any, any[]>) {}

  private get isPostgres(): boolean {
    const clientName: string =
      (this.dbClient as any).client?.config?.client ?? '';
    return clientName === 'pg' || clientName.includes('postgres');
  }

  /**
   * Get the latest ids subquery for a given metric and catalog entity refs
   */
  private getLatestIdsSubquery(
    metricId: string,
    catalogEntityRefs: string[],
  ): Knex.QueryBuilder {
    return this.dbClient(this.tableName)
      .max('id')
      .where('metric_id', metricId)
      .whereIn('catalog_entity_ref', catalogEntityRefs)
      .groupBy('catalog_entity_ref');
  }

  /**
   * Get the stats row for a given latest ids subquery
   */
  private async readStatsRowByLatestIdsSubquery(
    latestIdsSubquery: Knex.QueryBuilder,
  ): Promise<StatsRowResult> {
    // One round-trip for latest-row count, calculation-error count, and max timestamp
    // (same latest-id set as the status breakdown query below).
    const statsRow = await this.dbClient(this.tableName)
      .whereIn('id', latestIdsSubquery)
      .select(
        this.dbClient.raw('COUNT(*) as latest_row_count'),
        this.dbClient.raw(
          `SUM(CASE WHEN error_message IS NOT NULL AND ${DatabaseMetricValues.metricValueIsMissingExpr} THEN 1 ELSE 0 END) as calculation_error_count`,
        ),
        this.dbClient.raw('MAX(timestamp) as max_timestamp'),
      )
      .first();

    const latestRowCount = Number(
      (statsRow as { latest_row_count?: string | number } | undefined)
        ?.latest_row_count ?? 0,
    );

    const calculationErrorCount = Number(
      (statsRow as { calculation_error_count?: string | number } | undefined)
        ?.calculation_error_count ?? 0,
    );

    const maxTimestampAllLatest = normalizeTimestamp(
      (statsRow as { max_timestamp?: unknown })?.max_timestamp,
    );

    return {
      latestIdsSubquery,
      latestRowCount,
      calculationErrorCount,
      maxTimestampAllLatest,
    };
  }

  private async readScalarAggregationByLatestIdsSubquery(
    latestIdsSubquery: Knex.QueryBuilder,
    aggregationFn: ScalarAggregationFn,
    filter?: AggregationConfigFilter,
  ): Promise<ScalarAggregationRowResult> {
    const numericValueExpr = this.isPostgres
      ? 'CAST(value::text AS DOUBLE PRECISION)'
      : 'CAST(CAST(value AS TEXT) AS REAL)';

    const aggregateExpression = getAggregateExpression(
      aggregationFn,
      numericValueExpr,
    );

    const aggregateQuery = this.dbClient(this.tableName)
      .whereIn('id', latestIdsSubquery)
      .whereRaw(`NOT ${DatabaseMetricValues.metricValueIsMissingExpr}`);

    if (filter?.status && filter.status !== '') {
      aggregateQuery.where('status', filter.status);
    }

    const aggregateRow = await aggregateQuery
      .select(
        this.dbClient.raw(`${aggregateExpression} as value`),
        this.dbClient.raw('COUNT(*) as total'),
        this.dbClient.raw('MAX(timestamp) as max_timestamp'),
      )
      .first();

    const aggregateResult = {
      value: 0,
      total: 0,
      maxTimestamp: new Date(0),
    };

    if (aggregateRow) {
      const rawValue = Number(aggregateRow.value);
      const rawTotal = Number(aggregateRow.total);
      aggregateResult.value = Number.isFinite(rawValue) ? rawValue : 0;
      aggregateResult.total = Number.isFinite(rawTotal) ? rawTotal : 0;
      // MAX(timestamp) is null when no rows contribute (e.g. filter matches nothing).
      // Keep epoch so mergeMaxTimestamp prefers the portfolio latest-row timestamp.
      if (
        aggregateResult.total > 0 &&
        aggregateRow.max_timestamp !== null &&
        aggregateRow.max_timestamp !== ''
      ) {
        aggregateResult.maxTimestamp = normalizeTimestamp(
          aggregateRow.max_timestamp,
        );
      }
    }

    return {
      value: aggregateResult.value,
      total: aggregateResult.total,
      maxTimestamp: aggregateResult.maxTimestamp,
    };
  }

  /**
   * Insert multiple metric values
   */
  async createMetricValues(metricValues: DbMetricValueCreate[]): Promise<void> {
    if (metricValues.length === 0) {
      return;
    }
    await this.dbClient(this.tableName).insert(
      metricValues.map(toMetricValueRow),
    );
  }

  /**
   * Get the latest metric values for a specific entity and metrics
   */
  async readLatestEntityMetricValues(
    catalogEntityRef: string,
    metricIds: string[],
  ): Promise<DbMetricValue[]> {
    const rows = await this.dbClient(this.tableName)
      .select('*')
      .whereIn(
        'id',
        this.dbClient(this.tableName)
          .max('id')
          .whereIn('metric_id', metricIds)
          .where('catalog_entity_ref', catalogEntityRef)
          .groupBy('metric_id'),
      );

    return (rows as MetricValueRowWithId[]).map(fromMetricValueRow);
  }

  /**
   * Latest metric value per UTC calendar day for a specific entity and metric.
   *
   * For each UTC day in `[from, to]`: pick the sample with the highest `id` among
   * rows that are either a real value or a calculation error. Days with only
   * null-without-error rows are omitted.
   *
   * Ordered by timestamp ascending, then id ascending.
   */
  async readLatestEntityMetricValuesPerUtcDay(
    catalogEntityRef: string,
    metricId: string,
    from: Date,
    to: Date,
  ): Promise<DbMetricValue[]> {
    // Knex dateTime is timestamptz on Postgres. TO_CHAR(timestamptz, ...) formats in
    // the session TimeZone, so non-UTC sessions bucket by local calendar day. Convert
    // to UTC wall-clock first so grouping matches Date#getUTC* (UTC sessions unchanged).
    const utcDayExpr = this.isPostgres
      ? "TO_CHAR(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD')"
      : "strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch')";

    const missing = DatabaseMetricValues.metricValueIsMissingExpr;
    const chosenIdExpr = `MAX(CASE
      WHEN NOT ${missing} OR (error_message IS NOT NULL AND ${missing})
      THEN id
    END)`;

    const latestIdsPerDay = this.dbClient(this.tableName)
      .select(this.dbClient.raw(`${chosenIdExpr} as id`))
      .where('catalog_entity_ref', catalogEntityRef)
      .where('metric_id', metricId)
      .where('timestamp', '>=', from)
      .where('timestamp', '<=', to)
      .groupByRaw(utcDayExpr)
      .havingRaw(`${chosenIdExpr} IS NOT NULL`);

    const rows = await this.dbClient(this.tableName)
      .select('*')
      .whereIn('id', latestIdsPerDay)
      .orderBy([
        { column: 'timestamp', order: 'asc' },
        { column: 'id', order: 'asc' },
      ]);

    return (rows as MetricValueRowWithId[]).map(fromMetricValueRow);
  }

  /**
   * Delete metric values that are older than the given date
   */
  async cleanupExpiredMetrics(olderThan: Date): Promise<number> {
    return await this.dbClient(this.tableName)
      .where('timestamp', '<', olderThan)
      .del();
  }

  /**
   * Get aggregated metrics by status for multiple entities and metrics.
   */
  async readAggregatedMetricByEntityRefs(
    catalogEntityRefs: string[],
    metricId: string,
  ): Promise<DbAggregatedMetric | undefined> {
    if (catalogEntityRefs.length === 0) {
      return undefined;
    }

    const latestIdsSubquery = this.getLatestIdsSubquery(
      metricId,
      catalogEntityRefs,
    );
    const { latestRowCount, calculationErrorCount, maxTimestampAllLatest } =
      await this.readStatsRowByLatestIdsSubquery(latestIdsSubquery);

    if (latestRowCount === 0) {
      return undefined;
    }

    const statusRows = await this.dbClient(this.tableName)
      .select('status')
      .count('* as count')
      .max('timestamp as max_timestamp')
      .whereIn('id', latestIdsSubquery)
      .whereNotNull('status')
      .whereRaw(`NOT ${DatabaseMetricValues.metricValueIsMissingExpr}`)
      .groupBy('status');

    if (!statusRows || statusRows.length === 0) {
      return {
        metricId,
        total: 0,
        maxTimestamp: maxTimestampAllLatest,
        statusCounts: {},
        calculationErrorCount,
        latestEntityCount: latestRowCount,
      };
    }

    let maxTimestamp = new Date(0);
    let total = 0;
    const statusCounts: Record<string, number> = {};
    for (const row of statusRows) {
      const rowTimestamp = normalizeTimestamp(row.max_timestamp);
      if (rowTimestamp > maxTimestamp) {
        maxTimestamp = rowTimestamp;
      }
      const name = row.status as string;
      const count = Number(row.count);
      statusCounts[name] = count;
      total += count;
    }

    const mergedMax = mergeMaxTimestamp(maxTimestampAllLatest, maxTimestamp);

    return {
      metricId,
      total,
      maxTimestamp: mergedMax,
      statusCounts,
      calculationErrorCount,
      latestEntityCount: latestRowCount,
    };
  }

  /**
   * Aggregate raw metric values across latest rows for multiple entities.
   */
  async readScalarAggregatedMetricByEntityRefs(
    catalogEntityRefs: string[],
    metricId: string,
    aggregationFn: ScalarAggregationFn,
    filter?: AggregationConfigFilter,
  ): Promise<DbScalarAggregatedMetric | undefined> {
    if (catalogEntityRefs.length === 0) {
      return undefined;
    }

    const latestIdsSubquery = this.getLatestIdsSubquery(
      metricId,
      catalogEntityRefs,
    );
    const { latestRowCount, calculationErrorCount, maxTimestampAllLatest } =
      await this.readStatsRowByLatestIdsSubquery(latestIdsSubquery);

    if (latestRowCount === 0) {
      return undefined;
    }

    const {
      value,
      total,
      maxTimestamp: aggregateMaxTimestamp,
    } = await this.readScalarAggregationByLatestIdsSubquery(
      latestIdsSubquery,
      aggregationFn,
      filter,
    );

    const mergedMax = mergeMaxTimestamp(
      maxTimestampAllLatest,
      aggregateMaxTimestamp,
    );

    return {
      metricId,
      total,
      maxTimestamp: mergedMax,
      value,
      calculationErrorCount,
      latestEntityCount: latestRowCount,
    };
  }

  /**
   * Fetch the latest entity metric values for a given metric, with optional filtering
   * by status, name, kind, namespace, or owner, plus sorting and pagination.
   */
  async readEntityMetricsWithFilters(
    metricId: string,
    options: ReadEntityMetricsWithFiltersOptions,
  ): Promise<DbMetricValue[]> {
    const latestIdsSubquery = this.dbClient(this.tableName)
      .max('id')
      .where('metric_id', metricId)
      .groupBy('catalog_entity_ref');

    const query = this.dbClient(this.tableName)
      .select('*')
      .whereIn('id', latestIdsSubquery);

    const sortColumnMap: Record<string, string> = {
      entityName: 'catalog_entity_ref',
      owner: 'entity_owner',
      entityKind: 'entity_kind',
      timestamp: 'timestamp',
      metricValue: 'value',
      namespace: 'entity_namespace',
      status: 'status',
    };

    const column =
      (options.sortBy && sortColumnMap[options.sortBy]) ?? 'timestamp';
    const direction = options.sortOrder === 'asc' ? 'asc' : 'desc';

    this.applySort(query, options.sortBy, column, direction);

    if (options.status) {
      query.where('status', options.status);
    }

    if (options.entityName) {
      const escaped = options.entityName.replace(/[%_\\]/g, '\\$&');
      query.whereRaw("catalog_entity_ref LIKE ? ESCAPE '\\'", [`%${escaped}%`]);
    }

    if (options.entityKind) {
      query.where('entity_kind', options.entityKind);
    }

    if (options.entityNamespace) {
      query.where('entity_namespace', options.entityNamespace);
    }

    if (options.entityOwner && options.entityOwner.length > 0) {
      query.whereIn('entity_owner', options.entityOwner);
    }

    if (options.pagination) {
      query.limit(options.pagination.limit).offset(options.pagination.offset);
    }

    const rows = await query;
    return (rows as MetricValueRowWithId[]).map(fromMetricValueRow);
  }

  private applySort(
    query: any,
    sortBy: string | undefined,
    column: string,
    direction: string,
  ): void {
    if (sortBy === 'metricValue') {
      // value is JSON and nullable; cast for numeric sort with NULLs last
      if (this.isPostgres) {
        query.orderByRaw(
          `CAST(value::text AS DOUBLE PRECISION) ${direction} NULLS LAST, id ASC`,
        );
      } else {
        // SQLite: "value IS NULL" puts nulls last; double-cast handles JSON-stored values
        query.orderByRaw(
          `value IS NULL, CAST(CAST(value AS TEXT) AS REAL) ${direction}, id ASC`,
        );
      }
    } else if (sortBy === 'status') {
      // status is nullable; NULLs always sort last regardless of direction
      if (this.isPostgres) {
        query.orderByRaw(`status ${direction} NULLS LAST, id ASC`);
      } else {
        // SQLite: "status IS NULL" evaluates to 1 for NULLs, pushing them to the end
        query.orderByRaw(`status IS NULL, status ${direction}, id ASC`);
      }
    } else {
      query.orderBy(column, direction);
      // Ensure a stable sort when two metrics share the same primary sort value
      query.orderBy('id', 'asc');
    }
  }
}
