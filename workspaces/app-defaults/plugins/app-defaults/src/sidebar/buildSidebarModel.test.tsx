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

import type { NavContentNavItem } from '@backstage/plugin-app-react';

import { buildSidebarModel } from './buildSidebarModel';

const navItem = (id: string, title: string, href: string) =>
  ({
    node: { spec: { id } },
    title,
    href,
    icon: <span>{title}</span>,
  } as unknown as NavContentNavItem);

describe('buildSidebarModel', () => {
  it('sorts top-level items by priority, higher first, then by title', () => {
    const entries = buildSidebarModel(
      [
        { id: 'c', title: 'Charlie', priority: 0 },
        { id: 'a', title: 'Alpha' },
        { id: 'z', title: 'Zulu', priority: 10 },
        { id: 'b', title: 'Bravo', priority: -5 },
      ],
      [],
    );

    expect(
      entries.map(e => (e.kind === 'item' ? e.item.id : e.group.id)),
    ).toEqual(['z', 'a', 'c', 'b']);
  });

  it('nests items inside their group and sorts them by priority', () => {
    const entries = buildSidebarModel(
      [
        { id: 'i1', title: 'Users', group: 'admin', priority: 1 },
        { id: 'i2', title: 'Plugins', group: 'admin', priority: 5 },
        { id: 'i3', title: 'Home', priority: 100 },
      ],
      [{ id: 'admin', title: 'Administration', priority: -1 }],
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ kind: 'item', item: { id: 'i3' } });
    expect(entries[1]).toMatchObject({
      kind: 'group',
      group: { id: 'admin', priority: -1 },
    });
    const group = entries[1].kind === 'group' ? entries[1].group : undefined;
    expect(group?.items.map(i => i.id)).toEqual(['i2', 'i1']);
  });

  it('orders groups among top-level items by priority', () => {
    const entries = buildSidebarModel(
      [
        { id: 'top', title: 'Top', priority: 10 },
        { id: 'bottom', title: 'Bottom', priority: -10 },
      ],
      [{ id: 'g', title: 'Middle', priority: 0 }],
    );

    expect(entries.map(e => e.kind)).toEqual(['item', 'group', 'item']);
  });

  it('keeps items with an unknown group at the top level', () => {
    const entries = buildSidebarModel(
      [{ id: 'orphan', title: 'Orphan', group: 'missing' }],
      [],
    );

    expect(entries).toEqual([
      {
        kind: 'item',
        item: {
          id: 'orphan',
          title: 'Orphan',
          icon: undefined,
          to: undefined,
          onClick: undefined,
          priority: 0,
        },
      },
    ]);
  });

  it('merges auto-discovered nav items at the default priority', () => {
    const entries = buildSidebarModel(
      [{ id: 'chat', title: 'Chat', priority: 10 }],
      [],
      [navItem('page:catalog', 'Catalog', '/catalog')],
    );

    expect(entries.map(e => (e.kind === 'item' ? e.item : e.group))).toEqual([
      expect.objectContaining({ id: 'chat' }),
      expect.objectContaining({
        id: 'page:catalog',
        title: 'Catalog',
        to: '/catalog',
        priority: 0,
      }),
    ]);
  });

  it('drops auto-discovered nav items that a contributed item already links to', () => {
    const entries = buildSidebarModel(
      [{ id: 'my-catalog', title: 'Software', to: '/catalog', group: 'g' }],
      [{ id: 'g', title: 'Group' }],
      [
        navItem('page:catalog', 'Catalog', '/catalog'),
        navItem('page:docs', 'Docs', '/docs'),
      ],
    );

    const ids = entries.map(e => (e.kind === 'item' ? e.item.id : e.group.id));
    expect(ids).toEqual(['page:docs', 'g']);
  });

  it('returns an empty list when nothing is contributed', () => {
    expect(buildSidebarModel([], [])).toEqual([]);
  });
});
