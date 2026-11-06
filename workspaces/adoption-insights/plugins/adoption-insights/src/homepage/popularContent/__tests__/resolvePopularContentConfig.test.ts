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
  resolvePopularContentConfig,
  shouldFetchAdoptionInsights,
} from '../resolvePopularContentConfig';

describe('resolvePopularContentConfig', () => {
  it('defaults to auto mode and display count 3', () => {
    expect(resolvePopularContentConfig({})).toEqual({
      mode: 'auto',
      displayCount: 3,
      title: undefined,
      items: undefined,
    });
  });

  it('accepts valid modes and displayCount', () => {
    expect(
      resolvePopularContentConfig({
        mode: 'hybrid',
        displayCount: 5,
        title: ' Featured ',
        items: [{ id: 'catalog', title: 'Catalog', href: '/catalog' }],
      }),
    ).toEqual({
      mode: 'hybrid',
      displayCount: 5,
      title: 'Featured',
      items: [{ id: 'catalog', title: 'Catalog', href: '/catalog' }],
    });
  });

  it('falls back safely for invalid values', () => {
    expect(
      resolvePopularContentConfig({
        mode: 'nope',
        displayCount: -1,
        items: [{ title: 'missing-id' }, null, { id: 'ok' }],
      }),
    ).toEqual({
      mode: 'auto',
      displayCount: 3,
      title: undefined,
      items: [{ id: 'ok' }],
    });
  });

  it('uses defaults.title when title is omitted', () => {
    expect(
      resolvePopularContentConfig({}, { title: 'Top Plugins' }).title,
    ).toBe('Top Plugins');
  });
});

describe('shouldFetchAdoptionInsights', () => {
  it('skips fetch only for curated mode', () => {
    expect(shouldFetchAdoptionInsights('auto')).toBe(true);
    expect(shouldFetchAdoptionInsights('hybrid')).toBe(true);
    expect(shouldFetchAdoptionInsights('curated')).toBe(false);
  });
});
