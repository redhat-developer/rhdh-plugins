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

import { mockServices } from '@backstage/backend-test-utils';
import {
  collectReferencedPermissions,
  loadCustomizable,
  loadDefaultCards,
} from './loadDefaultCards';
import { CardNode } from './types';

describe('loadDefaultCards', () => {
  it('returns an empty array when homepage.defaultCards is absent', () => {
    const config = mockServices.rootConfig({ data: {} });
    expect(loadDefaultCards(config)).toEqual([]);
  });

  it('parses a valid tree', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultCards: [
            { id: 'onboarding' },
            {
              label: 'Admin tools',
              visibility: { groups: ['group:default/admins'] },
              children: [
                { id: 'user-management' },
                {
                  id: 'audit-log',
                  visibility: { users: ['user:default/alice'] },
                },
              ],
            },
          ],
        },
      },
    });
    expect(loadDefaultCards(config)).toEqual([
      { id: 'onboarding' },
      {
        label: 'Admin tools',
        visibility: { groups: ['group:default/admins'] },
        children: [
          { id: 'user-management' },
          {
            id: 'audit-log',
            visibility: { users: ['user:default/alice'] },
          },
        ],
      },
    ]);
  });

  it('throws when a node has both `id` and `children`', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultCards: [{ id: 'mixed', children: [{ id: 'inner' }] }],
        },
      },
    });
    expect(() => loadDefaultCards(config)).toThrow(
      /Invalid homepage\.defaultCards/,
    );
  });

  it('throws when a node has neither `id` nor `children`', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultCards: [{ label: 'lonely' }],
        },
      },
    });
    expect(() => loadDefaultCards(config)).toThrow(
      /Invalid homepage\.defaultCards/,
    );
  });

  it('throws when a node has an unknown key', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultCards: [{ id: 'x', extra: 'nope' }],
        },
      },
    });
    expect(() => loadDefaultCards(config)).toThrow(
      /Invalid homepage\.defaultCards/,
    );
  });

  it('throws when a user ref is not a qualified entity ref', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultCards: [
            {
              id: 'x',
              visibility: { users: ['not-an-entity-ref'] },
            },
          ],
        },
      },
    });
    expect(() => loadDefaultCards(config)).toThrow(
      /Invalid homepage\.defaultCards/,
    );
  });

  it('parses cards with title, description, priority, and layouts', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultCards: [
            {
              id: 'card-with-meta',
              title: 'My Card',
              description: 'A description',
              priority: 200,
              layouts: {
                xl: { w: 12, h: 5, x: 0, y: 0 },
                sm: { w: 6, h: 3 },
              },
            },
          ],
        },
      },
    });
    const result = loadDefaultCards(config);
    expect(result).toEqual([
      {
        id: 'card-with-meta',
        title: 'My Card',
        description: 'A description',
        priority: 200,
        layouts: {
          xl: { w: 12, h: 5, x: 0, y: 0 },
          sm: { w: 6, h: 3 },
        },
      },
    ]);
  });

  it('accepts a group with an empty visibility block', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultCards: [
            {
              label: 'empty-vis',
              visibility: {},
              children: [{ id: 'x' }],
            },
          ],
        },
      },
    });
    expect(loadDefaultCards(config)).toHaveLength(1);
  });
});

describe('loadCustomizable', () => {
  it('returns false when homepage.customizable is absent', () => {
    const config = mockServices.rootConfig({ data: {} });
    expect(loadCustomizable(config)).toBe(false);
  });

  it('returns true when homepage.customizable is true', () => {
    const config = mockServices.rootConfig({
      data: { homepage: { customizable: true } },
    });
    expect(loadCustomizable(config)).toBe(true);
  });

  it('returns false when homepage.customizable is false', () => {
    const config = mockServices.rootConfig({
      data: { homepage: { customizable: false } },
    });
    expect(loadCustomizable(config)).toBe(false);
  });
});

describe('collectReferencedPermissions', () => {
  it('returns an empty set for an empty tree', () => {
    expect(collectReferencedPermissions([])).toEqual(new Set());
  });

  it('walks the whole tree and deduplicates', () => {
    const tree: CardNode[] = [
      {
        id: 'a',
        visibility: { permissions: ['perm.read', 'perm.write'] },
      },
      {
        label: 'group',
        children: [
          {
            id: 'b',
            visibility: { permissions: ['perm.read'] },
          },
          {
            label: 'nested',
            visibility: { permissions: ['perm.admin'] },
            children: [
              {
                id: 'c',
                visibility: { permissions: ['perm.write'] },
              },
            ],
          },
        ],
      },
      { id: 'd' },
    ];
    expect(collectReferencedPermissions(tree)).toEqual(
      new Set(['perm.read', 'perm.write', 'perm.admin']),
    );
  });
});
