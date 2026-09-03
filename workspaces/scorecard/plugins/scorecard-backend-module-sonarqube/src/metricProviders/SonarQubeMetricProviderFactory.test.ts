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

import type { Config } from '@backstage/config';
import { mockServices } from '@backstage/backend-test-utils';
import { SonarQubeMetricProviderFactory } from './SonarQubeMetricProviderFactory';
import {
  SONARQUBE_BOOLEAN_THRESHOLDS,
  SONARQUBE_NUMBER_THRESHOLDS,
} from './SonarQubeConfig';

jest.mock('../clients/SonarQubeClient');

describe('SonarQubeMetricProviderFactory', () => {
  let mockConfig: Config;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = mockServices.rootConfig.mock();
    mockLogger = mockServices.logger.mock();
  });

  describe('createMetricProvider', () => {
    it('should return a boolean provider when metric is qualityGate', () => {
      const provider = SonarQubeMetricProviderFactory.createMetricProvider(
        mockConfig,
        mockLogger,
        'qualityGate',
      );
      expect(provider.getProviderId()).toBe('sonarqube.qualityGate');
      expect(provider.getProviderDatasourceId()).toBe('sonarqube');
      expect(provider.getMetrics()[0]).toMatchObject({
        type: 'boolean',
        history: true,
        thresholds: SONARQUBE_BOOLEAN_THRESHOLDS,
      });
    });

    it('should return a number provider when metric is openIssues', () => {
      const provider = SonarQubeMetricProviderFactory.createMetricProvider(
        mockConfig,
        mockLogger,
        'openIssues',
      );
      expect(provider.getProviderId()).toBe('sonarqube.openIssues');
      expect(provider.getProviderDatasourceId()).toBe('sonarqube');
      expect(provider.getMetrics()[0]).toMatchObject({
        type: 'number',
        history: true,
        thresholds: SONARQUBE_NUMBER_THRESHOLDS.openIssues,
      });
    });

    it('should return a number provider when metric is securityRating', () => {
      const provider = SonarQubeMetricProviderFactory.createMetricProvider(
        mockConfig,
        mockLogger,
        'securityRating',
      );
      expect(provider.getProviderId()).toBe('sonarqube.securityRating');
      expect(provider.getProviderDatasourceId()).toBe('sonarqube');
      expect(provider.getMetrics()[0]).toMatchObject({
        type: 'number',
        history: true,
        thresholds: SONARQUBE_NUMBER_THRESHOLDS.securityRating,
      });
    });

    it('should return a number provider when metric is securityIssues', () => {
      const provider = SonarQubeMetricProviderFactory.createMetricProvider(
        mockConfig,
        mockLogger,
        'securityIssues',
      );
      expect(provider.getProviderId()).toBe('sonarqube.securityIssues');
      expect(provider.getProviderDatasourceId()).toBe('sonarqube');
      expect(provider.getMetrics()[0]).toMatchObject({
        type: 'number',
        history: true,
        thresholds: SONARQUBE_NUMBER_THRESHOLDS.securityIssues,
      });
    });
  });

  describe('fromConfig', () => {
    it('should return twelve providers with correct IDs', () => {
      const providers = SonarQubeMetricProviderFactory.fromConfig(
        mockConfig,
        mockLogger,
      );
      expect(providers).toHaveLength(12);
      expect(providers.map(p => p.getProviderId())).toEqual([
        'sonarqube.qualityGate',
        'sonarqube.openIssues',
        'sonarqube.securityRating',
        'sonarqube.securityIssues',
        'sonarqube.securityReviewRating',
        'sonarqube.securityHotspots',
        'sonarqube.reliabilityRating',
        'sonarqube.reliabilityIssues',
        'sonarqube.maintainabilityRating',
        'sonarqube.maintainabilityIssues',
        'sonarqube.codeCoverage',
        'sonarqube.codeDuplications',
      ]);
    });

    it('should return 1 boolean and 11 number providers', () => {
      const providers = SonarQubeMetricProviderFactory.fromConfig(
        mockConfig,
        mockLogger,
      );
      const types = providers.map(p => p.getMetrics()[0].type);
      expect(types.filter(t => t === 'boolean')).toHaveLength(1);
      expect(types.filter(t => t === 'number')).toHaveLength(11);
    });
  });
});
