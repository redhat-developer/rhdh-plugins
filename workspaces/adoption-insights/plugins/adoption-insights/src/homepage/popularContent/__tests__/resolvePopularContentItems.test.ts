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

import { resolvePopularContentItems } from '../resolvePopularContentItems';
import { PopularContentItem } from '../types';

const ranked: PopularContentItem[] = [
  { id: 'catalog', title: 'catalog', href: '/catalog' },
  { id: 'scaffolder', title: 'scaffolder', href: '/create' },
  { id: 'techdocs', title: 'techdocs', href: '/docs' },
  { id: 'search', title: 'search', href: '/search' },
];

describe('resolvePopularContentItems', () => {
  it('auto mode returns the first displayCount ranked items', () => {
    expect(
      resolvePopularContentItems({
        config: { mode: 'auto', displayCount: 2 },
        ranked,
      }),
    ).toEqual(ranked.slice(0, 2));
  });

  it('curated mode ignores ranked data and uses config items', () => {
    expect(
      resolvePopularContentItems({
        config: {
          mode: 'curated',
          displayCount: 3,
          items: [
            { id: 'ansible', title: 'Ansible', href: '/ansible' },
            { id: 'catalog' },
          ],
        },
        ranked,
      }),
    ).toEqual([
      { id: 'ansible', title: 'Ansible', href: '/ansible' },
      { id: 'catalog', title: 'catalog' },
    ]);
  });

  it('hybrid mode pins first then fills from ranked', () => {
    expect(
      resolvePopularContentItems({
        config: {
          mode: 'hybrid',
          displayCount: 3,
          items: [
            {
              id: 'techdocs',
              title: 'Docs (pinned)',
              href: '/custom-docs',
            },
          ],
        },
        ranked,
      }),
    ).toEqual([
      {
        id: 'techdocs',
        title: 'Docs (pinned)',
        href: '/custom-docs',
      },
      { id: 'catalog', title: 'catalog', href: '/catalog' },
      { id: 'scaffolder', title: 'scaffolder', href: '/create' },
    ]);
  });
});
