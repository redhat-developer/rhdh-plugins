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
  validateMetricId,
  validateProviderId,
} from './validateMetricProviderIds';

describe('validateMetricProviderIds', () => {
  describe('validateProviderId', () => {
    it('allows provider ID with datasource prefix', () => {
      expect(() =>
        validateProviderId('github.openPRs', 'github'),
      ).not.toThrow();
      expect(() =>
        validateProviderId('filecheck.fileExistence', 'filecheck'),
      ).not.toThrow();
    });

    it.each([
      ['equal to datasource', 'filecheck', 'filecheck'],
      ['wrong datasource prefix', 'other.openPRs', 'github'],
      ['missing dot separator', 'githubopenPrs', 'github'],
      ['empty ID', '', 'github'],
      ['empty provider name', 'github.', 'github'],
      ['too many segments', 'github.foo.bar', 'github'],
    ] as const)('rejects %s (%s)', (_desc, providerId, datasourceId) => {
      expect(() => validateProviderId(providerId, datasourceId)).toThrow(
        /Invalid provider ID/,
      );
    });
  });

  describe('validateMetricId', () => {
    it('allows metric ID with datasource prefix', () => {
      expect(() => validateMetricId('github.openPRs', 'github')).not.toThrow();
      expect(() =>
        validateMetricId('filecheck.readme', 'filecheck'),
      ).not.toThrow();
    });

    it.each([
      ['equal to datasource', 'filecheck', 'filecheck'],
      ['wrong datasource prefix', 'other.metric', 'github'],
      ['empty metric name', 'github.', 'github'],
      ['empty ID', '', 'github'],
      ['too many segments', 'github.openPRs.other', 'github'],
    ] as const)('rejects %s (%s)', (_desc, metricId, datasourceId) => {
      expect(() => validateMetricId(metricId, datasourceId)).toThrow(
        /Invalid metric ID/,
      );
    });
  });
});
