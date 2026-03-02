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

    const maxTimestamp = statusRows.reduce((max, row) => {
      const rowTimestamp = normalizeTimestamp(row.max_timestamp);
      return rowTimestamp > max ? rowTimestamp : max;
    }, new Date(0));

    const statusCounts = statusRows.reduce<Record<string, number>>(
      (acc, row) => {
        const name = row.status as string;
        acc[name] = Number(row.count);
        return acc;
      },
      {},
    );

    const total = Object.values(statusCounts).reduce((sum, count) => {
      return sum + count;
    }, 0);
    return {
      metric_id,
      total,
      max_timestamp: maxTimestamp,
      statusCounts,
    };
  }
}
