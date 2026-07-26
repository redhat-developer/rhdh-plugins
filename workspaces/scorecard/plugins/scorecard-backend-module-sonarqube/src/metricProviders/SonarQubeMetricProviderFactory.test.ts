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
import { SonarQubeMetricProviderFactory } from './SonarQubeMetricProviderFactory';
import { mockServices } from '@backstage/backend-test-utils';

jest.mock('../clients/SonarQubeClient');

const mockConfig = new ConfigReader({});
const mockLogger = mockServices.logger.mock();

describe('createMetricProvider', () => {
  it('returns a boolean provider for qualityGate', () => {
    const provider = SonarQubeMetricProviderFactory.createMetricProvider(
      mockConfig,
      mockLogger,
      'qualityGate',
    );
    expect(provider.getProviderId()).toBe('sonarqube.qualityGate');
    expect(provider.getProviderDatasourceId()).toBe('sonarqube');
    expect(provider.getMetricType()).toBe('boolean');
  });

  it('returns a number provider for openIssues', () => {
    const provider = SonarQubeMetricProviderFactory.createMetricProvider(
      mockConfig,
      mockLogger,
      'openIssues',
    );
    expect(provider.getProviderId()).toBe('sonarqube.openIssues');
    expect(provider.getMetricType()).toBe('number');
  });

  it('returns a number provider for securityRating', () => {
    const provider = SonarQubeMetricProviderFactory.createMetricProvider(
      mockConfig,
      mockLogger,
      'securityRating',
    );
    expect(provider.getProviderId()).toBe('sonarqube.securityRating');
    expect(provider.getMetricType()).toBe('number');
  });

  it('returns a number provider for securityIssues', () => {
    const provider = SonarQubeMetricProviderFactory.createMetricProvider(
      mockConfig,
      mockLogger,
      'securityIssues',
    );
    expect(provider.getProviderId()).toBe('sonarqube.securityIssues');
    expect(provider.getMetricType()).toBe('number');
  });
});

describe('fromConfig', () => {
  it('returns twelve providers with correct IDs', () => {
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

  it('returns 1 boolean and 11 number providers', () => {
    const providers = SonarQubeMetricProviderFactory.fromConfig(
      mockConfig,
      mockLogger,
    );
    const types = providers.map(p => p.getMetricType());
    expect(types.filter(t => t === 'boolean')).toHaveLength(1);
    expect(types.filter(t => t === 'number')).toHaveLength(11);
  });
});
