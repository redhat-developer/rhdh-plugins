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

import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';
import { mockServices } from '@backstage/backend-test-utils';

import { CodecovMetricProvider } from './CodecovMetricProvider';
import {
  CODECOV_METRICS,
  CODECOV_METRIC_CONFIG,
  CODECOV_THRESHOLDS,
} from './CodecovConfig';
import { CODECOV_REPO_ANNOTATION } from '../annotations';
import type { CodecovRepoResponse } from '../clients/types';

jest.mock('../clients/CodecovClient');

const mockGetRepoData = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  const { CodecovClient } = jest.requireMock('../clients/CodecovClient');
  CodecovClient.mockImplementation(() => ({
    getRepoData: mockGetRepoData,
  }));
});

const mockLogger = mockServices.logger.mock();

function entity(): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      namespace: 'default',
      annotations: {
        [CODECOV_REPO_ANNOTATION]: 'redhat-developer/rhdh-plugins',
        'github.com/project-slug': 'redhat-developer/rhdh-plugins',
      },
    },
  } as Entity;
}

const sampleResponse: CodecovRepoResponse = {
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

function createProvider(): CodecovMetricProvider {
  const { CodecovClient } = jest.requireMock('../clients/CodecovClient');
  const mockConfig = mockServices.rootConfig({ data: {} });
  const client = new CodecovClient(mockConfig, mockLogger);
  return new CodecovMetricProvider(client);
}

describe('CodecovMetricProvider', () => {
  describe('getProviderDatasourceId', () => {
    it('returns codecov', () => {
      const provider = createProvider();
      expect(provider.getProviderDatasourceId()).toBe('codecov');
    });
  });

  describe('getProviderId', () => {
    it('returns codecov.repoMetrics', () => {
      const provider = createProvider();
      expect(provider.getProviderId()).toBe('codecov.repoMetrics');
    });
  });

  describe('getMetrics', () => {
    it('returns all seven metrics', () => {
      const provider = createProvider();
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(7);
      expect(metrics.map(m => m.id)).toEqual([
        'codecov.codeCoverage',
        'codecov.codeCoverageTrend',
        'codecov.trackedFiles',
        'codecov.trackedLines',
        'codecov.coveredLines',
        'codecov.partialLines',
        'codecov.missedLines',
      ]);
    });

    it('returns correct titles and descriptions for each metric', () => {
      const provider = createProvider();
      const metrics = provider.getMetrics();
      for (const metricId of CODECOV_METRICS) {
        const meta = CODECOV_METRIC_CONFIG[metricId];
        const metric = metrics.find(m => m.id === meta.id);
        expect(metric).toBeDefined();
        expect(metric!.title).toBe(meta.title);
        expect(metric!.description).toBe(meta.description);
        expect(metric!.type).toBe('number');
        expect(metric!.thresholds).toEqual(CODECOV_THRESHOLDS[metricId]);
        expect(metric!.history).toBe(true);
      }
    });

    it('includes unit for codeCoverage metric', () => {
      const provider = createProvider();
      const metrics = provider.getMetrics();
      const coverage = metrics.find(m => m.id === 'codecov.codeCoverage');
      expect(coverage!.unit).toBe('%');
    });
  });

  describe('getCatalogFilter', () => {
    it('requires codecov.io/repo annotation', () => {
      const provider = createProvider();
      expect(provider.getCatalogFilter()).toEqual({
        [`metadata.annotations.${CODECOV_REPO_ANNOTATION}`]:
          CATALOG_FILTER_EXISTS,
      });
    });
  });

  describe('calculateMetrics', () => {
    it('extracts all metrics from the API response', async () => {
      mockGetRepoData.mockResolvedValue(sampleResponse);
      const provider = createProvider();

      const results = await provider.calculateMetrics(entity());

      expect(results.size).toBe(7);
      expect(results.get('codecov.codeCoverage')).toBe(53.59);
      expect(results.get('codecov.codeCoverageTrend')).toBe(0);
      expect(results.get('codecov.trackedFiles')).toBe(2252);
      expect(results.get('codecov.trackedLines')).toBe(85789);
      expect(results.get('codecov.coveredLines')).toBe(45982);
      expect(results.get('codecov.partialLines')).toBe(1561);
      expect(results.get('codecov.missedLines')).toBe(38246);
    });

    it('calls getRepoData only once for all metrics', async () => {
      mockGetRepoData.mockResolvedValue(sampleResponse);
      const provider = createProvider();

      await provider.calculateMetrics(entity());

      expect(mockGetRepoData).toHaveBeenCalledTimes(1);
    });

    it('propagates errors when getRepoData fails', async () => {
      mockGetRepoData.mockRejectedValueOnce(
        new Error('Codecov API unavailable'),
      );
      const provider = createProvider();

      await expect(provider.calculateMetrics(entity())).rejects.toThrow(
        'Codecov API unavailable',
      );
    });
  });
});
