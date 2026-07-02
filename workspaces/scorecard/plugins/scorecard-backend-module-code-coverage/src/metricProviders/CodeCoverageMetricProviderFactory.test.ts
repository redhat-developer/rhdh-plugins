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

import { mockServices } from '@backstage/backend-test-utils';
import {
  createCodeCoverageMetricProvider,
  createCodeCoverageMetricProviders,
} from './CodeCoverageMetricProviderFactory';

jest.mock('../clients/CodeCoverageClient');

const mockDiscovery = mockServices.discovery.mock();
const mockLogger = mockServices.logger.mock();

describe('createCodeCoverageMetricProvider', () => {
  it('returns a provider for line_percentage', () => {
    const provider = createCodeCoverageMetricProvider(
      mockDiscovery,
      mockLogger,
      'line_percentage',
    );
    expect(provider.getProviderId()).toBe('code-coverage.line_percentage');
    expect(provider.getProviderDatasourceId()).toBe('code-coverage');
    expect(provider.getMetricType()).toBe('number');
  });

  it('returns a provider for branch_percentage', () => {
    const provider = createCodeCoverageMetricProvider(
      mockDiscovery,
      mockLogger,
      'branch_percentage',
    );
    expect(provider.getProviderId()).toBe('code-coverage.branch_percentage');
    expect(provider.getMetricType()).toBe('number');
  });
});

describe('createCodeCoverageMetricProviders', () => {
  it('returns eight providers with correct IDs', () => {
    const providers = createCodeCoverageMetricProviders(
      mockDiscovery,
      mockLogger,
    );
    expect(providers).toHaveLength(8);
    expect(providers.map(p => p.getProviderId())).toEqual([
      'code-coverage.line_percentage',
      'code-coverage.line_available',
      'code-coverage.line_covered',
      'code-coverage.line_missed',
      'code-coverage.branch_percentage',
      'code-coverage.branch_available',
      'code-coverage.branch_covered',
      'code-coverage.branch_missed',
    ]);
  });

  it('returns all number-type providers', () => {
    const providers = createCodeCoverageMetricProviders(
      mockDiscovery,
      mockLogger,
    );
    const types = providers.map(p => p.getMetricType());
    expect(types.every(t => t === 'number')).toBe(true);
  });
});
