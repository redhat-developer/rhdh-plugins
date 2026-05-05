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
      id: 'github.open_prs',
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
});
