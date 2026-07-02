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

import { SonarQubeBooleanMetricProvider } from './SonarQubeBooleanMetricProvider';
import { mockServices } from '@backstage/backend-test-utils';

jest.mock('../clients/SonarQubeClient');

const mockGetQualityGateStatus = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  const { SonarQubeClient } = jest.requireMock('../clients/SonarQubeClient');
  SonarQubeClient.mockImplementation(() => ({
    getQualityGateStatus: mockGetQualityGateStatus,
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

describe('SonarQubeBooleanMetricProvider', () => {
  describe('getMetrics', () => {
    it('should create provider with default thresholds on metric', () => {
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].threshold).toBeDefined();
      expect(metrics[0].threshold.rules).toHaveLength(2);
    });
  });

  describe('calculateMetrics', () => {
    it('should return true when quality gate passes', async () => {
      mockGetQualityGateStatus.mockResolvedValue(true);
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );

      const results = await provider.calculateMetrics(entity());

      expect(results.get(provider.getProviderId())).toBe(true);
      expect(mockGetQualityGateStatus).toHaveBeenCalledWith(
        'my-project',
        undefined,
      );
    });

    it('should return false when quality gate fails', async () => {
      mockGetQualityGateStatus.mockResolvedValue(false);
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );

      const results = await provider.calculateMetrics(entity());

      expect(results.get(provider.getProviderId())).toBe(false);
    });

    it('should pass instanceName when annotation has instance prefix', async () => {
      mockGetQualityGateStatus.mockResolvedValue(true);
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );

      await provider.calculateMetrics(entity('internal/my-project'));

      expect(mockGetQualityGateStatus).toHaveBeenCalledWith(
        'my-project',
        'internal',
      );
    });

    it('should throw when annotation is missing', async () => {
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );
      const e = entity();
      delete e.metadata.annotations!['sonarqube.org/project-key'];

      await expect(provider.calculateMetrics(e)).rejects.toThrow(
        "Missing annotation 'sonarqube.org/project-key'",
      );
    });
  });
});
