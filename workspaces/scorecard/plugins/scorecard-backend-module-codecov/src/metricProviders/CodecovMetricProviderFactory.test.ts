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

  it('creates 7 metric providers', () => {
    const providers = CodecovMetricProviderFactory.fromConfig(config, logger);
    expect(providers).toHaveLength(7);
  });

  it('creates providers with correct IDs', () => {
    const providers = CodecovMetricProviderFactory.fromConfig(config, logger);
    const ids = providers.map(p => p.getProviderId());
    expect(ids).toEqual([
      'codecov.coverage',
      'codecov.coverage_trend',
      'codecov.tracked_files',
      'codecov.tracked_lines',
      'codecov.covered_lines',
      'codecov.partial_lines',
      'codecov.missed_lines',
    ]);
  });

  it('all providers have codecov datasource ID', () => {
    const providers = CodecovMetricProviderFactory.fromConfig(config, logger);
    for (const provider of providers) {
      expect(provider.getProviderDatasourceId()).toBe('codecov');
    }
  });

  it('all providers have number metric type', () => {
    const providers = CodecovMetricProviderFactory.fromConfig(config, logger);
    for (const provider of providers) {
      expect(provider.getMetricType()).toBe('number');
    }
  });
});
