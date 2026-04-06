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
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import {
  AggregatedMetricResult,
  MetricResult,
  AggregationMetadata,
  Metric,
  EntityMetricDetailResponse,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { GetAggregatedScorecardEntitiesOptions } from '../components/types';

export type ScorecardApiClientOptions = {
  fetchApi: FetchApi;
  discoveryApi: DiscoveryApi;
};

export type ScorecardOptions = {
  entity: Entity;
  metricIds?: string[];
};

export interface ScorecardApi {
  /**
   * Gets the base URL for the scorecard backend API.
   * @returns Promise resolving to the base URL
   */
  getBaseUrl(): Promise<string>;

  /**
   * Retrieves scorecard metrics for a specific entity.
   * @param entity - The Backstage entity to get metrics for
   * @param metricIds - Optional array of specific metric IDs to retrieve
   * @returns Promise resolving to an array of metric results
   * @throws Error if the request fails or returns invalid data
   */
  getScorecards(options: ScorecardOptions): Promise<MetricResult[]>;

  /**
   * Retrieves aggregated metrics for a specific metric ID.
   * @param aggregationId - The ID of the aggregation to get aggregated metrics for
   * @returns Promise resolving to an aggregated metric result
   * @throws Error if the request fails or returns invalid data
   */
  getAggregatedScorecard(
    aggregationId: string,
  ): Promise<AggregatedMetricResult>;

  /**
   * Retrieves a metric by ID.
   * @param metricIds - The IDs of the metrics to retrieve
   * @returns Promise resolving to a metric result
   * @throws Error if the request fails or returns invalid data
   */
  getMetrics(options: { metricIds: string[] }): Promise<{ metrics: Metric[] }>;

  /**
   * Retrieves aggregated scorecard entities.
   * @param options - The options for getting aggregated scorecard entities
   * @returns Promise resolving to an aggregated scorecard entities result
   * @throws Error if the request fails or returns invalid data
   */
  getAggregatedScorecardEntities(
    options: GetAggregatedScorecardEntitiesOptions,
  ): Promise<EntityMetricDetailResponse>;

  /**
   * Retrieves aggregation metadata.
   * @param aggregationId - The ID of the aggregation to get metadata for
   * @returns Promise resolving to an aggregation metadata result
   * @throws Error if the request fails or returns invalid data
   */
  getAggregationMetadata(aggregationId: string): Promise<AggregationMetadata>;
}
