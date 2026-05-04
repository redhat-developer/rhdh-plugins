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

import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

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
  describe('getMetricThresholds', () => {
    it('should return default thresholds when none provided', () => {
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );
      expect(provider.getMetricThresholds()).toBeDefined();
      expect(provider.getMetricThresholds().rules).toHaveLength(2);
    });

    it('should return custom thresholds when provided', () => {
      const custom: ThresholdConfig = {
        rules: [
          { key: 'ok', expression: '==true', color: '#00ff00', icon: 'ok' },
        ],
      };
      const mockConfiWithCustomThresholds = new ConfigReader({
        scorecard: {
          plugins: {
            sonarqube: {
              quality_gate: {
                thresholds: custom,
              },
            },
          },
        },
      });
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfiWithCustomThresholds,
        mockLogger,
        'quality_gate',
      );
      expect(provider.getMetricThresholds()).toEqual(custom);
    });
  });

  describe('calculateMetric', () => {
    it('should return true when quality gate passes', async () => {
      mockGetQualityGateStatus.mockResolvedValue(true);
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );

      const result = await provider.calculateMetric(entity());

      expect(result).toBe(true);
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

      const result = await provider.calculateMetric(entity());

      expect(result).toBe(false);
    });

    it('should pass instanceName when annotation has instance prefix', async () => {
      mockGetQualityGateStatus.mockResolvedValue(true);
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );

      await provider.calculateMetric(entity('internal/my-project'));

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

      await expect(provider.calculateMetric(e)).rejects.toThrow(
        "Missing annotation 'sonarqube.org/project-key'",
      );
    });
  });
});
