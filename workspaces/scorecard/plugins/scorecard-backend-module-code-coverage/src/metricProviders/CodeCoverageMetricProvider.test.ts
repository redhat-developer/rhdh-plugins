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

import { CodeCoverageMetricProvider } from './CodeCoverageMetricProvider';
import {
  CODE_COVERAGE_ANNOTATION,
  CODE_COVERAGE_METRIC_CONFIG,
  CODE_COVERAGE_THRESHOLDS,
  type CodeCoverageMetricId,
} from './CodeCoverageConfig';
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
  const client = new CodeCoverageClient(mockDiscovery, mockLogger);
  return new CodeCoverageMetricProvider(client, metricId);
}

describe('CodeCoverageMetricProvider', () => {
  describe('getProviderDatasourceId', () => {
    it('returns code-coverage', () => {
      const provider = createProvider('line_percentage');
      expect(provider.getProviderDatasourceId()).toBe('code-coverage');
    });
  });

  describe('getProviderId / getMetric', () => {
    it.each([
      [
        'line_percentage',
        'code-coverage.line_percentage',
        'Code coverage (Lines)',
      ],
      [
        'line_available',
        'code-coverage.line_available',
        'Code coverage - Tracked lines of code',
      ],
      [
        'line_covered',
        'code-coverage.line_covered',
        'Code coverage - Covered lines of code',
      ],
      [
        'line_missed',
        'code-coverage.line_missed',
        'Code coverage - Missed lines of code',
      ],
      [
        'branch_percentage',
        'code-coverage.branch_percentage',
        'Code coverage (Branches)',
      ],
      [
        'branch_available',
        'code-coverage.branch_available',
        'Code coverage - Tracked branches',
      ],
      [
        'branch_covered',
        'code-coverage.branch_covered',
        'Code coverage - Covered branches',
      ],
      [
        'branch_missed',
        'code-coverage.branch_missed',
        'Code coverage - Missed branches',
      ],
    ] as const)(
      'for %s returns id %s and title %s',
      (metricId, expectedId, expectedTitle) => {
        const provider = createProvider(metricId);
        expect(provider.getProviderId()).toBe(expectedId);
        const metric = provider.getMetric();
        expect(metric.id).toBe(expectedId);
        expect(metric.title).toBe(expectedTitle);
        expect(metric.description).toBe(
          CODE_COVERAGE_METRIC_CONFIG[metricId].description,
        );
        expect(metric.type).toBe('number');
        expect(metric.history).toBe(true);
      },
    );
  });

  describe('getMetricType', () => {
    it('returns number', () => {
      const provider = createProvider('line_percentage');
      expect(provider.getMetricType()).toBe('number');
    });
  });

  describe('getMetricThresholds', () => {
    it('returns percentage thresholds for percentage metrics', () => {
      const provider = createProvider('line_percentage');
      expect(provider.getMetricThresholds()).toEqual(
        CODE_COVERAGE_THRESHOLDS.line_percentage,
      );
      expect(provider.getMetricThresholds().rules.length).toBeGreaterThan(0);
    });

    it('returns empty thresholds for count metrics', () => {
      const provider = createProvider('line_available');
      expect(provider.getMetricThresholds()).toEqual(
        CODE_COVERAGE_THRESHOLDS.line_available,
      );
      expect(provider.getMetricThresholds().rules).toHaveLength(0);
    });
  });

  describe('getCatalogFilter', () => {
    it('requires backstage.io/code-coverage annotation', () => {
      const provider = createProvider('line_percentage');
      expect(provider.getCatalogFilter()).toEqual({
        [`metadata.annotations.${CODE_COVERAGE_ANNOTATION}`]:
          CATALOG_FILTER_EXISTS,
      });
    });
  });

  describe('calculateMetric', () => {
    it.each([
      ['line_percentage', 80],
      ['line_available', 5],
      ['line_covered', 4],
      ['line_missed', 1],
      ['branch_percentage', 70],
      ['branch_available', 10],
      ['branch_covered', 7],
      ['branch_missed', 3],
    ] as const)(
      'extracts %s from the report and returns %d',
      async (metricId, expectedValue) => {
        mockGetReport.mockResolvedValue(sampleReport);
        const provider = createProvider(metricId);

        const result = await provider.calculateMetric(entity());

        expect(result).toBe(expectedValue);
        expect(mockGetReport).toHaveBeenCalledWith(
          'component:default/my-service',
        );
      },
    );

    it('propagates errors when getReport fails', async () => {
      mockGetReport.mockRejectedValueOnce(
        new Error('code-coverage unavailable'),
      );
      const provider = createProvider('line_percentage');

      await expect(provider.calculateMetric(entity())).rejects.toThrow(
        'code-coverage unavailable',
      );
    });
  });
});
