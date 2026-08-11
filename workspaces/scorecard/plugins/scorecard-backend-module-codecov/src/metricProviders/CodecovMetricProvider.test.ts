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

import { ConfigReader } from '@backstage/config';
import { Entity } from '@backstage/catalog-model';
import { mockServices } from '@backstage/backend-test-utils';
import {
  CodecovMetricProvider,
  CODECOV_METRIC_CONFIG,
} from './CodecovMetricProvider';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

const SAMPLE_RESPONSE = {
  name: 'rhdh-plugins',
  private: false,
  updatestamp: '2026-06-19T10:29:51.283089Z',
  author: {
    service: 'github',
    username: 'redhat-developer',
    name: 'redhat-developer',
  },
  language: 'typescript',
  branch: 'main',
  active: true,
  activated: true,
  totals: {
    files: 2252,
    lines: 85789,
    hits: 45982,
    misses: 38246,
    partials: 1561,
    coverage: 53.59,
    branches: 24121,
    methods: 13480,
    sessions: 23,
    complexity: 0.0,
    complexity_total: 0.0,
    complexity_ratio: 0,
    diff: 0,
  },
};

function createEntity(annotations: Record<string, string>): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-entity',
      namespace: 'default',
      annotations,
    },
    spec: {
      type: 'service',
      owner: 'test',
      lifecycle: 'production',
    },
  };
}

describe('CodecovMetricProvider', () => {
  const config = new ConfigReader({});
  const logger = mockServices.logger.mock();

  const entity = createEntity({
    'codecov.io/repo': 'redhat-developer/rhdh-plugins',
    'github.com/project-slug': 'redhat-developer/rhdh-plugins',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    });
  });

  describe('provider metadata', () => {
    it('returns codecov as datasource ID', () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      expect(provider.getProviderDatasourceId()).toBe('codecov');
    });

    it('returns codecov as provider ID', () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      expect(provider.getProviderId()).toBe('codecov.coverageReport');
    });

    it('returns catalog filter for codecov.io/repo annotation', () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      const filter = provider.getCatalogFilter();
      expect('metadata.annotations.codecov.io/repo' in filter).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('returns all 7 metrics', () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(7);
    });

    it('returns metrics with correct IDs', () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      const metrics = provider.getMetrics();
      const ids = metrics.map(m => m.id);
      expect(ids).toEqual([
        'codecov.coverage',
        'codecov.coverageTrend',
        'codecov.trackedFiles',
        'codecov.trackedLines',
        'codecov.coveredLines',
        'codecov.partialLines',
        'codecov.missedLines',
      ]);
    });

    it('all metrics have type number, thresholds, and history', () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      const metrics = provider.getMetrics();
      for (const metric of metrics) {
        expect(metric.type).toBe('number');
        expect(metric.thresholds).toBeDefined();
        expect(metric.thresholds.rules.length).toBeGreaterThan(0);
        expect(metric.history).toBe(true);
      }
    });

    it('uses lowerCamelCase metric IDs', () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      const metrics = provider.getMetrics();
      const trendMetric = metrics.find(
        m => m.id === CODECOV_METRIC_CONFIG.coverage_trend.id,
      );
      expect(trendMetric?.id).toBe('codecov.coverageTrend');
    });
  });

  describe('calculateMetrics', () => {
    it('returns all 7 metric values', async () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      const results = await provider.calculateMetrics(entity);
      expect(results.size).toBe(7);
    });

    it('returns correct values for all metrics', async () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      const results = await provider.calculateMetrics(entity);
      expect(results.get('codecov.coverage')).toBe(53.59);
      expect(results.get('codecov.coverageTrend')).toBe(0);
      expect(results.get('codecov.trackedFiles')).toBe(2252);
      expect(results.get('codecov.trackedLines')).toBe(85789);
      expect(results.get('codecov.coveredLines')).toBe(45982);
      expect(results.get('codecov.partialLines')).toBe(1561);
      expect(results.get('codecov.missedLines')).toBe(38246);
    });

    it('makes only one fetch call per calculateMetrics', async () => {
      const provider = CodecovMetricProvider.fromConfig(config, logger);
      await provider.calculateMetrics(entity);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
