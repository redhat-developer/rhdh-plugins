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
import { CodecovMetricProvider } from './CodecovMetricProvider';
import { CODECOV_METRICS, CODECOV_METRIC_CONFIG } from './CodecovConfig';

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
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'coverage',
      );
      expect(provider.getProviderDatasourceId()).toBe('codecov');
    });

    it('returns correct provider ID for each metric', () => {
      for (const metricId of CODECOV_METRICS) {
        const provider = CodecovMetricProvider.fromConfig(
          config,
          logger,
          metricId,
        );
        expect(provider.getProviderId()).toBe(
          CODECOV_METRIC_CONFIG[metricId].id,
        );
      }
    });

    it('returns number as metric type', () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'coverage',
      );
      expect(provider.getMetricType()).toBe('number');
    });

    it('returns metric with history enabled', () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'coverage',
      );
      expect(provider.getMetric().history).toBe(true);
    });

    it('returns catalog filter for codecov.io/repo annotation', () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'coverage',
      );
      const filter = provider.getCatalogFilter();
      expect('metadata.annotations.codecov.io/repo' in filter).toBe(true);
    });
  });

  describe('batch methods', () => {
    it('returns all metric IDs', () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'coverage',
      );
      const ids = provider.getMetricIds();
      expect(ids).toHaveLength(7);
      expect(ids).toContain('codecov.coverage');
      expect(ids).toContain('codecov.coverage_trend');
      expect(ids).toContain('codecov.tracked_files');
    });

    it('returns all metrics', () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'coverage',
      );
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(7);
      expect(metrics.every(m => m.type === 'number')).toBe(true);
    });
  });

  describe('calculateMetric', () => {
    it('returns coverage value', async () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'coverage',
      );
      const result = await provider.calculateMetric(entity);
      expect(result).toBe(53.59);
    });

    it('returns tracked files count', async () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'tracked_files',
      );
      const result = await provider.calculateMetric(entity);
      expect(result).toBe(2252);
    });

    it('returns tracked lines count', async () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'tracked_lines',
      );
      const result = await provider.calculateMetric(entity);
      expect(result).toBe(85789);
    });

    it('returns covered lines count', async () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'covered_lines',
      );
      const result = await provider.calculateMetric(entity);
      expect(result).toBe(45982);
    });

    it('returns partial lines count', async () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'partial_lines',
      );
      const result = await provider.calculateMetric(entity);
      expect(result).toBe(1561);
    });

    it('returns missed lines count', async () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'missed_lines',
      );
      const result = await provider.calculateMetric(entity);
      expect(result).toBe(38246);
    });

    it('returns coverage trend value', async () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'coverage_trend',
      );
      const result = await provider.calculateMetric(entity);
      expect(result).toBe(0);
    });
  });

  describe('calculateMetrics (batch)', () => {
    it('returns all 7 metrics from a single API call', async () => {
      const provider = CodecovMetricProvider.fromConfig(
        config,
        logger,
        'coverage',
      );
      const results = await provider.calculateMetrics(entity);

      expect(results.size).toBe(7);
      expect(results.get('codecov.coverage')).toBe(53.59);
      expect(results.get('codecov.coverage_trend')).toBe(0);
      expect(results.get('codecov.tracked_files')).toBe(2252);
      expect(results.get('codecov.tracked_lines')).toBe(85789);
      expect(results.get('codecov.covered_lines')).toBe(45982);
      expect(results.get('codecov.partial_lines')).toBe(1561);
      expect(results.get('codecov.missed_lines')).toBe(38246);

      // Should only have made one fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
