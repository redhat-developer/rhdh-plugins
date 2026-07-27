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
  CODE_COVERAGE_THRESHOLDS,
  type CodeCoverageMetricId,
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

function createProvider(
  metricId: CodeCoverageMetricId,
): CodeCoverageMetricProvider {
  const { CodeCoverageClient } = jest.requireMock(
    '../clients/CodeCoverageClient',
  );
  const client = new CodeCoverageClient(mockAuth, mockDiscovery, mockLogger);
  return new CodeCoverageMetricProvider(client, metricId);
}

describe('CodeCoverageMetricProvider', () => {
  describe('getProviderDatasourceId', () => {
    it('returns codeCoverage', () => {
      const provider = createProvider('linePercentage');
      expect(provider.getProviderDatasourceId()).toBe('codeCoverage');
    });
  });

  describe('getProviderId / getMetrics', () => {
    it.each([
      [
        'linePercentage',
        'codeCoverage.linePercentage',
        'Code coverage (Lines)',
      ],
      [
        'lineAvailable',
        'codeCoverage.lineAvailable',
        'Code coverage - Tracked lines of code',
      ],
      [
        'lineCovered',
        'codeCoverage.lineCovered',
        'Code coverage - Covered lines of code',
      ],
      [
        'lineMissed',
        'codeCoverage.lineMissed',
        'Code coverage - Missed lines of code',
      ],
      [
        'branchPercentage',
        'codeCoverage.branchPercentage',
        'Code coverage (Branches)',
      ],
      [
        'branchAvailable',
        'codeCoverage.branchAvailable',
        'Code coverage - Tracked branches',
      ],
      [
        'branchCovered',
        'codeCoverage.branchCovered',
        'Code coverage - Covered branches',
      ],
      [
        'branchMissed',
        'codeCoverage.branchMissed',
        'Code coverage - Missed branches',
      ],
    ] as const)(
      'for %s returns id %s and title %s',
      (metricId, expectedId, expectedTitle) => {
        const provider = createProvider(metricId);
        expect(provider.getProviderId()).toBe(expectedId);
        const metrics = provider.getMetrics();
        expect(metrics).toHaveLength(1);
        const metric = metrics[0];
        expect(metric.id).toBe(expectedId);
        expect(metric.title).toBe(expectedTitle);
        expect(metric.description).toBe(
          CODE_COVERAGE_METRIC_CONFIG[metricId].description,
        );
        expect(metric.type).toBe('number');
        expect(metric.thresholds).toEqual(CODE_COVERAGE_THRESHOLDS[metricId]);
        expect(metric.history).toBe(true);
      },
    );
  });

  describe('getCatalogFilter', () => {
    it('requires backstage.io/code-coverage annotation', () => {
      const provider = createProvider('linePercentage');
      expect(provider.getCatalogFilter()).toEqual({
        [`metadata.annotations.${CODE_COVERAGE_ANNOTATION}`]:
          CATALOG_FILTER_EXISTS,
      });
    });
  });

  describe('calculateMetrics', () => {
    it.each([
      ['linePercentage', 'codeCoverage.linePercentage', 80],
      ['lineAvailable', 'codeCoverage.lineAvailable', 5],
      ['lineCovered', 'codeCoverage.lineCovered', 4],
      ['lineMissed', 'codeCoverage.lineMissed', 1],
      ['branchPercentage', 'codeCoverage.branchPercentage', 70],
      ['branchAvailable', 'codeCoverage.branchAvailable', 10],
      ['branchCovered', 'codeCoverage.branchCovered', 7],
      ['branchMissed', 'codeCoverage.branchMissed', 3],
    ] as const)(
      'extracts %s from the report and returns %d',
      async (metricId, expectedKey, expectedValue) => {
        mockGetReport.mockResolvedValue(sampleReport);
        const provider = createProvider(metricId);

        const results = await provider.calculateMetrics(entity());

        expect(results.get(expectedKey)).toBe(expectedValue);
        expect(mockGetReport).toHaveBeenCalledWith(
          'component:default/my-service',
        );
      },
    );

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
      const provider = createProvider('branchPercentage');

      await expect(provider.calculateMetrics(entity())).rejects.toThrow(
        'missing aggregate branch data',
      );
    });

    it('propagates errors when getReport fails', async () => {
      mockGetReport.mockRejectedValueOnce(
        new Error('code-coverage unavailable'),
      );
      const provider = createProvider('linePercentage');

      await expect(provider.calculateMetrics(entity())).rejects.toThrow(
        'code-coverage unavailable',
      );
    });
  });
});
