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
  describe('getMetricThresholds', () => {
    it('should create provider with default thresholds', () => {
      const provider = SonarQubeNumberMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'openIssues',
      );
      expect(provider.getMetricThresholds()).toBeDefined();
      expect(provider.getMetricThresholds().rules).toBeDefined();
    });
  });

  describe('calculateMetric', () => {
    it('should call getOpenIssuesCount for openIssues metric', async () => {
      mockGetOpenIssuesCount.mockResolvedValue(42);
      const provider = SonarQubeNumberMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'openIssues',
      );

      const result = await provider.calculateMetric(entity());

      expect(result).toBe(42);
      expect(mockGetOpenIssuesCount).toHaveBeenCalledWith(
        'my-project',
        undefined,
      );
      expect(mockGetMeasures).not.toHaveBeenCalled();
    });

    it.each([
      ['securityRating', 'security_rating', 2],
      ['securityIssues', 'vulnerabilities', 7],
      ['securityReviewRating', 'security_review_rating', 1],
      ['securityHotspots', 'security_hotspots', 3],
      ['reliabilityRating', 'reliability_rating', 1],
      ['reliabilityIssues', 'bugs', 12],
      ['maintainabilityRating', 'sqale_rating', 2],
      ['maintainabilityIssues', 'code_smells', 45],
      ['codeCoverage', 'coverage', 82.5],
      ['codeDuplications', 'duplicated_lines_density', 3.2],
    ] as const)(
      'should call getMeasures with %s API key for %s metric',
      async (metricId, apiKey, value) => {
        mockGetMeasures.mockResolvedValue({ [apiKey]: value });
        const provider = SonarQubeNumberMetricProvider.fromConfig(
          mockConfig,
          mockLogger,
          metricId,
        );

        const result = await provider.calculateMetric(entity());

        expect(result).toBe(value);
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
        'openIssues',
      );

      await provider.calculateMetric(entity('internal/my-project'));

      expect(mockGetOpenIssuesCount).toHaveBeenCalledWith(
        'my-project',
        'internal',
      );
    });

    it('should throw when annotation is missing', async () => {
      const provider = SonarQubeNumberMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'openIssues',
      );
      const e = entity();
      delete e.metadata.annotations!['sonarqube.org/project-key'];

      await expect(provider.calculateMetric(e)).rejects.toThrow(
        "Missing annotation 'sonarqube.org/project-key'",
      );
    });

    it('should return 0 when no open issues', async () => {
      mockGetOpenIssuesCount.mockResolvedValue(0);
      const provider = SonarQubeNumberMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'openIssues',
      );

      expect(await provider.calculateMetric(entity())).toBe(0);
    });
  });
});
