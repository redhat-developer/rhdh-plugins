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
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  MetricValue,
  MetricValuesFilter,
  MetricValuesStore,
} from './MetricValuesStore';

export class DatabaseMetricValuesStore implements MetricValuesStore {
  private readonly knex: Knex;
  private readonly logger: LoggerService;
  private readonly tableName = 'metric_values';

  constructor(options: { knex: Knex; logger: LoggerService }) {
    this.knex = options.knex;
    this.logger = options.logger;
  }

  /**
   * Insert multiple metric values
   */
  async createMetricValues(
    metricValues: Omit<MetricValue, 'id'>[],
  ): Promise<void> {
    try {
      await this.knex(this.tableName).insert(metricValues);
    } catch (error) {
      this.logger.error(`Failed to insert metric values batch: ${error}`);
      throw error;
    }
  }

  /**
   * Get metric values based on filter criteria
   */
  async readMetricValues(
    filter: MetricValuesFilter = {},
  ): Promise<MetricValue[]> {
    try {
      let query = this.knex(this.tableName).select('*');

      if (filter.metric_id) {
        query = query.where('metric_id', filter.metric_id);
      }
      if (filter.catalog_entity_ref) {
        query = query.where('catalog_entity_ref', filter.catalog_entity_ref);
      }
      if (filter.from_timestamp) {
        query = query.where('timestamp', '>=', filter.from_timestamp);
      }
      if (filter.to_timestamp) {
        query = query.where('timestamp', '<=', filter.to_timestamp);
      }
      query = query.orderBy('id', 'desc');
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.offset(filter.offset);
      }

      const results = await query;
      return results;
    } catch (error) {
      this.logger.error(`Failed to get metric values: ${error}`);
      throw error;
    }
  }

  /**
   * Get the latest metric value for a specific entity and metric
   */
  async readLatestMetricValue(
    catalog_entity_ref: string,
    metric_id: string,
  ): Promise<MetricValue | null> {
    try {
      const result = await this.knex(this.tableName)
        .select('*')
        .where('metric_id', metric_id)
        .where('catalog_entity_ref', catalog_entity_ref)
        .orderBy('id', 'desc')
        .first();

      return result || null;
    } catch (error) {
      this.logger.error(`Failed to get latest metric value: ${error}`);
      throw error;
    }
  }
}
