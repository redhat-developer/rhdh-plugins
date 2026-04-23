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
  loadDefaultWidgets,
} from './loadDefaultWidgets';
import { CardNode } from './types';

describe('loadDefaultWidgets', () => {
  it('returns an empty array when homepage.defaultWidgets is absent', () => {
    const config = mockServices.rootConfig({ data: {} });
    expect(loadDefaultWidgets(config)).toEqual([]);
  });

  it('parses a valid tree', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [
            { id: 'onboarding' },
            {
              if: { groups: ['group:default/admins'] },
              children: [
                { id: 'user-management' },
                {
                  id: 'audit-log',
                  if: { users: ['user:default/alice'] },
                },
              ],
            },
          ],
        },
      },
    });
    expect(loadDefaultWidgets(config)).toEqual([
      { id: 'onboarding' },
      {
        if: { groups: ['group:default/admins'] },
        children: [
          { id: 'user-management' },
          {
            id: 'audit-log',
            if: { users: ['user:default/alice'] },
          },
        ],
      },
    ]);
  });

  it('throws when a node has both `id` and `children`', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [{ id: 'mixed', children: [{ id: 'inner' }] }],
        },
      },
    });
    expect(() => loadDefaultWidgets(config)).toThrow(
      /Invalid homepage\.defaultWidgets/,
    );
  });

  it('throws when a node has neither `id` nor `children`', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [{ props: { label: 'lonely' } }],
        },
      },
    });
    expect(() => loadDefaultWidgets(config)).toThrow(
      /Invalid homepage\.defaultWidgets/,
    );
  });

  it('throws when a node has an unknown key', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [{ id: 'x', extra: 'nope' }],
        },
      },
    });
    expect(() => loadDefaultWidgets(config)).toThrow(
      /Invalid homepage\.defaultWidgets/,
    );
  });

  it('throws when a user ref is not a qualified entity ref', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [
            {
              id: 'x',
              if: { users: ['not-an-entity-ref'] },
            },
          ],
        },
      },
    });
    expect(() => loadDefaultWidgets(config)).toThrow(
      /Invalid homepage\.defaultWidgets/,
    );
  });

  it('parses cards with title, description, priority, and layouts', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [
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
    const result = loadDefaultWidgets(config);
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

  it('parses cards with titleKey and descriptionKey', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [
            {
              id: 'i18n-card',
              title: 'Fallback',
              titleKey: 'homepage.card.title',
              descriptionKey: 'homepage.card.desc',
            },
          ],
        },
      },
    });
    const result = loadDefaultWidgets(config);
    expect(result).toEqual([
      {
        id: 'i18n-card',
        title: 'Fallback',
        titleKey: 'homepage.card.title',
        descriptionKey: 'homepage.card.desc',
      },
    ]);
  });

  it('accepts a group with an empty visibility block', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [
            {
              if: {},
              children: [{ id: 'x' }],
            },
          ],
        },
      },
    });
    expect(loadDefaultWidgets(config)).toHaveLength(1);
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
        if: { permissions: ['perm.read', 'perm.write'] },
      },
      {
        children: [
          {
            id: 'b',
            if: { permissions: ['perm.read'] },
          },
          {
            if: { permissions: ['perm.admin'] },
            children: [
              {
                id: 'c',
                if: { permissions: ['perm.write'] },
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
