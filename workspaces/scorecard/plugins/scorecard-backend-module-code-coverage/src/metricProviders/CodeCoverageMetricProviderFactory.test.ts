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
import { CODE_COVERAGE_THRESHOLDS } from './CodeCoverageConfig';

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
    const metrics = provider.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].type).toBe('number');
    expect(metrics[0].thresholds).toBe(
      CODE_COVERAGE_THRESHOLDS.line_percentage,
    );
  });

  it('returns a provider for branch_percentage', () => {
    const provider = createCodeCoverageMetricProvider(
      mockDiscovery,
      mockLogger,
      'branch_percentage',
    );
    expect(provider.getProviderId()).toBe('code-coverage.branch_percentage');
    const metrics = provider.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].type).toBe('number');
    expect(metrics[0].thresholds).toBe(
      CODE_COVERAGE_THRESHOLDS.branch_percentage,
    );
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
    const allNumber = providers.every(p => {
      const metrics = p.getMetrics();
      return metrics.length === 1 && metrics[0].type === 'number';
    });
    expect(allNumber).toBe(true);
  });
});
