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
  isDefaultSidebarPath,
  normalizeSidebarPath,
} from './defaultSidebarPaths';
import {
  classifySidebarEntries,
  isDefaultMenuEntry,
} from './classifySidebarEntries';
import type { SidebarModelEntry } from './buildSidebarModel';

describe('defaultSidebarPaths', () => {
  it('normalizes relative and trailing-slash paths', () => {
    expect(normalizeSidebarPath('catalog')).toBe('/catalog');
    expect(normalizeSidebarPath('/catalog/')).toBe('/catalog');
    expect(normalizeSidebarPath('/docs?x=1#y')).toBe('/docs');
    expect(normalizeSidebarPath('https://example.com/docs')).toBeUndefined();
  });

  it('recognizes the built-in default paths', () => {
    expect(isDefaultSidebarPath('/catalog')).toBe(true);
    expect(isDefaultSidebarPath('learning-paths')).toBe(true);
    expect(isDefaultSidebarPath('/tech-radar')).toBe(false);
  });
});

describe('classifySidebarEntries', () => {
  const item = (id: string, to: string, priority = 0): SidebarModelEntry => ({
    kind: 'item',
    item: { id, title: id, to, priority },
  });

  it('puts allowlisted paths in top and other priority-0 items in middle', () => {
    const classified = classifySidebarEntries([
      item('catalog', '/catalog'),
      item('radar', '/tech-radar'),
    ]);
    expect(
      classified.top.map(e => (e.kind === 'item' ? e.item.id : '')),
    ).toEqual(['catalog']);
    expect(
      classified.middle.map(e => (e.kind === 'item' ? e.item.id : '')),
    ).toEqual(['radar']);
  });

  it('keeps chrome above the scroll area and drops bottom section dividers', () => {
    const classified = classifySidebarEntries([
      {
        kind: 'element',
        element: {
          id: 'sidebar-element:app/logo',
          component: () => null,
          priority: 2000,
        },
      },
      {
        kind: 'element',
        element: {
          id: 'sidebar-spacer:app/logo',
          component: () => null,
          priority: 1500,
        },
      },
      {
        kind: 'element',
        element: {
          id: 'sidebar-element:app/search',
          component: () => null,
          priority: 1000,
        },
      },
      {
        kind: 'element',
        element: {
          id: 'sidebar-divider:app/search',
          component: () => null,
          priority: 900,
        },
      },
      {
        kind: 'element',
        element: {
          id: 'sidebar-divider:app/bottom',
          component: () => null,
          priority: -35,
        },
      },
      {
        kind: 'element',
        element: {
          id: 'sidebar-spacer:app/bottom',
          component: () => null,
          priority: -30,
        },
      },
      item('catalog', '/catalog'),
    ]);

    expect(
      classified.chrome.map(e => e.kind === 'element' && e.element.id),
    ).toEqual([
      'sidebar-element:app/logo',
      'sidebar-spacer:app/logo',
      'sidebar-element:app/search',
      'sidebar-divider:app/search',
    ]);
    expect(classified.spacers).toHaveLength(1);
    expect(classified.bottom).toHaveLength(0);
    expect(classified.top).toHaveLength(1);
  });

  it('places admin/settings groups and negative-priority items in bottom', () => {
    const classified = classifySidebarEntries([
      {
        kind: 'group',
        group: {
          id: 'admin',
          title: 'Administration',
          priority: -95,
          variant: 'inline',
          items: [{ id: 'rbac', title: 'RBAC', to: '/rbac', priority: 10 }],
        },
      },
      {
        kind: 'group',
        group: {
          id: 'settings',
          title: 'Settings',
          to: '/settings',
          priority: -100,
          variant: 'inline',
          items: [],
        },
      },
      item('help', '/help', -50),
    ]);

    expect(
      classified.bottom.map(e => {
        if (e.kind === 'group') return e.group.id;
        if (e.kind === 'item') return e.item.id;
        return '';
      }),
    ).toEqual(['admin', 'settings', 'help']);
  });

  it('treats groups of only default paths as top-section entries', () => {
    const entry: SidebarModelEntry = {
      kind: 'group',
      group: {
        id: 'documentation',
        title: 'Documentation',
        priority: -10,
        variant: 'inline',
        items: [
          { id: 'docs', title: 'Docs', to: '/docs', priority: 10 },
          { id: 'apis', title: 'APIs', to: '/api-docs', priority: 5 },
        ],
      },
    };
    expect(isDefaultMenuEntry(entry)).toBe(true);
    expect(classifySidebarEntries([entry]).top).toHaveLength(1);
    expect(classifySidebarEntries([entry]).bottom).toHaveLength(0);
  });
});
