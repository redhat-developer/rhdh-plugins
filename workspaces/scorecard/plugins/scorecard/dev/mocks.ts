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
  type MetricTimeSeriesPoint,
  type MetricTimeSeriesResponse,
  type AggregatedMetricTimeSeriesResponse,
  aggregationTypes,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import type { GetAggregatedScorecardEntitiesOptions } from '../src/components/types';

import { mockAggregatedMetricTimeSeriesData } from '../__fixtures__/aggregatedMetricTimeSeriesData';
import { mockAggregatedScorecardEntitiesData } from '../__fixtures__/aggregatedScorecardEntitiesData';
import { mockMetricTimeSeriesData } from '../__fixtures__/metricTimeSeriesData';
import {
  mockAggregatedScorecardData,
  mockScorecardErrorData,
  mockScorecardSuccessData,
} from '../__fixtures__/scorecardData';
import {
  ScorecardApi,
  ScorecardOptions,
  GetMetricTimeSeriesOptions,
  GetAggregationTimeSeriesOptions,
} from '../src/api/types';

function createMockComponentEntity(
  name: string,
  description = 'Example service',
): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      namespace: 'default',
      name,
      description,
    },
    spec: {
      type: 'service',
      lifecycle: 'production',
    },
  };
}

/** Default catalog entity used by the isolated Scorecard tab page. */
export const mockComponentEntity = createMockComponentEntity(
  'example-service',
  'Example service',
);

/**
 * Catalog entities matching the mock aggregation drill-down table.
 * Without these, entity-name links 404 with "Entity not found".
 */
const mockEntitiesFromAggregatedTable = mockAggregatedScorecardEntitiesData(
  'github.openPRs',
  1,
  10,
).entities.map(entity =>
  createMockComponentEntity(
    entity.entityName,
    `Mock catalog entity for ${entity.entityName}`,
  ),
);

export const mockCatalogApi = new InMemoryCatalogClient({
  entities: [
    mockComponentEntity,
    createMockComponentEntity(
      'dora-scorecard-1',
      'Plugin-mode DORA sparkline fixture entity',
    ),
    ...mockEntitiesFromAggregatedTable,
  ],
});

const SPARKLINE_AGGREGATION_IDS = new Set([
  'avgDeploymentFrequency',
  'avgChangeFailureRate',
  'avgMedianLeadTimeForChanges',
]);

const DORA_COLLECTORS = [
  'github:doraDeploymentWorkflowRuns',
  'jira:doraIncidents',
];

const COLLECTOR_DESCRIPTIONS: Record<string, string> = {
  'github:doraDeploymentWorkflowRuns':
    'Collects deployments from GitHub Actions.',
  'jira:doraIncidents': 'Collects Jira incidents.',
};

const lastNumericPoint = (
  points: MetricTimeSeriesPoint[],
): MetricTimeSeriesPoint | undefined =>
  [...points].reverse().find(point => typeof point.value === 'number');

const lastNumericPoints = (
  points: MetricTimeSeriesPoint[],
  count: number,
): MetricTimeSeriesPoint[] =>
  points.filter(point => typeof point.value === 'number').slice(-count);

const sparklineMetricResult = ({
  metricId,
  title,
  description,
  collectorIds = DORA_COLLECTORS,
}: {
  metricId: string;
  title: string;
  description?: string;
  collectorIds?: string[];
}): MetricResult => {
  const series = mockMetricTimeSeriesData(mockComponentEntity, metricId);
  const latest = lastNumericPoint(series.points);

  return {
    id: metricId,
    status: 'success',
    metadata: {
      title,
      description: description ?? series.metadata.description,
      type: 'number',
      unit: series.metadata.unit,
      history: true,
      defaultVisualization: 'sparkline',
      ...(collectorIds.length > 0 ? { collectorIds } : {}),
    },
    result: {
      value: latest?.value ?? 0,
      timestamp: latest?.timestamp ?? new Date().toISOString(),
      thresholdResult: {
        status: 'success',
        evaluation: latest?.thresholdEvaluation ?? null,
        definition: series.thresholds ?? { rules: [] },
      },
    },
  };
};

/**
 * Entity-page sparkline cards for plugin `yarn start`.
 * Time-series shapes are applied in {@link MockScorecardApi.getMetricTimeSeries}
 * so you can exercise charts without seeding the workspace database.
 */
