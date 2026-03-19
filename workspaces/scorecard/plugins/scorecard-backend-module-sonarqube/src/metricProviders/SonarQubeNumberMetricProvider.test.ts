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
import type { Entity } from '@backstage/catalog-model';
import { SonarQubeNumberMetricProvider } from './SonarQubeNumberMetricProvider';
import { SONARQUBE_METRIC_CONFIG } from './SonarQubeConfig';

jest.mock('../clients/SonarQubeClient');

const mockGetOpenIssuesCount = jest.fn();
const mockGetMeasures = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  const { SonarQubeClient } = jest.requireMock('../clients/SonarQubeClient');
  SonarQubeClient.mockImplementation(() => ({
    getOpenIssuesCount: mockGetOpenIssuesCount,
    getMeasures: mockGetMeasures,
  }));
});

const mockConfig = new ConfigReader({});
const mockLogger = {
  child: jest.fn().mockReturnThis(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
} as any;

function entity(projectKey = 'my-project'): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      annotations: { 'sonarqube.org/project-key': projectKey },
    },
  } as Entity;
}

describe('SonarQubeNumberMetricProvider', () => {
  describe('getProviderDatasourceId', () => {
    it('returns sonarqube', () => {
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'open_issues',
      );
      expect(provider.getProviderDatasourceId()).toBe('sonarqube');
    });
  });

  describe('getProviderId / getMetric', () => {
    it.each([
      ['open_issues', 'sonarqube.open_issues', 'SonarQube Open Issues'],
      [
        'security_rating',
        'sonarqube.security_rating',
        'SonarQube Security Rating',
      ],
      [
        'security_issues',
        'sonarqube.security_issues',
        'SonarQube Security Issues',
      ],
    ] as const)(
      'for %s returns id %s and title %s',
      (metricId, expectedId, expectedTitle) => {
        const provider = new SonarQubeNumberMetricProvider(
          mockConfig,
          mockLogger,
          metricId,
        );
        expect(provider.getProviderId()).toBe(expectedId);
        const metric = provider.getMetric();
        expect(metric.id).toBe(expectedId);
        expect(metric.title).toBe(expectedTitle);
        expect(metric.description).toBe(
          SONARQUBE_METRIC_CONFIG[metricId].description,
        );
      },
    );
  });

  describe('getMetricType', () => {
    it('returns number', () => {
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'open_issues',
      );
      expect(provider.getMetricType()).toBe('number');
    });
  });

  describe('getMetricThresholds', () => {
    it('returns default thresholds when none provided', () => {
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'open_issues',
      );
      expect(provider.getMetricThresholds()).toBeDefined();
      expect(provider.getMetricThresholds().rules).toBeDefined();
    });

    it('returns custom thresholds when provided', () => {
      const custom = { rules: [{ key: 'ok', expression: '<1' }] };
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'open_issues',
        custom,
      );
      expect(provider.getMetricThresholds()).toEqual(custom);
    });
  });

  describe('getCatalogFilter', () => {
    it('requires sonarqube.org/project-key annotation', () => {
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'open_issues',
      );
      const filter = provider.getCatalogFilter();
      expect(
        filter['metadata.annotations.sonarqube.org/project-key'],
      ).toBeDefined();
    });
  });

  describe('calculateMetric', () => {
    it('calls getOpenIssuesCount for open_issues metric', async () => {
      mockGetOpenIssuesCount.mockResolvedValue(42);
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'open_issues',
      );

      const result = await provider.calculateMetric(entity());

      expect(result).toBe(42);
      expect(mockGetOpenIssuesCount).toHaveBeenCalledWith(
        'my-project',
        undefined,
      );
      expect(mockGetMeasures).not.toHaveBeenCalled();
    });

    it('calls getMeasures with security_rating key for security_rating metric', async () => {
      mockGetMeasures.mockResolvedValue({ security_rating: 2 });
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'security_rating',
      );

      const result = await provider.calculateMetric(entity());

      expect(result).toBe(2);
      expect(mockGetMeasures).toHaveBeenCalledWith(
        'my-project',
        ['security_rating'],
        undefined,
      );
      expect(mockGetOpenIssuesCount).not.toHaveBeenCalled();
    });

    it('calls getMeasures with vulnerabilities key for security_issues metric', async () => {
      mockGetMeasures.mockResolvedValue({ vulnerabilities: 7 });
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'security_issues',
      );

      const result = await provider.calculateMetric(entity());

      expect(result).toBe(7);
      expect(mockGetMeasures).toHaveBeenCalledWith(
        'my-project',
        ['vulnerabilities'],
        undefined,
      );
    });

    it('passes instanceName when annotation has instance prefix', async () => {
      mockGetOpenIssuesCount.mockResolvedValue(5);
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'open_issues',
      );

      await provider.calculateMetric(entity('internal/my-project'));

      expect(mockGetOpenIssuesCount).toHaveBeenCalledWith(
        'my-project',
        'internal',
      );
    });

    it('throws when annotation is missing', async () => {
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'open_issues',
      );
      const e = entity();
      delete e.metadata.annotations!['sonarqube.org/project-key'];

      await expect(provider.calculateMetric(e)).rejects.toThrow(
        "Missing annotation 'sonarqube.org/project-key'",
      );
    });

    it('returns 0 when no open issues', async () => {
      mockGetOpenIssuesCount.mockResolvedValue(0);
      const provider = new SonarQubeNumberMetricProvider(
        mockConfig,
        mockLogger,
        'open_issues',
      );

      expect(await provider.calculateMetric(entity())).toBe(0);
    });
  });
});
