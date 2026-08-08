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
import { CODE_COVERAGE_THRESHOLDS } from './CodeCoverageMetricProvider';
import { CodeCoverageClient } from '../clients/CodeCoverageClient';

jest.mock('../clients/CodeCoverageClient');

const mockAuth = mockServices.auth.mock();
const mockDiscovery = mockServices.discovery.mock();
const mockLogger = mockServices.logger.mock();

describe('createCodeCoverageMetricProvider', () => {
  it('returns a provider for linePercentage', () => {
    const client = new CodeCoverageClient(mockAuth, mockDiscovery, mockLogger);
    const provider = createCodeCoverageMetricProvider(client, 'linePercentage');
    expect(provider.getProviderId()).toBe('codeCoverage.linePercentage');
    expect(provider.getProviderDatasourceId()).toBe('codeCoverage');
    const metrics = provider.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].type).toBe('number');
    expect(metrics[0].thresholds).toBe(CODE_COVERAGE_THRESHOLDS.linePercentage);
  });

  it('returns a provider for branchPercentage', () => {
    const client = new CodeCoverageClient(mockAuth, mockDiscovery, mockLogger);
    const provider = createCodeCoverageMetricProvider(
      client,
      'branchPercentage',
    );
    expect(provider.getProviderId()).toBe('codeCoverage.branchPercentage');
    const metrics = provider.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].type).toBe('number');
    expect(metrics[0].thresholds).toBe(
      CODE_COVERAGE_THRESHOLDS.branchPercentage,
    );
  });
});

describe('createCodeCoverageMetricProviders', () => {
  it('returns eight providers with correct IDs', () => {
    const providers = createCodeCoverageMetricProviders(
      mockAuth,
      mockDiscovery,
      mockLogger,
    );
    expect(providers).toHaveLength(8);
    expect(providers.map(p => p.getProviderId())).toEqual([
      'codeCoverage.linePercentage',
      'codeCoverage.lineAvailable',
      'codeCoverage.lineCovered',
      'codeCoverage.lineMissed',
      'codeCoverage.branchPercentage',
      'codeCoverage.branchAvailable',
      'codeCoverage.branchCovered',
      'codeCoverage.branchMissed',
    ]);
  });

  it('returns all number-type providers', () => {
    const providers = createCodeCoverageMetricProviders(
      mockAuth,
      mockDiscovery,
      mockLogger,
    );
    const allNumber = providers.every(p => {
      const metrics = p.getMetrics();
      return metrics.length === 1 && metrics[0].type === 'number';
    });
    expect(allNumber).toBe(true);
  });

  it('creates a single shared client for all providers', () => {
    const { CodeCoverageClient: MockedClient } = jest.requireMock(
      '../clients/CodeCoverageClient',
    );
    MockedClient.mockClear();

    createCodeCoverageMetricProviders(mockAuth, mockDiscovery, mockLogger);

    expect(MockedClient).toHaveBeenCalledTimes(1);
  });
});
