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
  createApiRef,
  FetchApi,
  DiscoveryApi,
} from '@backstage/core-plugin-api';
import type { Entity } from '@backstage/catalog-model';
import type {
  MetricResult,
  AggregatedMetricResult,
  MetricsDetails,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export type MetricsResponse = {
  metrics: MetricsDetails[];
};

export interface MetricsOptions {
  metricIds?: string[];
  datasource?: string;
}

export interface ScorecardApi {
  /**
   * Retrieves scorecard metrics for a specific entity.
   * @param entity - The Backstage entity to get metrics for
   * @param metricIds - Optional array of specific metric IDs to retrieve
   * @returns Promise resolving to an array of metric results
   * @throws Error if the request fails or returns invalid data
   */
  getScorecards(entity: Entity, metricIds?: string[]): Promise<MetricResult[]>;
  /**
   * Retrieves aggregated metrics for a specific metric ID.
   * @param metricId - The ID of the metric to get aggregated metrics for
   * @returns Promise resolving to an aggregated metric result
   * @throws Error if the request fails or returns invalid data
   */
  getAggregatedScorecard(metricId: string): Promise<AggregatedMetricResult>;
  /**
   * Retrieves metrics details.
   * @param options - Options to retrieve metrics details by metricIds or datasource
   * @param options.metricIds - Optional array of specific metric IDs to retrieve
   * @param options.datasource - Optional datasource to retrieve metrics from
   * @returns Promise resolving to a metrics details result
   * @throws Error if the request fails or returns invalid data
   */
  getMetrics(options?: MetricsOptions): Promise<MetricsResponse>;
}

export const scorecardApiRef = createApiRef<ScorecardApi>({
  id: 'plugin.scorecard.service',
});

export type ScorecardApiClientOptions = {
  fetchApi: FetchApi;
  discoveryApi: DiscoveryApi;
};

/**
 * Client implementation for the Scorecard API.
 * @public
 */
export class ScorecardApiClient implements ScorecardApi {
  private readonly fetchApi: FetchApi;
  private readonly discoveryApi: DiscoveryApi;

  constructor(options: ScorecardApiClientOptions) {
    this.fetchApi = options.fetchApi;
    this.discoveryApi = options.discoveryApi;
  }

  /**
   * Gets the base URL for the scorecard backend API.
   * @returns Promise resolving to the base URL
   */
  async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('scorecard');
  }

  async getScorecards(
    entity: Entity,
    metricIds?: string[],
  ): Promise<MetricResult[]> {
    if (
      !entity?.kind ||
      !entity?.metadata?.namespace ||
      !entity?.metadata?.name
    ) {
      throw new Error(
        'Entity missing required properties for scorecard lookup',
      );
    }

    const baseUrl = await this.getBaseUrl();
    const url = new URL(
      `${baseUrl}/metrics/catalog/${entity.kind}/${entity.metadata.namespace}/${entity.metadata.name}`,
    );

    if (metricIds) {
      url.searchParams.set('metricIds', metricIds.join(','));
    }

    try {
      const response = await this.fetchApi.fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch scorecards: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from scorecard API');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unexpected error fetching scorecards: ${String(error)}`);
    }
  }

  async getAggregatedScorecard(
    metricId: string,
  ): Promise<AggregatedMetricResult> {
    if (!metricId) {
      throw new Error('Metric ID is required for aggregated scorecards');
    }

    const baseUrl = await this.getBaseUrl();
    const url = new URL(`${baseUrl}/metrics/${metricId}/catalog/aggregations`);

    try {
      const response = await this.fetchApi.fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch aggregated scorecards: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();

      if (
        !data ||
        Array.isArray(data) ||
        typeof data !== 'object' ||
        !('result' in data) ||
        !('metadata' in data) ||
        !('id' in data) ||
        !('status' in data)
      ) {
        throw new TypeError(
          'Invalid response format from aggregated scorecard API',
        );
      }

      return data as AggregatedMetricResult;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unexpected error fetching aggregated scorecards: ${String(error)}`,
      );
    }
  }

  async getMetrics(options?: MetricsOptions): Promise<MetricsResponse> {
    const { metricIds, datasource } = options || {};

    const isMetricIds =
      metricIds && Array.isArray(metricIds) && metricIds.length > 0;
    const isDatasource = datasource && datasource.trim() !== '';

    if (isMetricIds && isDatasource) {
      throw new Error('Cannot get metrics by both metricIds and datasource');
    }

    const baseUrl = await this.getBaseUrl();
    const url = new URL(`${baseUrl}/metrics`);

    if (isMetricIds) {
      url.searchParams.set('metricIds', metricIds.join(','));
    } else if (isDatasource) {
      url.searchParams.set('datasource', datasource);
    }

    try {
      const response = await this.fetchApi.fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch metric: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();

      if (
        !data ||
        Array.isArray(data) ||
        typeof data !== 'object' ||
        !('metrics' in data) ||
        !Array.isArray((data as any).metrics)
      ) {
        throw new TypeError('Invalid response format from metrics API');
      }

      return data as MetricsResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unexpected error fetching metric: ${String(error)}`);
    }
  }
}
