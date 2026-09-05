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

import { ScorecardApiClient } from './index';
import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

describe('ScorecardApiClient', () => {
  const discoveryApi = {
    getBaseUrl: jest
      .fn()
      .mockResolvedValue('http://localhost:7007/api/scorecard'),
  };
  const fetchApi = {
    fetch: jest.fn(),
  };

  const client = new ScorecardApiClient({
    discoveryApi: discoveryApi as any,
    fetchApi: fetchApi as any,
  });

  const entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      namespace: 'default',
      name: 'svc-a',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBaseUrl', () => {
    it('should return the base URL', async () => {
      const result = await client.getBaseUrl();
      expect(result).toEqual('http://localhost:7007/api/scorecard');
    });
  });

  describe('getScorecards', () => {
    const metricRow: MetricResult = {
      id: 'github.openPRs',
      status: 'success',
      metadata: {
        title: 'Open PRs',
        description: 'Count',
        type: 'number',
      },
      result: {
        value: 1,
        timestamp: '2025-01-01T00:00:00Z',
        thresholdResult: {
          status: 'success',
          definition: undefined,
          evaluation: null,
          error: undefined,
        },
      },
    };

    it('should build catalog URL from entity and returns parsed array', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => [metricRow],
      });

      const result = await client.getScorecards({ entity });

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/scorecard/metrics/catalog/Component/default/svc-a',
      );
      expect(result).toEqual([metricRow]);
    });

    it('should append metricIds as comma-separated query param', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => [metricRow],
      });

      await client.getScorecards({
        entity,
        metricIds: ['a.b', 'c.d'],
      });

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/scorecard/metrics/catalog/Component/default/svc-a?metricIds=a.b%2Cc.d',
      );
    });

    it('should throw when entity is missing required fields', async () => {
      await expect(
        client.getScorecards({
          entity: { ...entity, kind: '' as any },
        }),
      ).rejects.toThrow(
        'Entity missing required properties for scorecard lookup',
      );
      expect(fetchApi.fetch).not.toHaveBeenCalled();
    });

    it('should throw on non-OK response', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Something went terribly wrong',
      });

      await expect(client.getScorecards({ entity })).rejects.toThrow(
        'Failed to fetch scorecards: 500 Internal Server Error. Something went terribly wrong',
      );
    });

    it('should throw when response JSON is not an array', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ not: 'array' }),
      });

      await expect(client.getScorecards({ entity })).rejects.toThrow(
        'Invalid response format from scorecard API',
      );
    });
  });

  describe('getAggregatedScorecard', () => {
    const validAggregated = {
      id: 'myKpi',
      status: 'success',
      metadata: {
        title: 'T',
        description: 'D',
        type: 'number',
        history: true,
        aggregationType: 'statusGrouped',
      },
      result: {
        total: 1,
        values: [{ name: 'success', count: 1 }],
        timestamp: '2025-01-01T00:00:00Z',
        thresholds: {},
        entitiesConsidered: 1,
        calculationErrorCount: 0,
      },
    };

    it('should throw when aggregationId is empty', async () => {
      await expect(client.getAggregatedScorecard('')).rejects.toThrow(
        'Aggregation ID is required for aggregated scorecards',
      );
      expect(fetchApi.fetch).not.toHaveBeenCalled();
    });

    it('should fetch aggregations path and returns object', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => validAggregated,
      });

      const out = await client.getAggregatedScorecard('myKpi');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/scorecard/aggregations/myKpi',
      );
      expect(out).toEqual(validAggregated);
    });

    it('should throw TypeError when response is an array', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await expect(client.getAggregatedScorecard('myKpi')).rejects.toThrow(
        'Invalid response format from aggregated scorecard API',
      );
    });

    it('should throw TypeError when required top-level keys are missing', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'x', status: 'success' }),
      });

      await expect(client.getAggregatedScorecard('myKpi')).rejects.toThrow(
        'Invalid response format from aggregated scorecard API',
      );
    });

    it('should throw TypeError when result is null', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...validAggregated,
          result: null,
        }),
      });

      await expect(client.getAggregatedScorecard('myKpi')).rejects.toThrow(
        'result must be a non-null object',
      );
    });

    it('should default missing numeric result fields to 0', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...validAggregated,
          result: {
            total: 2,
            values: [{ name: 'success', count: 2 }],
            timestamp: '2025-01-01T00:00:00Z',
            thresholds: {},
          },
        }),
      });

      const out = await client.getAggregatedScorecard('myKpi');

      expect(out.result.entitiesConsidered).toBe(0);
      expect(out.result.calculationErrorCount).toBe(0);
      expect(out.result.total).toBe(2);
    });

    it('should throw TypeError when a normalized numeric field is non-finite', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...validAggregated,
          result: {
            ...validAggregated.result,
            entitiesConsidered: Number.NaN,
          },
        }),
      });

      await expect(client.getAggregatedScorecard('myKpi')).rejects.toThrow(
        'entitiesConsidered must be a finite number',
      );
    });
  });

  describe('getAggregationMetadata', () => {
    const validMeta = {
      title: 'T',
      description: 'D',
      type: 'number',
      history: false,
      aggregationType: 'statusGrouped',
    };

    it('should fetch metadata path and returns object', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => validMeta,
      });

      const out = await client.getAggregationMetadata('myKpi');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/scorecard/aggregations/myKpi/metadata',
      );
      expect(out).toEqual(validMeta);
    });

    it('should throw TypeError when required metadata fields are missing', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'T',
          description: 'D',
          type: 'number',
        }),
      });

      await expect(client.getAggregationMetadata('myKpi')).rejects.toThrow(
        'Invalid response format from aggregation metadata API',
      );
    });

    it('should throw on non-OK response', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'missing',
      });

      await expect(client.getAggregationMetadata('myKpi')).rejects.toThrow(
        'Failed to fetch aggregation metadata: 404 Not Found',
      );
    });
  });

  describe('getAggregationTimeSeries', () => {
    const validTimeSeries = {
      id: 'avgDeploymentFrequency',
      metricId: 'dora.deploymentFrequency',
      points: [
        {
          value: 10,
          successCount: 5,
          errorCount: 0,
          total: 5,
          status: 'success',
          timestamp: '2026-08-23T00:00:00.000Z',
        },
      ],
      metadata: {
        title: 'Average Deployment Frequency',
        description: 'Average weekly production deploys',
        type: 'number',
        history: true,
        visualization: 'sparkline',
        aggregationType: 'average',
      },
      thresholds: { rules: [] },
      aggregationChartDisplayColor: 'warning.main',
    };

    const range = {
      from: '2026-07-24T00:00:00.000Z',
      to: '2026-08-23T00:00:00.000Z',
    };

    it('should build the time-series URL from aggregationId and range', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => validTimeSeries,
      });

      const result = await client.getAggregationTimeSeries({
        aggregationId: 'avgDeploymentFrequency',
        ...range,
      });

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/scorecard/aggregations/avgDeploymentFrequency/time-series?from=2026-07-24T00%3A00%3A00.000Z&to=2026-08-23T00%3A00%3A00.000Z',
      );
      expect(result).toEqual(validTimeSeries);
    });

    it('should throw when aggregationId is empty', async () => {
      await expect(
        client.getAggregationTimeSeries({
          aggregationId: '',
          ...range,
        }),
      ).rejects.toThrow(
        'Aggregation ID is required for aggregation time-series lookup',
      );
      expect(fetchApi.fetch).not.toHaveBeenCalled();
    });

    it('should throw when from or to is missing', async () => {
      await expect(
        client.getAggregationTimeSeries({
          aggregationId: 'avgDeploymentFrequency',
          from: '',
          to: range.to,
        }),
      ).rejects.toThrow(
        'from and to are required for aggregation time-series lookup',
      );
      expect(fetchApi.fetch).not.toHaveBeenCalled();
    });

    it('should throw when the response is not a time-series object', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await expect(
        client.getAggregationTimeSeries({
          aggregationId: 'avgDeploymentFrequency',
          ...range,
        }),
      ).rejects.toThrow(
        'Invalid response format from aggregation time-series API',
      );
    });

    it('should throw on non-OK response', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'not scalar',
      });

      await expect(
        client.getAggregationTimeSeries({
          aggregationId: 'openPrsKpi',
          ...range,
        }),
      ).rejects.toThrow(
        'Failed to fetch aggregation time series: 400 Bad Request. not scalar',
      );
    });
  });

  describe('getMetricTimeSeries', () => {
    const validTimeSeries = {
      metricId: 'dora.deploymentFrequency',
      entityRef: 'component:default/svc-a',
      points: [{ value: 8, timestamp: '2026-04-27T23:10:00.000Z' }],
      metadata: {
        title: 'Deployment Frequency',
        description: 'How often we deploy',
        type: 'number',
        history: true,
        defaultVisualization: 'sparkline',
      },
    };

    const range = {
      from: '2026-03-31T00:00:00.000Z',
      to: '2026-04-30T00:00:00.000Z',
    };

    it('should build the time-series URL from entity, metricId, and range', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => validTimeSeries,
      });

      const result = await client.getMetricTimeSeries({
        entity,
        metricId: 'dora.deploymentFrequency',
        ...range,
      });

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/scorecard/metrics/catalog/Component/default/svc-a/time-series?metricId=dora.deploymentFrequency&from=2026-03-31T00%3A00%3A00.000Z&to=2026-04-30T00%3A00%3A00.000Z',
      );
      expect(result).toEqual(validTimeSeries);
    });

    it('should throw when metricId is empty', async () => {
      await expect(
        client.getMetricTimeSeries({
          entity,
          metricId: '',
          ...range,
        }),
      ).rejects.toThrow('Metric ID is required for time-series lookup');
      expect(fetchApi.fetch).not.toHaveBeenCalled();
    });

    it('should throw when the response is not a time-series object', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await expect(
        client.getMetricTimeSeries({
          entity,
          metricId: 'dora.deploymentFrequency',
          ...range,
        }),
      ).rejects.toThrow('Invalid response format from metric time-series API');
    });

    it('should throw on non-OK response', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'nope',
      });

      await expect(
        client.getMetricTimeSeries({
          entity,
          metricId: 'dora.deploymentFrequency',
          ...range,
        }),
      ).rejects.toThrow(
        'Failed to fetch metric time series: 500 Internal Server Error. nope',
      );
    });
  });

  describe('getMetricCollectors', () => {
    const collectorsResponse = {
      collectors: [
        {
          id: 'github:deploymentWorkflowRuns',
          description: 'Collects deployments from GitHub Actions.',
        },
        {
          id: 'jira:incidents',
          description: 'Collects Jira incidents.',
        },
      ],
    };

    it('should request collectors for the metric id', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => collectorsResponse,
      });

      const result = await client.getMetricCollectors('dora.changeFailureRate');

      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/scorecard/metrics/dora.changeFailureRate/collectors',
      );
      expect(result).toEqual(collectorsResponse.collectors);
    });

    it('should throw when metric id is empty', async () => {
      await expect(client.getMetricCollectors('')).rejects.toThrow(
        'Metric ID is required for collectors lookup',
      );
      expect(fetchApi.fetch).not.toHaveBeenCalled();
    });

    it('should throw when the response is not a collectors object', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await expect(
        client.getMetricCollectors('dora.changeFailureRate'),
      ).rejects.toThrow('Invalid response format from metric collectors API');
    });

    it('should throw on non-OK response', async () => {
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'nope',
      });

      await expect(
        client.getMetricCollectors('dora.changeFailureRate'),
      ).rejects.toThrow(
        'Failed to fetch metric collectors: 500 Internal Server Error. nope',
      );
    });
  });
});
