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

import { InMemoryCatalogClient } from '@backstage/catalog-client/testUtils';
import type { Entity } from '@backstage/catalog-model';
import {
  type MetricResult,
  type AggregatedMetricResult,
  type Metric,
  type EntityMetricDetailResponse,
  type AggregationMetadata,
  type MetricTimeSeriesResponse,
  type AggregatedMetricTimeSeriesResponse,
  aggregationTypes,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import type { GetAggregatedScorecardEntitiesOptions } from '../src/components/types';

import {
  mockAggregatedScorecardData,
  mockScorecardErrorData,
  mockScorecardSuccessData,
} from '../__fixtures__/scorecardData';
import { mockAggregatedScorecardEntitiesData } from '../__fixtures__/aggregatedScorecardEntitiesData';
import {
  ScorecardApi,
  ScorecardOptions,
  GetMetricTimeSeriesOptions,
  GetAggregationTimeSeriesOptions,
} from '../src/api/types';

/** mock catalog entity so the Catalog shows one entity and the Scorecard tab can be opened. */
export const mockComponentEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    namespace: 'default',
    name: 'example-service',
    description: 'Example service',
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
  },
};

export const mockCatalogApi = new InMemoryCatalogClient({
  entities: [mockComponentEntity],
});

export class MockScorecardApi implements ScorecardApi {
  async getBaseUrl(): Promise<string> {
    return 'https://example.com';
  }

  async getScorecards(_options: ScorecardOptions): Promise<MetricResult[]> {
    return [...mockScorecardSuccessData, ...mockScorecardErrorData];
  }

  async getAggregatedScorecard(
    _aggregationId: string,
  ): Promise<AggregatedMetricResult> {
    return mockAggregatedScorecardData[aggregationTypes.statusGrouped];
  }

  async getMetrics(_options: {
    metricIds: string[];
  }): Promise<{ metrics: Metric[] }> {
    const allMetrics = [
      ...mockScorecardSuccessData,
      ...mockScorecardErrorData,
    ].map(m => ({
      id: m.id,
      title: m.metadata.title,
      description: m.metadata.description,
      type: m.metadata.type,
      thresholds: m.result.thresholdResult.definition ?? { rules: [] },
      history: m.metadata.history,
    }));
    return { metrics: allMetrics };
  }

  async getAggregatedScorecardEntities(
    options: GetAggregatedScorecardEntitiesOptions,
  ): Promise<EntityMetricDetailResponse> {
    return mockAggregatedScorecardEntitiesData(
      options.metricId,
      options.page ?? 1,
      options.pageSize ?? 10,
    ) as EntityMetricDetailResponse;
  }

  async getAggregationMetadata(
    aggregationId: string,
  ): Promise<AggregationMetadata> {
    if (
      aggregationId === 'avgDeploymentFrequency' ||
      aggregationId.startsWith('dora.')
    ) {
      return {
        title: 'Average Deployment Frequency',
        description:
          'This KPI provides average weekly production deploys over a 30-day window per entity.',
        type: 'number',
        unit: '/week',
        history: true,
        visualization: 'sparkline',
        aggregationType: aggregationTypes.average,
      };
    }

    return {
      title: 'GitHub open issues',
      description: 'GitHub open issues',
      type: 'number',
      history: true,
      aggregationType: aggregationTypes.statusGrouped,
    };
  }

  async getAggregationTimeSeries({
    aggregationId,
  }: GetAggregationTimeSeriesOptions): Promise<AggregatedMetricTimeSeriesResponse> {
    return {
      id: aggregationId,
      metricId: 'dora.deploymentFrequency',
      metadata: {
        title: 'Average Deployment Frequency',
        description:
          'This KPI provides average weekly production deploys over a 30-day window per entity.',
        type: 'number',
        unit: '/week',
        history: true,
        visualization: 'sparkline',
        aggregationType: aggregationTypes.average,
      },
      points: [
        {
          value: 10,
          successCount: 5,
          errorCount: 0,
          total: 5,
          status: 'success',
          timestamp: '2026-08-23T00:00:00.000Z',
        },
        {
          value: 6.8,
          successCount: 4,
          errorCount: 3,
          total: 7,
          status: 'success',
          timestamp: '2026-08-24T00:00:00.000Z',
        },
      ],
      thresholds: {
        rules: [
          { key: 'elite', expression: '>=7', color: 'success.main' },
          { key: 'medium', expression: '1-7', color: 'warning.main' },
          { key: 'error', expression: '<1', color: 'error.main' },
        ],
      },
      aggregationChartDisplayColor: 'warning.main',
    };
  }

  async getMetricTimeSeries({
    entity,
    metricId,
  }: GetMetricTimeSeriesOptions): Promise<MetricTimeSeriesResponse> {
    return {
      metricId,
      entityRef: `${entity.kind}:${entity.metadata.namespace}/${entity.metadata.name}`,
      points: [
        { value: 8, timestamp: '2026-04-27T23:10:00.000Z' },
        { value: 7, timestamp: '2026-04-28T22:55:00.000Z' },
      ],
      metadata: {
        title: metricId,
        description: '',
        type: 'number',
        history: true,
        defaultVisualization: 'sparkline',
      },
    };
  }

  async getMetricCollectors(metricId: string) {
    if (metricId.startsWith('dora.')) {
      return [
        {
          id: 'github:deploymentWorkflowRuns',
          description: 'Collects deployments from GitHub Actions.',
        },
        {
          id: 'jira:incidents',
          description: 'Collects Jira incidents.',
        },
      ];
    }
    return [];
  }
}
