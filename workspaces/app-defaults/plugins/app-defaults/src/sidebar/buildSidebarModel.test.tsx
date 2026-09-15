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

import { buildSidebarModel, type SidebarModelEntry } from './buildSidebarModel';

const payloadOf = (entry: SidebarModelEntry) => {
  switch (entry.kind) {
    case 'item':
      return entry.item;
    case 'group':
      return entry.group;
    default:
      return entry.element;
  }
};
const idOf = (entry: SidebarModelEntry) => payloadOf(entry).id;

const navItem = (id: string, title: string, href: string) =>
  ({
    node: { spec: { id } },
    title,
    href,
    icon: <span>{title}</span>,
  } as unknown as NavContentNavItem);

describe('buildSidebarModel', () => {
  it('sorts top-level items by priority, higher first, then by title', () => {
    const entries = buildSidebarModel({
      items: [
        { id: 'c', title: 'Charlie', priority: 0 },
        { id: 'a', title: 'Alpha' },
        { id: 'z', title: 'Zulu', priority: 10 },
        { id: 'b', title: 'Bravo', priority: -5 },
      ],
      groups: [],
    });

    expect(entries.map(idOf)).toEqual(['z', 'a', 'c', 'b']);
  });

  it('nests items inside their group and sorts them by priority', () => {
    const entries = buildSidebarModel({
      items: [
        { id: 'i1', title: 'Users', group: 'admin', priority: 1 },
        { id: 'i2', title: 'Plugins', group: 'admin', priority: 5 },
        { id: 'i3', title: 'Home', priority: 100 },
      ],
      groups: [{ id: 'admin', title: 'Administration', priority: -1 }],
    });

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ kind: 'item', item: { id: 'i3' } });
    expect(entries[1]).toMatchObject({
      kind: 'group',
      group: { id: 'admin', priority: -1, submenu: 'inline' },
    });
    const group = entries[1].kind === 'group' ? entries[1].group : undefined;
    expect(group?.items.map(i => i.id)).toEqual(['i2', 'i1']);
  });

  it('keeps an explicit flyout submenu style', () => {
    const entries = buildSidebarModel({
      items: [],
      groups: [{ id: 'g', title: 'Group', to: '/g', submenu: 'flyout' }],
    });

    expect(entries[0]).toMatchObject({
      kind: 'group',
      group: { id: 'g', submenu: 'flyout' },
    });
  });

  it('orders groups among top-level items by priority', () => {
    const entries = buildSidebarModel({
      items: [
        { id: 'top', title: 'Top', priority: 10 },
        { id: 'bottom', title: 'Bottom', priority: -10 },
      ],
      groups: [{ id: 'g', title: 'Middle', priority: 0 }],
    });

    expect(entries.map(e => e.kind)).toEqual(['item', 'group', 'item']);
  });

  it('keeps items with an unknown group at the top level', () => {
    const entries = buildSidebarModel({
      items: [{ id: 'orphan', title: 'Orphan', group: 'missing' }],
      groups: [],
    });

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
    const entries = buildSidebarModel({
      items: [{ id: 'chat', title: 'Chat', priority: 10 }],
      groups: [],
      navItems: [navItem('page:catalog', 'Catalog', '/catalog')],
    });

    expect(entries.map(payloadOf)).toEqual([
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
    const entries = buildSidebarModel({
      items: [
        { id: 'my-catalog', title: 'Software', to: '/catalog', group: 'g' },
      ],
      groups: [{ id: 'g', title: 'Group' }],
      navItems: [
        navItem('page:catalog', 'Catalog', '/catalog'),
        navItem('page:docs', 'Docs', '/docs'),
      ],
    });

    expect(entries.map(idOf)).toEqual(['page:docs', 'g']);
  });

  it('places custom elements at the top level ordered by priority', () => {
    const Search = () => null;
    const Notifications = () => null;
    const entries = buildSidebarModel({
      items: [{ id: 'home', title: 'Home', priority: 0 }],
      groups: [{ id: 'g', title: 'Group', priority: -100 }],
      elements: [
        {
          id: 'sidebar-element:notifications',
          component: Notifications,
          priority: -50,
        },
        { id: 'sidebar-element:search', component: Search, priority: 100 },
      ],
    });

    expect(entries).toEqual([
      {
        kind: 'element',
        element: {
          id: 'sidebar-element:search',
          component: Search,
          to: undefined,
          priority: 100,
        },
      },
      expect.objectContaining({ kind: 'item' }),
      {
        kind: 'element',
        element: {
          id: 'sidebar-element:notifications',
          component: Notifications,
          to: undefined,
          priority: -50,
        },
      },
      expect.objectContaining({ kind: 'group' }),
    ]);
  });

  it('hides items and auto-discovered pages that share an element path', () => {
    const Search = () => null;
    const entries = buildSidebarModel({
      items: [
        { id: 'plain-search', title: 'Search', to: '/search' },
        { id: 'grouped-search', title: 'Search', to: '/search', group: 'g' },
        { id: 'other', title: 'Other', to: '/other' },
      ],
      groups: [{ id: 'g', title: 'Group', to: '/g' }],
      elements: [
        { id: 'search-modal', component: Search, to: '/search', priority: 10 },
      ],
      navItems: [
        navItem('page:search', 'Search', '/search'),
        navItem('page:docs', 'Docs', '/docs'),
      ],
    });

    expect(entries.map(idOf)).toEqual([
      'search-modal',
      'page:docs',
      'g',
      'other',
    ]);
    const group = entries.find(e => e.kind === 'group');
    expect(group?.kind === 'group' ? group.group.items : undefined).toEqual([]);
  });

  it('breaks priority ties between elements by id', () => {
    const C = () => null;
    const entries = buildSidebarModel({
      items: [],
      groups: [],
      elements: [
        { id: 'b', component: C },
        { id: 'a', component: C },
      ],
    });

    expect(
      entries.map(e => (e.kind === 'element' ? e.element.id : '')),
    ).toEqual(['a', 'b']);
  });

  it('drops auto-discovered nav items that a group already links to', () => {
    const entries = buildSidebarModel({
      items: [],
      groups: [{ id: 'settings', title: 'Settings', to: '/settings' }],
      navItems: [
        navItem('page:user-settings', 'Settings', '/settings'),
        navItem('page:docs', 'Docs', '/docs'),
      ],
    });

    expect(entries.map(idOf)).toEqual(['page:docs', 'settings']);
  });

  it('returns an empty list when nothing is contributed', () => {
    expect(buildSidebarModel({ items: [], groups: [] })).toEqual([]);
  });
});
