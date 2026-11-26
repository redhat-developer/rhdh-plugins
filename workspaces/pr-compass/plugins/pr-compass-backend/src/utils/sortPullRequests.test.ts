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

import { PullRequestBadges } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import { pr } from '../../__fixtures__';
import { sortPullRequests } from './sortPullRequests';

describe('sortPullRequests', () => {
  it('orders by badge before recency', () => {
    const sorted = sortPullRequests([
      pr({
        id: 'c',
        badge: PullRequestBadges.MergeReady,
        updatedAt: '2026-01-03T00:00:00Z',
      }),
      pr({
        id: 'b',
        badge: PullRequestBadges.InProgress,
        updatedAt: '2026-01-02T00:00:00Z',
      }),
      pr({
        id: 'a',
        badge: PullRequestBadges.NeedsReview,
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    ]);

    expect(sorted.map(p => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('orders most recently updated first within a badge', () => {
    const sorted = sortPullRequests([
      pr({
        id: 'older',
        badge: PullRequestBadges.NeedsReview,
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      pr({
        id: 'newer',
        badge: PullRequestBadges.NeedsReview,
        updatedAt: '2026-02-01T00:00:00Z',
      }),
    ]);

    expect(sorted.map(p => p.id)).toEqual(['newer', 'older']);
  });

  it('orders timestamps by date', () => {
    const sorted = sortPullRequests([
      pr({ id: 'earlier', updatedAt: '2026-01-01T00:00:00Z' }),
      pr({ id: 'later', updatedAt: '2026-01-01T00:00:00.500Z' }),
    ]);

    expect(sorted.map(p => p.id)).toEqual(['later', 'earlier']);
  });

  it('is a total order, so paging cannot duplicate or skip rows', () => {
    const sameBadgeAndTime = [
      pr({
        id: 'z',
        badge: PullRequestBadges.InProgress,
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      pr({
        id: 'a',
        badge: PullRequestBadges.InProgress,
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      pr({
        id: 'm',
        badge: PullRequestBadges.InProgress,
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    ];

    const first = sortPullRequests(sameBadgeAndTime).map(p => p.id);
    const fromAnotherOrder = sortPullRequests(
      [...sameBadgeAndTime].reverse(),
    ).map(p => p.id);

    expect(first).toEqual(['a', 'm', 'z']);
    expect(fromAnotherOrder).toEqual(first);
  });

  it('does not mutate its input', () => {
    const input = [
      pr({
        id: 'b',
        badge: PullRequestBadges.MergeReady,
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      pr({
        id: 'a',
        badge: PullRequestBadges.NeedsReview,
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    ];

    const result = sortPullRequests(input);
    expect(result.map(p => p.id)).toEqual(['a', 'b']);
    expect(input.map(p => p.id)).toEqual(['b', 'a']);
  });
});
