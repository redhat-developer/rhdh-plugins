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
import {
  DbMetricValueCreate,
  DbMetricValue,
  DbAggregatedMetric,
} from './types';

type ReadEntityMetricsByStatusOptions = {
  status?: 'success' | 'warning' | 'error';
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
    | 'namespace';
  sortOrder?: 'asc' | 'desc';
  pagination?: { limit: number; offset: number };
};

export class DatabaseMetricValues {
  private readonly tableName = 'metric_values';

  constructor(private readonly dbClient: Knex<any, any[]>) {}

  /**
   * Insert multiple metric values
   */
  async createMetricValues(metricValues: DbMetricValueCreate[]): Promise<void> {
    if (metricValues.length === 0) {
      return;
    }
    await this.dbClient(this.tableName).insert(metricValues);
  }

  /**
   * Get the latest metric values for a specific entity and metrics
   */
  async readLatestEntityMetricValues(
    catalog_entity_ref: string,
    metric_ids: string[],
  ): Promise<DbMetricValue[]> {
    return await this.dbClient(this.tableName)
      .select('*')
      .whereIn(
        'id',
        this.dbClient(this.tableName)
          .max('id')
          .whereIn('metric_id', metric_ids)
          .where('catalog_entity_ref', catalog_entity_ref)
          .groupBy('metric_id'),
      );
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
    catalog_entity_refs: string[],
    metric_id: string,
  ): Promise<DbAggregatedMetric | undefined> {
    const latestIdsSubquery = this.dbClient(this.tableName)
      .max('id')
      .where('metric_id', metric_id)
      .whereIn('catalog_entity_ref', catalog_entity_refs)
      .groupBy('catalog_entity_ref');

    const statusRows = await this.dbClient(this.tableName)
      .select('status')
      .count('* as count')
      .max('timestamp as max_timestamp')
      .whereIn('id', latestIdsSubquery)
      .whereNotNull('status')
      .whereNotNull('value')
      .groupBy('status');

    if (!statusRows || statusRows.length === 0) {
      return undefined;
    }

    // Normalize types for cross-database compatibility
    // PostgreSQL returns COUNT/SUM as strings, SQLite returns numbers
    // PostgreSQL returns MAX(timestamp) as Date, SQLite returns number (milliseconds)
    const normalizeTimestamp = (timestamp: any): Date => {
      if (timestamp instanceof Date) {
        return timestamp;
      } else if (
        typeof timestamp === 'number' ||
        typeof timestamp === 'string'
      ) {
        return new Date(timestamp);
      }
      return new Date();
    };

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

    return {
      metric_id,
      total,
      max_timestamp: maxTimestamp,
      statusCounts,
    };
  }

  /**
   * Fetch entity metric values filtered by status with pagination
   * Returns paginated rows
   */
  async readEntityMetricsByStatus(
    metric_id: string,
    options: ReadEntityMetricsByStatusOptions,
  ): Promise<DbMetricValue[]> {
    const clientName: string =
      (this.dbClient as any).client?.config?.client ?? '';
    const isPostgres = clientName === 'pg' || clientName.includes('postgres');

    const latestIdsSubquery = this.dbClient(this.tableName)
      .max('id')
      .where('metric_id', metric_id)
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
    };

    const column =
      (options.sortBy && sortColumnMap[options.sortBy]) ?? 'timestamp';
    const direction = options.sortOrder === 'asc' ? 'asc' : 'desc';

    // Nulls last for metricValue (value can be null)
    if (options.sortBy === 'metricValue') {
      if (isPostgres) {
        // value is JSON; cast to text then to float for numeric sort; NULLS LAST is native syntax
        query.orderByRaw(
          `CAST(value::text AS DOUBLE PRECISION) ${direction} NULLS LAST, id ASC`,
        );
      } else {
        // SQLite: "value IS NULL" puts nulls last; double-cast handles JSON-stored values
        query.orderByRaw(
          `value IS NULL, CAST(CAST(value AS TEXT) AS REAL) ${direction}, id ASC`,
        );
      }
    } else {
      query.orderBy(column, direction);
      query.orderBy('id', 'asc'); // Ensure a stable sort in the event that two metrics share a similar primary sort value
    }

    if (options.status) {
      query.where('status', options.status);
    }

    if (options.entityName) {
      const escaped = options.entityName.replace(/[%_\\]/g, '\\$&');
      query.whereRaw("LOWER(catalog_entity_ref) LIKE LOWER(?) ESCAPE '\\'", [
        `%${escaped}%`,
      ]);
    }

    if (options.entityKind) {
      query.whereRaw('LOWER(entity_kind) = LOWER(?)', [options.entityKind]);
    }

    if (options.entityNamespace) {
      query.whereRaw('LOWER(entity_namespace) = LOWER(?)', [
        options.entityNamespace,
      ]);
    }

    if (options.entityOwner && options.entityOwner.length > 0) {
      query.whereIn('entity_owner', options.entityOwner);
    }

    if (options.pagination) {
      query.limit(options.pagination.limit).offset(options.pagination.offset);
    }

    const rows = await query;

    return rows;
  }
}
