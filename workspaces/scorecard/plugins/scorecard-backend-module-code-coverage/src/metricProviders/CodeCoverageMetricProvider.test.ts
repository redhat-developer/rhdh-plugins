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

import {
  CodeCoverageMetricProvider,
  CODE_COVERAGE_METRIC_CONFIG,
  CODE_COVERAGE_METRICS,
  CODE_COVERAGE_THRESHOLDS,
} from './CodeCoverageMetricProvider';
import { CODE_COVERAGE_ANNOTATION } from './CodeCoverageConfig';
import type { CodeCoverageReport } from '../clients/types';

jest.mock('../clients/CodeCoverageClient');

const mockGetReport = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  const { CodeCoverageClient } = jest.requireMock(
    '../clients/CodeCoverageClient',
  );
  CodeCoverageClient.mockImplementation(() => ({
    getReport: mockGetReport,
  }));
});

const mockDiscovery = mockServices.discovery.mock();
const mockLogger = mockServices.logger.mock();
const mockAuth = mockServices.auth.mock();

function entity(): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      namespace: 'default',
      annotations: { [CODE_COVERAGE_ANNOTATION]: 'enabled' },
    },
  } as Entity;
}

const sampleReport: CodeCoverageReport = {
  aggregate: {
    line: { available: 5, covered: 4, missed: 1, percentage: 80 },
    branch: { available: 10, covered: 7, missed: 3, percentage: 70 },
  },
  entity: { kind: 'Component', name: 'my-service', namespace: 'default' },
  files: [],
};

function createProvider(): CodeCoverageMetricProvider {
  const { CodeCoverageClient } = jest.requireMock(
    '../clients/CodeCoverageClient',
  );
  const client = new CodeCoverageClient(mockAuth, mockDiscovery, mockLogger);
  return new CodeCoverageMetricProvider(client);
}

describe('CodeCoverageMetricProvider', () => {
  describe('getProviderDatasourceId', () => {
    it('returns codeCoverage', () => {
      const provider = createProvider();
      expect(provider.getProviderDatasourceId()).toBe('codeCoverage');
    });
  });

  describe('getProviderId', () => {
    it('returns codeCoverage.coverageReport', () => {
      const provider = createProvider();
      expect(provider.getProviderId()).toBe('codeCoverage.coverageReport');
    });
  });

  describe('getMetrics', () => {
    it('returns all eight metrics', () => {
      const provider = createProvider();
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(8);
      expect(metrics.map(m => m.id)).toEqual([
        'codeCoverage.linePercentage',
        'codeCoverage.lineAvailable',
        'codeCoverage.lineCovered',
        'codeCoverage.lineMissed',
        'codeCoverage.branchPercentage',
        'codeCoverage.branchAvailable',
        'codeCoverage.branchCovered',
        'codeCoverage.branchMissed',
      ]);
    });

    it('returns correct titles and descriptions for each metric', () => {
      const provider = createProvider();
      const metrics = provider.getMetrics();
      for (const metricId of CODE_COVERAGE_METRICS) {
        const meta = CODE_COVERAGE_METRIC_CONFIG[metricId];
        const metric = metrics.find(m => m.id === meta.id);
        expect(metric).toBeDefined();
        expect(metric!.title).toBe(meta.title);
        expect(metric!.description).toBe(meta.description);
        expect(metric!.type).toBe('number');
        expect(metric!.thresholds).toEqual(CODE_COVERAGE_THRESHOLDS[metricId]);
        expect(metric!.history).toBe(true);
      }
    });
  });

  describe('getCatalogFilter', () => {
    it('requires backstage.io/code-coverage annotation', () => {
      const provider = createProvider();
      expect(provider.getCatalogFilter()).toEqual({
        [`metadata.annotations.${CODE_COVERAGE_ANNOTATION}`]:
          CATALOG_FILTER_EXISTS,
      });
    });
  });

  describe('calculateMetrics', () => {
    it('extracts all metrics from the report', async () => {
      mockGetReport.mockResolvedValue(sampleReport);
      const provider = createProvider();

      const results = await provider.calculateMetrics(entity());

      expect(results.size).toBe(8);
      expect(results.get('codeCoverage.linePercentage')).toBe(80);
      expect(results.get('codeCoverage.lineAvailable')).toBe(5);
      expect(results.get('codeCoverage.lineCovered')).toBe(4);
      expect(results.get('codeCoverage.lineMissed')).toBe(1);
      expect(results.get('codeCoverage.branchPercentage')).toBe(70);
      expect(results.get('codeCoverage.branchAvailable')).toBe(10);
      expect(results.get('codeCoverage.branchCovered')).toBe(7);
      expect(results.get('codeCoverage.branchMissed')).toBe(3);
      expect(mockGetReport).toHaveBeenCalledWith(
        'component:default/my-service',
      );
    });

    it('calls getReport only once for all metrics', async () => {
      mockGetReport.mockResolvedValue(sampleReport);
      const provider = createProvider();

      await provider.calculateMetrics(entity());

      expect(mockGetReport).toHaveBeenCalledTimes(1);
    });

    it('throws when aggregate section is missing', async () => {
      const reportMissingBranch: CodeCoverageReport = {
        aggregate: {
          line: { available: 5, covered: 4, missed: 1, percentage: 80 },
        } as CodeCoverageReport['aggregate'],
        entity: {
          kind: 'Component',
          name: 'my-service',
          namespace: 'default',
        },
        files: [],
      };
      mockGetReport.mockResolvedValue(reportMissingBranch);
      const provider = createProvider();

      await expect(provider.calculateMetrics(entity())).rejects.toThrow(
        'missing aggregate branch data',
      );
    });

    it('throws when a field value is null within a section', async () => {
      const reportNullField: CodeCoverageReport = {
        aggregate: {
          line: {
            available: 5,
            covered: 4,
            missed: 1,
            percentage: null,
          } as unknown as CodeCoverageReport['aggregate']['line'],
          branch: { available: 10, covered: 7, missed: 3, percentage: 70 },
        },
        entity: {
          kind: 'Component',
          name: 'my-service',
          namespace: 'default',
        },
        files: [],
      };
      mockGetReport.mockResolvedValue(reportNullField);
      const provider = createProvider();

      await expect(provider.calculateMetrics(entity())).rejects.toThrow(
        'missing line.percentage data',
      );
    });

    it('propagates errors when getReport fails', async () => {
      mockGetReport.mockRejectedValueOnce(
        new Error('code-coverage unavailable'),
      );
      const provider = createProvider();

      await expect(provider.calculateMetrics(entity())).rejects.toThrow(
        'code-coverage unavailable',
      );
    });
  });
});
