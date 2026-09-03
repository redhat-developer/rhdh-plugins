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
  MetricTimeSeriesResponse,
  AggregatedMetricTimeSeriesResponse,
  CollectorMetadata,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import type { GetAggregatedScorecardEntitiesOptions } from '../components/types';

export { ScorecardQueryProvider } from './ScorecardQueryProvider';

import type {
  GetAggregationTimeSeriesOptions,
  GetMetricTimeSeriesOptions,
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

      const resultRaw = data.result;
      if (
        resultRaw === null ||
        typeof resultRaw !== 'object' ||
        Array.isArray(resultRaw)
      ) {
        throw new TypeError(
          'Invalid response format from aggregated scorecard API: result must be a non-null object',
        );
      }

      const requireFiniteNumber = (value: unknown, fieldName: string) => {
        const n = Number(value ?? 0);
        if (!Number.isFinite(n)) {
          throw new TypeError(
            `Invalid aggregated scorecard API response: ${fieldName} must be a finite number`,
          );
        }
        return n;
      };

      const resultRecord = resultRaw as Record<string, unknown>;
      const timestampValue = resultRecord.timestamp;
      let timestamp: string;
      if (typeof timestampValue === 'string') {
        timestamp = timestampValue;
      } else if (
        typeof timestampValue === 'number' &&
        Number.isFinite(timestampValue)
      ) {
        timestamp = String(timestampValue);
      } else if (typeof timestampValue === 'bigint') {
        timestamp = timestampValue.toString();
      } else if (timestampValue instanceof Date) {
        timestamp = timestampValue.toISOString();
      } else {
        timestamp = '';
      }

      return {
        ...data,
        result: {
          ...resultRecord,
          total: requireFiniteNumber(resultRecord.total, 'total'),
          entitiesConsidered: requireFiniteNumber(
            resultRecord.entitiesConsidered,
            'entitiesConsidered',
          ),
          calculationErrorCount: requireFiniteNumber(
            resultRecord.calculationErrorCount,
            'calculationErrorCount',
          ),
          timestamp,
        },
      } as AggregatedMetricResult;
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

  async getAggregationTimeSeries({
    aggregationId,
    from,
    to,
  }: GetAggregationTimeSeriesOptions): Promise<AggregatedMetricTimeSeriesResponse> {
    if (!aggregationId || aggregationId.trim() === '') {
      throw new Error(
        'Aggregation ID is required for aggregation time-series lookup',
      );
    }

    if (!from || !to) {
      throw new Error(
        'from and to are required for aggregation time-series lookup',
      );
    }

    const baseUrl = await this.getBaseUrl();
    const url = new URL(`${baseUrl}/aggregations/${aggregationId}/time-series`);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);

    try {
      const response = await this.fetchApi.fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch aggregation time series: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();

      if (
        !data ||
        Array.isArray(data) ||
        typeof data !== 'object' ||
        typeof data.id !== 'string' ||
        typeof data.metricId !== 'string' ||
        !Array.isArray(data.points)
      ) {
        throw new TypeError(
          'Invalid response format from aggregation time-series API',
        );
      }

      return data as AggregatedMetricTimeSeriesResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unexpected error fetching aggregation time series: ${String(error)}`,
      );
    }
  }

  async getMetricTimeSeries({
    entity,
    metricId,
    from,
    to,
  }: GetMetricTimeSeriesOptions): Promise<MetricTimeSeriesResponse> {
    if (
      !entity?.kind ||
      !entity?.metadata?.namespace ||
      !entity?.metadata?.name
    ) {
      throw new Error(
        'Entity missing required properties for scorecard lookup',
      );
    }

    if (!metricId || metricId.trim() === '') {
      throw new Error('Metric ID is required for time-series lookup');
    }

    if (!from || !to) {
      throw new Error('from and to are required for time-series lookup');
    }

    const baseUrl = await this.getBaseUrl();
    const url = new URL(
      `${baseUrl}/metrics/catalog/${entity.kind}/${entity.metadata.namespace}/${entity.metadata.name}/time-series`,
    );
    url.searchParams.set('metricId', metricId);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);

    try {
      const response = await this.fetchApi.fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch metric time series: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();

      if (
        !data ||
        Array.isArray(data) ||
        typeof data !== 'object' ||
        typeof data.metricId !== 'string' ||
        typeof data.entityRef !== 'string' ||
        !Array.isArray(data.points)
      ) {
        throw new TypeError(
          'Invalid response format from metric time-series API',
        );
      }

      return data as MetricTimeSeriesResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unexpected error fetching metric time series: ${String(error)}`,
      );
    }
  }

  async getMetricCollectors(metricId: string): Promise<CollectorMetadata[]> {
    if (!metricId || metricId.trim() === '') {
      throw new Error('Metric ID is required for collectors lookup');
    }

    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/metrics/${encodeURIComponent(metricId)}/collectors`;

    try {
      const response = await this.fetchApi.fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch metric collectors: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();

      if (
        !data ||
        Array.isArray(data) ||
        typeof data !== 'object' ||
        !Array.isArray(data.collectors) ||
        !data.collectors.every(isCollectorMetadata)
      ) {
        throw new TypeError(
          'Invalid response format from metric collectors API',
        );
      }

      return data.collectors;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unexpected error fetching metric collectors: ${String(error)}`,
      );
    }
  }
}

function isCollectorMetadata(value: unknown): value is CollectorMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const collector = value as Record<string, unknown>;
  return (
    typeof collector.id === 'string' &&
    typeof collector.description === 'string'
  );
}
