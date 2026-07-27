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
import { mockServices } from '@backstage/backend-test-utils';
import { CodecovMetricProviderFactory } from './CodecovMetricProviderFactory';

describe('CodecovMetricProviderFactory', () => {
  const config = new ConfigReader({});
  const logger = mockServices.logger.mock();

  it('creates 1 metric provider', () => {
    const providers = CodecovMetricProviderFactory.fromConfig(config, logger);
    expect(providers).toHaveLength(1);
  });

  it('creates provider with codecov as provider ID', () => {
    const providers = CodecovMetricProviderFactory.fromConfig(config, logger);
    expect(providers[0].getProviderId()).toBe('codecov');
  });

  it('provider has codecov datasource ID', () => {
    const providers = CodecovMetricProviderFactory.fromConfig(config, logger);
    expect(providers[0].getProviderDatasourceId()).toBe('codecov');
  });

  it('provider returns all 7 metrics from getMetrics()', () => {
    const providers = CodecovMetricProviderFactory.fromConfig(config, logger);
    const metrics = providers[0].getMetrics();
    expect(metrics).toHaveLength(7);
    for (const metric of metrics) {
      expect(metric.type).toBe('number');
      expect(metric.thresholds).toBeDefined();
    }
  });

  it('provider returns metrics with correct IDs', () => {
    const providers = CodecovMetricProviderFactory.fromConfig(config, logger);
    const metrics = providers[0].getMetrics();
    const ids = metrics.map(m => m.id);
    expect(ids).toEqual([
      'codecov.coverage',
      'codecov.coverageTrend',
      'codecov.trackedFiles',
      'codecov.trackedLines',
      'codecov.coveredLines',
      'codecov.partialLines',
      'codecov.missedLines',
    ]);
  });
});
