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
import type {
  MetricResult,
  AggregatedMetricResult,
  AggregationMetadata,
  Metric,
  EntityMetricDetailResponse,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import type { GetAggregatedScorecardEntitiesOptions } from '../components/types';

import type {
  ScorecardApi,
  ScorecardApiClientOptions,
  ScorecardOptions,
} from './types';

export const scorecardApiRef = createApiRef<ScorecardApi>({
  id: 'plugin.scorecard.service',
});

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

  async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('scorecard');
  }

  async getScorecards({
    entity,
    metricIds,
  }: ScorecardOptions): Promise<MetricResult[]> {
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
    aggregationId: string,
  ): Promise<AggregatedMetricResult> {
    if (!aggregationId || aggregationId.trim() === '') {
      throw new Error('Aggregation ID is required for aggregated scorecards');
    }

    const baseUrl = await this.getBaseUrl();
    const url = new URL(`${baseUrl}/aggregations/${aggregationId}`);

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

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unexpected error fetching aggregated scorecards: ${String(error)}`,
      );
    }
  }

  async getMetrics(options?: {
    metricIds?: string[];
  }): Promise<{ metrics: Metric[] }> {
    const { metricIds } = options || {};

    const isMetricIds =
      metricIds && Array.isArray(metricIds) && metricIds.length > 0;

    const baseUrl = await this.getBaseUrl();
    const url = new URL(`${baseUrl}/metrics`);

    if (isMetricIds) {
      url.searchParams.set('metricIds', metricIds.join(','));
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
        !Array.isArray(data.metrics)
      ) {
        throw new TypeError('Invalid response format from metrics API');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unexpected error fetching metric: ${String(error)}`);
    }
  }

  async getAggregatedScorecardEntities(
    options: GetAggregatedScorecardEntitiesOptions,
  ): Promise<EntityMetricDetailResponse> {
    const {
      metricId,
      page,
      pageSize,
      ownershipEntityRefs = [],
      orderBy = null,
      order = 'asc',
    } = options;

    if (!metricId) {
      throw new Error('Metric ID is required for aggregated scorecards');
    }

    const baseUrl = await this.getBaseUrl();
    const url = new URL(
      `${baseUrl}/metrics/${metricId}/catalog/aggregations/entities`,
    );
    if (page) {
      url.searchParams.append('page', page.toString());
    }
    if (pageSize) {
      url.searchParams.append('pageSize', pageSize.toString());
    }
    if (ownershipEntityRefs.length > 0) {
      for (const ownershipEntityRef of ownershipEntityRefs) {
        url.searchParams.append('owner', ownershipEntityRef);
      }
    }
    if (orderBy) {
      url.searchParams.append('sortBy', orderBy);
      url.searchParams.append('sortOrder', order);
    }

    try {
      const response = await this.fetchApi.fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch aggregated scorecards: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();

      if (!data || Array.isArray(data) || typeof data !== 'object') {
        throw new TypeError(
          'Invalid response format from aggregated scorecard API',
        );
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unexpected error fetching aggregated scorecards: ${String(error)}`,
      );
    }
  }

  async getAggregationMetadata(
    aggregationId: string,
  ): Promise<AggregationMetadata> {
    if (!aggregationId || aggregationId.trim() === '') {
      throw new Error('Aggregation ID is required for aggregation metadata');
    }

    const baseUrl = await this.getBaseUrl();
    const url = new URL(`${baseUrl}/aggregations/${aggregationId}/metadata`);

    try {
      const response = await this.fetchApi.fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch aggregation metadata: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();

      if (
        !data ||
        Array.isArray(data) ||
        typeof data !== 'object' ||
        !('title' in data) ||
        !('description' in data) ||
        !('type' in data) ||
        !('aggregationType' in data)
      ) {
        throw new TypeError(
          'Invalid response format from aggregation metadata API',
        );
      }

      return data as AggregationMetadata;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unexpected error fetching aggregation metadata: ${String(error)}`,
      );
    }
  }
}
