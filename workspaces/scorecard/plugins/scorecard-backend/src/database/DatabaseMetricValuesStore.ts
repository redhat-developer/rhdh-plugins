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
import { DbMetricValue, MetricValuesStore } from './MetricValuesStore';

export class DatabaseMetricValuesStore implements MetricValuesStore {
  private readonly tableName = 'metric_values';

  constructor(private readonly knex: Knex<any, any[]>) {}

  /**
   * Insert multiple metric values
   */
  async createMetricValues(
    metricValues: Omit<DbMetricValue, 'id'>[],
  ): Promise<void> {
    await this.knex(this.tableName).insert(metricValues);
  }

  /**
   * Get the latest metric values for a specific entity and metrics
   */
  async readLatestEntityMetricValues(
    catalog_entity_ref: string,
    metric_ids: string[],
  ): Promise<DbMetricValue[]> {
    return await this.knex(this.tableName)
      .select('*')
      .whereIn(
        'id',
        this.knex(this.tableName)
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
    return await this.knex(this.tableName)
      .where('timestamp', '<', olderThan)
      .del();
  }
}
