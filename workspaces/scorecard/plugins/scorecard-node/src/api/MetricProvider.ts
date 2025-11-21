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

import type { Entity } from '@backstage/catalog-model';
import {
  Metric,
  MetricType,
  MetricValue,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

/**
 * Interface for a metric provider
 * @public
 */
export interface MetricProvider<T extends MetricType = MetricType> {
  /**
   * Get the datasource ID for the metric provider
   * @public
   */
  getProviderDatasourceId(): string;
  /**
   * Get the provider ID for the metric provider
   * @public
   */
  getProviderId(): string;
  /**
   * Get the metric type for the metric provider
   * @public
   */
  getMetricType(): T;
  /**
   * Get the metric for the metric provider
   * @public
   */
  getMetric(): Metric<T>;
  /**
   * Get the metric thresholds for the metric provider
   * @public
   */
  getMetricThresholds(): ThresholdConfig;
  /**
   * Calculate the metric for the metric provider
   * @public
   */
  calculateMetric(entity: Entity): Promise<MetricValue<T>>;
  /**
   * Get the catalog filter for the metric provider
   * @public
   */
  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]>;
}
