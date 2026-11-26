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

import { pr } from '../../__fixtures__';
import { validatePullRequests } from './validatePullRequests';

describe('validatePullRequests', () => {
  it('accepts pull requests matching schema', () => {
    const pullRequest = pr({ updatedAt: '2026-01-01T00:00:00.500Z' });

    expect(validatePullRequests([pullRequest])).toEqual({
      valid: [pullRequest],
      invalidCount: 0,
    });
  });

  it.each([
    ['a timestamp with an offset', { updatedAt: '2026-01-02T00:00:00+02:00' }],
    ['an unknown badge', { badge: 'unknown' }],
    [
      'an id inconsistent with host, repo and number',
      { id: 'github.com/other/repo#1' },
    ],
    ['a missing author', { author: undefined }],
  ])('drops %s', (_name, overrides: Record<string, unknown>) => {
    const pullRequest = pr({ updatedAt: '2026-01-01T00:00:00Z' });

    const { valid, invalidCount } = validatePullRequests([
      { ...pullRequest, ...overrides },
    ]);

    expect(valid).toEqual([]);
    expect(invalidCount).toBe(1);
  });

  it('drops a non-object item', () => {
    const { valid, invalidCount } = validatePullRequests([
      'github.com/acme/repo#1',
    ]);

    expect(valid).toEqual([]);
    expect(invalidCount).toBe(1);
  });

  it('keeps valid items alongside dropped ones', () => {
    const good = pr({ number: 1 });
    const bad = pr({ number: 2, updatedAt: 'yesterday' });

    const { valid, invalidCount } = validatePullRequests([good, bad]);

    expect(valid).toEqual([good]);
    expect(invalidCount).toBe(1);
  });

  it('counts multiple invalid pull requests', () => {
    const { invalidCount } = validatePullRequests([
      { ...pr({ number: 1 }), badge: 'invalid' },
      {
        ...pr({ number: 2, updatedAt: 'bad' }),
        badge: '',
      },
    ]);

    expect(invalidCount).toBe(2);
  });
});
