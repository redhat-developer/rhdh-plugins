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
  async readAggregatedMetricsByEntityRefs(
    catalog_entity_refs: string[],
    metric_ids: string[],
  ): Promise<DbAggregatedMetric[]> {
    const latestIdsSubquery = this.dbClient(this.tableName)
      .max('id')
      .whereIn('metric_id', metric_ids)
      .whereIn('catalog_entity_ref', catalog_entity_refs)
      .groupBy('metric_id', 'catalog_entity_ref');

    const results = await this.dbClient(this.tableName)
      .select('metric_id')
      .count('* as total')
      .max('timestamp as max_timestamp')
      .select(
        this.dbClient.raw(
          "SUM(CASE WHEN status = 'success' AND value IS NOT NULL THEN 1 ELSE 0 END) as success",
        ),
      )
      .select(
        this.dbClient.raw(
          "SUM(CASE WHEN status = 'warning' AND value IS NOT NULL THEN 1 ELSE 0 END) as warning",
        ),
      )
      .select(
        this.dbClient.raw(
          "SUM(CASE WHEN status = 'error' AND value IS NOT NULL THEN 1 ELSE 0 END) as error",
        ),
      )
      .whereIn('id', latestIdsSubquery)
      .whereNotNull('status')
      .whereNotNull('value')
      .groupBy('metric_id');

    // Normalize types for cross-database compatibility
    // PostgreSQL returns COUNT/SUM as strings, SQLite returns numbers
    // PostgreSQL returns MAX(timestamp) as Date, SQLite returns number (milliseconds)
    return results.map(row => {
      let maxTimestamp: Date;
      if (row.max_timestamp instanceof Date) {
        maxTimestamp = row.max_timestamp;
      } else if (
        typeof row.max_timestamp === 'number' ||
        typeof row.max_timestamp === 'string'
      ) {
        maxTimestamp = new Date(row.max_timestamp as string | number);
      } else {
        maxTimestamp = new Date();
      }

      return {
        metric_id: row.metric_id,
        total: Number(row.total),
        max_timestamp: maxTimestamp,
        success: Number(row.success),
        warning: Number(row.warning),
        error: Number(row.error),
      };
    });
  }
}
