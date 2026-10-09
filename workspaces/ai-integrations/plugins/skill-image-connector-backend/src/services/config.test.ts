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
import { readSkillImageOptions } from './config';

describe('readSkillImageOptions', () => {
  it('preserves defaults when configuration is absent', () => {
    expect(readSkillImageOptions(new ConfigReader({}))).toEqual({
      fetchTimeoutMs: 30000,
      maxBlobSizeBytes: 5242880,
      maxAggregateContentSizeBytes: 52428800,
      maxDiscoveryResponseSizeBytes: 5242880,
      maxImages: 25,
      maxRetries: 2,
      retryBaseDelayMs: 2000,
    });
  });
  it('resolves overrides independently and preserves zero retries', () => {
    const overrides = {
      fetchTimeoutMs: 60000,
      maxBlobSizeBytes: 100,
      maxAggregateContentSizeBytes: 500,
      maxDiscoveryResponseSizeBytes: 200,
      maxImages: 100,
      maxRetries: 0,
      retryBaseDelayMs: 10,
    };
    expect(
      readSkillImageOptions(
        new ConfigReader({ skillImageConnector: overrides }),
      ),
    ).toEqual(overrides);
    const defaults = readSkillImageOptions(
      new ConfigReader({ skillImageConnector: {} }),
    );
    expect(defaults.fetchTimeoutMs).toBe(30000);
    expect(defaults.maxRetries).toBe(2);
  });
  it('accepts numeric environment substitutions and Backstage null-as-unset', () => {
    const options = readSkillImageOptions(
      new ConfigReader({
        skillImageConnector: {
          fetchTimeoutMs: '60000',
          maxBlobSizeBytes: null,
        },
      }),
    );
    expect(options.fetchTimeoutMs).toBe(60000);
    expect(options.maxBlobSizeBytes).toBe(5242880);
  });
  it.each([
    ['fetchTimeoutMs', 0],
    ['fetchTimeoutMs', 2147483648],
    ['retryBaseDelayMs', 2147483648],
    ['retryBaseDelayMs', 0],
    ['maxBlobSizeBytes', -1],
    ['maxBlobSizeBytes', 1.5],
    ['maxAggregateContentSizeBytes', 0],
    ['maxDiscoveryResponseSizeBytes', 0],
    ['maxImages', 0],
    ['maxImages', -1],
    ['maxImages', 1.5],
    ['maxImages', Number.MAX_SAFE_INTEGER + 1],
    ['maxRetries', -1],
    ['maxRetries', 1.5],
    ['maxRetries', Number.MAX_SAFE_INTEGER + 1],
    ['fetchTimeoutMs', 'not-a-number'],
  ])('rejects invalid %s = %p instead of falling back', (key, value) => {
    expect(() =>
      readSkillImageOptions(
        new ConfigReader({ skillImageConnector: { [key]: value } }),
      ),
    ).toThrow(key);
  });
});
