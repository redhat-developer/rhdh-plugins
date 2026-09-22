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

import { formatErrorDetail, stripTrailingSlashes } from './util';

describe('stripTrailingSlashes', () => {
  it('returns the value unchanged when there is no trailing slash', () => {
    expect(stripTrailingSlashes('https://registry.example.com')).toBe(
      'https://registry.example.com',
    );
  });

  it('strips one or more trailing slashes', () => {
    expect(stripTrailingSlashes('https://registry.example.com/')).toBe(
      'https://registry.example.com',
    );
    expect(stripTrailingSlashes('https://registry.example.com///')).toBe(
      'https://registry.example.com',
    );
  });

  it('returns an empty string when the value is only slashes', () => {
    expect(stripTrailingSlashes('///')).toBe('');
  });
});

describe('formatErrorDetail', () => {
  it('returns the Error message without the constructor name', () => {
    expect(formatErrorDetail(new TypeError('fetch failed'))).toBe(
      'fetch failed',
    );
  });

  it('prefers the deepest cause message for wrapped fetch failures', () => {
    const cause = new Error('connect ECONNREFUSED 127.0.0.1:8080');
    const err = new TypeError('fetch failed', { cause });
    expect(formatErrorDetail(err)).toBe('connect ECONNREFUSED 127.0.0.1:8080');
  });

  it('returns string values as-is', () => {
    expect(formatErrorDetail('boom')).toBe('boom');
  });
});
