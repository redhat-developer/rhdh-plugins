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
  createDependabotMetricProvider,
  createDependabotMetricProviders,
} from './DependabotMetricProviderFactory';
import { mockServices } from '@backstage/backend-test-utils';

const mockConfig = new ConfigReader({
  integrations: { github: [{ host: 'github.com', token: 'test-token' }] },
});
const mockLogger = mockServices.logger.mock();

describe('createDependabotMetricProvider', () => {
  it('returns a provider for the given severity', () => {
    const provider = createDependabotMetricProvider(
      mockConfig,
      mockLogger,
      'high',
    );
    expect(provider.getProviderId()).toBe('dependabot.alerts_high');
    expect(provider.getProviderDatasourceId()).toBe('dependabot');
    expect(provider.getMetricType()).toBe('number');
  });

  it('accepts optional thresholds', () => {
    const thresholds = { rules: [{ key: 'ok', expression: '<1' }] };
    const provider = createDependabotMetricProvider(
      mockConfig,
      mockLogger,
      'critical',
      thresholds,
    );
    expect(provider.getMetricThresholds()).toEqual(thresholds);
  });
});

describe('createDependabotMetricProviders', () => {
  it('returns four providers for critical, high, medium, low', () => {
    const providers = createDependabotMetricProviders(mockConfig, mockLogger);
    expect(providers).toHaveLength(4);
    expect(providers.map(p => p.getProviderId())).toEqual([
      'dependabot.alerts_critical',
      'dependabot.alerts_high',
      'dependabot.alerts_medium',
      'dependabot.alerts_low',
    ]);
  });

  it('passes optional thresholds to all providers', () => {
    const thresholds = { rules: [{ key: 'custom', expression: '>0' }] };
    const providers = createDependabotMetricProviders(
      mockConfig,
      mockLogger,
      thresholds,
    );
    providers.forEach(p => {
      expect(p.getMetricThresholds()).toEqual(thresholds);
    });
  });
});
