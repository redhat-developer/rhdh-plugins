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
import { mockServices } from '@backstage/backend-test-utils';

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
const mockLogger = mockServices.logger.mock();

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
  describe('getMetrics', () => {
    it('should create provider with default thresholds on metric', () => {
      const provider = SonarQubeNumberMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'open_issues',
      );
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].threshold).toBeDefined();
      expect(metrics[0].threshold.rules).toBeDefined();
    });
  });

  describe('calculateMetrics', () => {
    it('should call getOpenIssuesCount for open_issues metric', async () => {
      mockGetOpenIssuesCount.mockResolvedValue(42);
      const provider = SonarQubeNumberMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'open_issues',
      );

      const results = await provider.calculateMetrics(entity());

      expect(results.get(provider.getProviderId())).toBe(42);
      expect(mockGetOpenIssuesCount).toHaveBeenCalledWith(
        'my-project',
        undefined,
      );
      expect(mockGetMeasures).not.toHaveBeenCalled();
    });

    it.each([
      ['security_rating', 'security_rating', 2],
      ['security_issues', 'vulnerabilities', 7],
      ['security_review_rating', 'security_review_rating', 1],
      ['security_hotspots', 'security_hotspots', 3],
      ['reliability_rating', 'reliability_rating', 1],
      ['reliability_issues', 'bugs', 12],
      ['maintainability_rating', 'sqale_rating', 2],
      ['maintainability_issues', 'code_smells', 45],
      ['code_coverage', 'coverage', 82.5],
      ['code_duplications', 'duplicated_lines_density', 3.2],
    ] as const)(
      'should call getMeasures with %s API key for %s metric',
      async (metricId, apiKey, value) => {
        mockGetMeasures.mockResolvedValue({ [apiKey]: value });
        const provider = SonarQubeNumberMetricProvider.fromConfig(
          mockConfig,
          mockLogger,
          metricId,
        );

        const results = await provider.calculateMetrics(entity());

        expect(results.get(provider.getProviderId())).toBe(value);
        expect(mockGetMeasures).toHaveBeenCalledWith(
          'my-project',
          [apiKey],
          undefined,
        );
        expect(mockGetOpenIssuesCount).not.toHaveBeenCalled();
      },
    );

    it('should pass instanceName when annotation has instance prefix', async () => {
      mockGetOpenIssuesCount.mockResolvedValue(5);
      const provider = SonarQubeNumberMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'open_issues',
      );

      await provider.calculateMetrics(entity('internal/my-project'));

      expect(mockGetOpenIssuesCount).toHaveBeenCalledWith(
        'my-project',
        'internal',
      );
    });

    it('should throw when annotation is missing', async () => {
      const provider = SonarQubeNumberMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'open_issues',
      );
      const e = entity();
      delete e.metadata.annotations!['sonarqube.org/project-key'];

      await expect(provider.calculateMetrics(e)).rejects.toThrow(
        "Missing annotation 'sonarqube.org/project-key'",
      );
    });

    it('should return 0 when no open issues', async () => {
      mockGetOpenIssuesCount.mockResolvedValue(0);
      const provider = SonarQubeNumberMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'open_issues',
      );

      const results = await provider.calculateMetrics(entity());
      expect(results.get(provider.getProviderId())).toBe(0);
    });
  });
});
