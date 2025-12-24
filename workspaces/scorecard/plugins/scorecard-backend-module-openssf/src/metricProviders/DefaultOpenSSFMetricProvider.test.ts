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

import {
  createDefaultOpenSSFMetricProviders,
  DefaultOpenSSFMetricProvider,
} from './DefaultOpenSSFMetricProvider';
import { OPENSSF_METRICS, OPENSSF_THRESHOLDS } from './OpenSSFConfig';

describe('DefaultOpenSSFMetricProviderTests', () => {
  it('should create a default OpenSSF metric provider', () => {
    const provider = new DefaultOpenSSFMetricProvider(
      OPENSSF_METRICS[0],
      OPENSSF_THRESHOLDS,
    );
    expect(provider.getMetricDisplayTitle()).toBe(
      OPENSSF_METRICS[0].displayTitle,
    );
    expect(provider.getMetricDescription()).toBe(
      OPENSSF_METRICS[0].description,
    );
    expect(provider.getMetricThresholds()).toBe(OPENSSF_THRESHOLDS);
  });

  it('should create a default OpenSSF metric provider with custom thresholds', () => {
    const provider = new DefaultOpenSSFMetricProvider(
      OPENSSF_METRICS[0],
      OPENSSF_THRESHOLDS,
    );
    expect(provider).toBeDefined();
  });

  it('should create all default OpenSSF metric providers', () => {
    const providers = createDefaultOpenSSFMetricProviders(OPENSSF_THRESHOLDS);
    expect(providers.length).toBe(OPENSSF_METRICS.length);
    for (const provider of providers) {
      expect(provider).toBeInstanceOf(DefaultOpenSSFMetricProvider);
      expect(provider.getMetricThresholds()).toBe(OPENSSF_THRESHOLDS);
    }
  });
});
