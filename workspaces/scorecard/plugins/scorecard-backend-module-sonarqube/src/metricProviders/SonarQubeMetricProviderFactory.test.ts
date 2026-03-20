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
import {
  createSonarQubeMetricProvider,
  createSonarQubeMetricProviders,
} from './SonarQubeMetricProviderFactory';

jest.mock('../clients/SonarQubeClient');

const mockConfig = new ConfigReader({});
const mockLogger = {
  child: jest.fn().mockReturnThis(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
} as any;

describe('createSonarQubeMetricProvider', () => {
  it('returns a boolean provider for quality_gate', () => {
    const provider = createSonarQubeMetricProvider(
      mockConfig,
      mockLogger,
      'quality_gate',
    );
    expect(provider.getProviderId()).toBe('sonarqube.quality_gate');
    expect(provider.getProviderDatasourceId()).toBe('sonarqube');
    expect(provider.getMetricType()).toBe('boolean');
  });

  it('returns a number provider for open_issues', () => {
    const provider = createSonarQubeMetricProvider(
      mockConfig,
      mockLogger,
      'open_issues',
    );
    expect(provider.getProviderId()).toBe('sonarqube.open_issues');
    expect(provider.getMetricType()).toBe('number');
  });

  it('returns a number provider for security_rating', () => {
    const provider = createSonarQubeMetricProvider(
      mockConfig,
      mockLogger,
      'security_rating',
    );
    expect(provider.getProviderId()).toBe('sonarqube.security_rating');
    expect(provider.getMetricType()).toBe('number');
  });

  it('returns a number provider for security_issues', () => {
    const provider = createSonarQubeMetricProvider(
      mockConfig,
      mockLogger,
      'security_issues',
    );
    expect(provider.getProviderId()).toBe('sonarqube.security_issues');
    expect(provider.getMetricType()).toBe('number');
  });
});

describe('createSonarQubeMetricProviders', () => {
  it('returns twelve providers with correct IDs', () => {
    const providers = createSonarQubeMetricProviders(mockConfig, mockLogger);
    expect(providers).toHaveLength(12);
    expect(providers.map(p => p.getProviderId())).toEqual([
      'sonarqube.quality_gate',
      'sonarqube.open_issues',
      'sonarqube.security_rating',
      'sonarqube.security_issues',
      'sonarqube.security_review_rating',
      'sonarqube.security_hotspots',
      'sonarqube.reliability_rating',
      'sonarqube.reliability_issues',
      'sonarqube.maintainability_rating',
      'sonarqube.maintainability_issues',
      'sonarqube.code_coverage',
      'sonarqube.code_duplications',
    ]);
  });

  it('returns 1 boolean and 11 number providers', () => {
    const providers = createSonarQubeMetricProviders(mockConfig, mockLogger);
    const types = providers.map(p => p.getMetricType());
    expect(types.filter(t => t === 'boolean')).toHaveLength(1);
    expect(types.filter(t => t === 'number')).toHaveLength(11);
  });
});
