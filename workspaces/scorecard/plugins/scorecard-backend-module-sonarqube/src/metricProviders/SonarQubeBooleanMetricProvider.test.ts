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

describe('SonarQubeBooleanMetricProvider', () => {
  describe('getProviderDatasourceId', () => {
    it('returns sonarqube', () => {
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );
      expect(provider.getProviderDatasourceId()).toBe('sonarqube');
    });
  });

  describe('getProviderId', () => {
    it('returns sonarqube.quality_gate', () => {
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );
      expect(provider.getProviderId()).toBe('sonarqube.quality_gate');
    });
  });

  describe('getMetricType', () => {
    it('returns boolean', () => {
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );
      expect(provider.getMetricType()).toBe('boolean');
    });
  });

  describe('getMetric', () => {
    it('returns quality gate metric metadata', () => {
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );
      const metric = provider.getMetric();
      expect(metric.id).toBe('sonarqube.quality_gate');
      expect(metric.title).toBe('SonarQube Quality Gate Status');
      expect(metric.type).toBe('boolean');
      expect(metric.history).toBe(true);
    });
  });

  describe('getMetricThresholds', () => {
    it('returns default thresholds when none provided', () => {
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );
      expect(provider.getMetricThresholds()).toBeDefined();
      expect(provider.getMetricThresholds().rules).toHaveLength(2);
    });

    it('returns custom thresholds when provided', () => {
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

  describe('getCatalogFilter', () => {
    it('requires sonarqube.org/project-key annotation', () => {
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );
      const filter = provider.getCatalogFilter();
      expect(
        filter['metadata.annotations.sonarqube.org/project-key'],
      ).toBeDefined();
    });
  });

  describe('calculateMetric', () => {
    it('returns true when quality gate passes', async () => {
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

    it('returns false when quality gate fails', async () => {
      mockGetQualityGateStatus.mockResolvedValue(false);
      const provider = SonarQubeBooleanMetricProvider.fromConfig(
        mockConfig,
        mockLogger,
        'quality_gate',
      );

      const result = await provider.calculateMetric(entity());

      expect(result).toBe(false);
    });

    it('passes instanceName when annotation has instance prefix', async () => {
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

    it('throws when annotation is missing', async () => {
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
