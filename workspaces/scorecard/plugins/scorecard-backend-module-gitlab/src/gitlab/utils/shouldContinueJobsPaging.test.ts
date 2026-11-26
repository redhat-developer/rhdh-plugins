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

import type { GitlabJobItem } from '../types';
import { shouldContinueJobsPaging } from './shouldContinueJobsPaging';

describe('shouldContinueJobsPaging', () => {
  const since = new Date('2024-01-10T00:00:00Z');

  function job(
    overrides: Partial<GitlabJobItem> & Pick<GitlabJobItem, 'created_at'>,
  ): GitlabJobItem {
    return overrides;
  }

  it('should continue when the page is empty', () => {
    expect(shouldContinueJobsPaging([], since)).toBe(true);
  });

  it('should continue when the oldest job was created at or after since', () => {
    expect(
      shouldContinueJobsPaging(
        [
          job({ created_at: '2024-01-12T00:00:00Z' }),
          job({ created_at: '2024-01-10T00:00:00Z' }),
        ],
        since,
      ),
    ).toBe(true);
  });

  it('should stop when the oldest job is before since and no activity is in the window', () => {
    expect(
      shouldContinueJobsPaging(
        [
          job({
            created_at: '2024-01-09T12:00:00Z',
            started_at: '2024-01-09T12:01:00Z',
            finished_at: '2024-01-09T12:02:00Z',
          }),
          job({
            created_at: '2024-01-08T00:00:00Z',
            started_at: null,
            finished_at: null,
          }),
        ],
        since,
      ),
    ).toBe(false);
  });

  it('should continue when the oldest job is before since but started_at is in the window', () => {
    expect(
      shouldContinueJobsPaging(
        [
          job({
            created_at: '2024-01-08T00:00:00Z',
            started_at: '2024-01-10T01:00:00Z',
            finished_at: null,
          }),
        ],
        since,
      ),
    ).toBe(true);
  });

  it('should continue when the oldest job is before since but finished_at is in the window', () => {
    expect(
      shouldContinueJobsPaging(
        [
          job({
            created_at: '2024-01-08T00:00:00Z',
            started_at: '2024-01-09T00:00:00Z',
            finished_at: '2024-01-10T02:00:00Z',
          }),
        ],
        since,
      ),
    ).toBe(true);
  });

  it('should continue when an earlier page item has in-window activity even if the oldest does not', () => {
    expect(
      shouldContinueJobsPaging(
        [
          job({
            created_at: '2024-01-09T12:00:00Z',
            started_at: '2024-01-10T03:00:00Z',
            finished_at: null,
          }),
          job({
            created_at: '2024-01-08T00:00:00Z',
            started_at: '2024-01-08T01:00:00Z',
            finished_at: '2024-01-08T02:00:00Z',
          }),
        ],
        since,
      ),
    ).toBe(true);
  });
});
