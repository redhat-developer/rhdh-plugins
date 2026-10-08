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

import { buildPaginationQuery } from './buildPaginationQuery';

describe('buildPaginationQuery', () => {
  it('returns empty string when no params are provided', () => {
    expect(buildPaginationQuery({})).toBe('');
  });

  it('returns only max_page_size when only size is provided', () => {
    expect(buildPaginationQuery({ max_page_size: 10 })).toBe(
      '?max_page_size=10',
    );
  });

  it('returns only page_token when only token is provided', () => {
    expect(buildPaginationQuery({ page_token: 'tok-abc' })).toBe(
      '?page_token=tok-abc',
    );
  });

  it('returns both params when both are provided', () => {
    const result = buildPaginationQuery({
      max_page_size: 25,
      page_token: 'tok-xyz',
    });
    expect(result).toContain('max_page_size=25');
    expect(result).toContain('page_token=tok-xyz');
    expect(result).toMatch(/^\?/);
  });

  it('omits page_token when it is an empty string', () => {
    expect(buildPaginationQuery({ page_token: '' })).toBe('');
  });

  it('omits max_page_size when it is undefined', () => {
    expect(
      buildPaginationQuery({ max_page_size: undefined, page_token: 'tok' }),
    ).toBe('?page_token=tok');
  });
});
