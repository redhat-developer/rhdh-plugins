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

import { InputError } from '@backstage/errors';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';
import { validatePullRequestQuery } from './validatePullRequestQuery';

describe('validatePullRequestQuery', () => {
  it('defaults paging and leaves the badge unset', () => {
    expect(validatePullRequestQuery({})).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      filters: { badge: undefined },
    });
  });

  it('accepts a full query', () => {
    expect(
      validatePullRequestQuery({
        page: '3',
        pageSize: '10',
        badge: PullRequestBadges.MergeReady,
      }),
    ).toEqual({
      page: 3,
      pageSize: 10,
      filters: { badge: PullRequestBadges.MergeReady },
    });
  });

  describe('paging', () => {
    it.each([
      ['zero', '0'],
      ['negative', '-1'],
      ['fractional', '1.5'],
      ['non-numeric', 'abc'],
    ])('rejects a %s page, naming the parameter', (_name, page) => {
      expect(() => validatePullRequestQuery({ page })).toThrow(
        /Query parameter 'page':/,
      );
    });

    it('rejects a pageSize above the maximum', () => {
      expect(() =>
        validatePullRequestQuery({ pageSize: String(MAX_PAGE_SIZE + 1) }),
      ).toThrow(
        new RegExp(
          `Query parameter 'pageSize':.*less than or equal to ${MAX_PAGE_SIZE}`,
        ),
      );
    });

    it('accepts exactly the maximum', () => {
      expect(
        validatePullRequestQuery({ pageSize: String(MAX_PAGE_SIZE) }).pageSize,
      ).toBe(MAX_PAGE_SIZE);
    });
  });

  describe('badge', () => {
    it.each([
      PullRequestBadges.NeedsReview,
      PullRequestBadges.InProgress,
      PullRequestBadges.MergeReady,
    ])('accepts %s', badge => {
      expect(validatePullRequestQuery({ badge }).filters.badge).toBe(badge);
    });

    it('rejects an unknown badge, naming the valid ones', () => {
      expect(() => validatePullRequestQuery({ badge: 'nope' })).toThrow(
        /Query parameter 'badge':.*NeedsReview.*InProgress.*MergeReady/,
      );
    });

    it('rejects a blank badge rather than treating it as absent', () => {
      expect(() => validatePullRequestQuery({ badge: '' })).toThrow(InputError);
    });

    it('rejects a repeated parameter rather than picking one', () => {
      expect(() => validatePullRequestQuery({ badge: ['a', 'b'] })).toThrow(
        /Query parameter 'badge':/,
      );
    });
  });
});