const mockPluginSparklineMetrics: MetricResult[] = [
  sparklineMetricResult({
    metricId: 'dora.deploymentFrequency',
    title: 'DORA - Deployment Frequency (full series + errors)',
  }),
  sparklineMetricResult({
    metricId: 'dora.changeFailureRate',
    title: 'DORA - Change Failure Rate (2 points)',
  }),
  sparklineMetricResult({
    metricId: 'dora.medianLeadTimeForChanges',
    title: 'DORA - Median Lead Time for Changes (1 point)',
  }),
  sparklineMetricResult({
    metricId: 'dora.meanTimeToRestore',
    title: 'DORA - Mean Time to Restore (full series + errors)',
  }),
  sparklineMetricResult({
    metricId: 'mock.sparklineEmpty',
    title: 'Sparkline (plugin) — empty series',
    description:
      'Plugin-mode fixture with no time-series points. Tests the empty-state card without a database.',
    collectorIds: [],
  }),
  sparklineMetricResult({
    metricId: 'mock.sparklineAllErrors',
    title: 'Sparkline (plugin) — all calculation errors',
    description:
      'Plugin-mode fixture where every day is a calculation failure. Tests error-day markers without a database.',
  }),
  sparklineMetricResult({
    metricId: 'mock.sparklineFetchError',
    title: 'Sparkline (plugin) — fetch error',
    description:
      'Plugin-mode fixture that rejects the time-series request. Tests the card error panel without a database.',
  }),
  sparklineMetricResult({
    metricId: 'mock.sparklineThresholdsError',
    title: 'Sparkline (plugin) — thresholdsError',
    description:
      'Plugin-mode fixture where entity threshold resolution failed. Tests the thresholdsError banner with plotted values.',
  }),
];

const allMockMetrics = (): MetricResult[] => [
  ...mockPluginSparklineMetrics,
  ...mockScorecardSuccessData,
  ...mockScorecardErrorData,
];

export class MockScorecardApi implements ScorecardApi {
  async getBaseUrl(): Promise<string> {
    return 'https://example.com';
  }

  async getScorecards(_options: ScorecardOptions): Promise<MetricResult[]> {
    return allMockMetrics();
  }

  async getAggregatedScorecard(
    _aggregationId: string,
  ): Promise<AggregatedMetricResult> {
    return mockAggregatedScorecardData[aggregationTypes.statusGrouped];
  }

  async getMetrics(_options: {
    metricIds: string[];
  }): Promise<{ metrics: Metric[] }> {
    const metrics = allMockMetrics().map(m => ({
      id: m.id,
      title: m.metadata.title,
      description: m.metadata.description,
      type: m.metadata.type,
      thresholds: m.result.thresholdResult.definition ?? { rules: [] },
      history: m.metadata.history,
      unit: m.metadata.unit,
      defaultVisualization: m.metadata.defaultVisualization,
      collectorIds: m.metadata.collectorIds,
    }));
    return { metrics };
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
      SPARKLINE_AGGREGATION_IDS.has(aggregationId) ||
      aggregationId.startsWith('dora.')
    ) {
      return mockAggregatedMetricTimeSeriesData(aggregationId).metadata;
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
    from,
    to,
  }: GetAggregationTimeSeriesOptions): Promise<AggregatedMetricTimeSeriesResponse> {
    return mockAggregatedMetricTimeSeriesData(aggregationId, from, to);
  }

  /**
   * Plugin-mode entity sparkline cases (no DB seeding):
   * - `dora.deploymentFrequency` — full series with calculation-error days (Elite)
   * - `dora.changeFailureRate` — 2 numeric points (Medium)
   * - `dora.medianLeadTimeForChanges` — 1 numeric point (Low)
   * - `dora.meanTimeToRestore` — full series with calculation-error days (Elite)
   * - `mock.sparklineEmpty` — no points
   * - `mock.sparklineAllErrors` — every point is a calculation failure
   * - `mock.sparklineFetchError` — request fails
   * - `mock.sparklineThresholdsError` — values present, `thresholdsError` set
   */
  async getMetricTimeSeries({
    entity,
    metricId,
    from,
    to,
  }: GetMetricTimeSeriesOptions): Promise<MetricTimeSeriesResponse> {
    if (metricId === 'mock.sparklineFetchError') {
      throw new Error('Failed to fetch metric time series (plugin mock)');
    }

    const series = mockMetricTimeSeriesData(entity, metricId, from, to);

    if (metricId === 'dora.medianLeadTimeForChanges') {
      return { ...series, points: lastNumericPoints(series.points, 1) };
    }
    if (metricId === 'dora.changeFailureRate') {
      return { ...series, points: lastNumericPoints(series.points, 2) };
    }
    if (metricId === 'mock.sparklineEmpty') {
      return { ...series, points: [] };
    }
    if (metricId === 'mock.sparklineThresholdsError') {
      return {
        metricId: series.metricId,
        entityRef: series.entityRef,
        metadata: series.metadata,
        thresholdsError: 'Error: Merge thresholds failed',
        points: series.points.map(point =>
          point.value === null
            ? point
            : { ...point, thresholdEvaluation: null },
        ),
      };
    }
    if (metricId === 'mock.sparklineAllErrors') {
      return {
        ...series,
        points: series.points.map((point, index) => ({
          value: null,
          timestamp: point.timestamp,
          error: index % 2 === 0 ? 'GitHub API 500' : 'Jira unavailable',
        })),
      };
    }

    return series;
  }

  async getMetricCollectors(metricId: string) {
    const metric = mockPluginSparklineMetrics.find(m => m.id === metricId);
    return (metric?.metadata.collectorIds ?? []).map(id => ({
      id,
      description: COLLECTOR_DESCRIPTIONS[id] ?? `Collector ${id}`,
    }));
  }
}
