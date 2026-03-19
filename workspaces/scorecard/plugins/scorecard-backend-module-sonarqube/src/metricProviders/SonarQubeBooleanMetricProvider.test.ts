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
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
      );
      expect(provider.getProviderDatasourceId()).toBe('sonarqube');
    });
  });

  describe('getProviderId', () => {
    it('returns sonarqube.quality_gate', () => {
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
      );
      expect(provider.getProviderId()).toBe('sonarqube.quality_gate');
    });
  });

  describe('getMetricType', () => {
    it('returns boolean', () => {
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
      );
      expect(provider.getMetricType()).toBe('boolean');
    });
  });

  describe('getMetric', () => {
    it('returns quality gate metric metadata', () => {
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
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
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
      );
      expect(provider.getMetricThresholds()).toBeDefined();
      expect(provider.getMetricThresholds().rules).toHaveLength(2);
    });

    it('returns custom thresholds when provided', () => {
      const custom = { rules: [{ key: 'ok', expression: '==true' }] };
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
        custom,
      );
      expect(provider.getMetricThresholds()).toEqual(custom);
    });
  });

  describe('getCatalogFilter', () => {
    it('requires sonarqube.org/project-key annotation', () => {
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
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
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
      );

      const result = await provider.calculateMetric(entity());

      expect(result).toBe(true);
      expect(mockGetQualityGateStatus).toHaveBeenCalledWith('my-project');
    });

    it('returns false when quality gate fails', async () => {
      mockGetQualityGateStatus.mockResolvedValue(false);
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
      );

      const result = await provider.calculateMetric(entity());

      expect(result).toBe(false);
    });

    it('throws when annotation is missing', async () => {
      const provider = new SonarQubeBooleanMetricProvider(
        mockConfig,
        mockLogger,
      );
      const e = entity();
      delete e.metadata.annotations!['sonarqube.org/project-key'];

      await expect(provider.calculateMetric(e)).rejects.toThrow(
        "Missing annotation 'sonarqube.org/project-key'",
      );
    });
  });
});
