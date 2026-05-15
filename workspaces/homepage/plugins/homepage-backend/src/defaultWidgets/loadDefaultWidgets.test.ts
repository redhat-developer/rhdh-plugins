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
  loadDefaultWidgets,
} from './loadDefaultWidgets';
import { DefaultWidgetNode } from './types';

describe('loadDefaultWidgets', () => {
  it('returns undefined when homepage.defaultWidgets is absent', () => {
    const config = mockServices.rootConfig({ data: {} });
    expect(loadDefaultWidgets(config)).toBeUndefined();
  });

  it('parses a valid tree', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [
            { id: 'onboarding', ref: 'onboarding' },
            {
              if: { groups: ['group:default/admins'] },
              children: [
                { id: 'user-management', ref: 'user-management' },
                {
                  id: 'audit-log',
                  ref: 'audit-log',
                  if: { users: ['user:default/alice'] },
                },
              ],
            },
          ],
        },
      },
    });
    expect(loadDefaultWidgets(config)).toEqual([
      { id: 'onboarding', ref: 'onboarding' },
      {
        if: { groups: ['group:default/admins'] },
        children: [
          { id: 'user-management', ref: 'user-management' },
          {
            id: 'audit-log',
            ref: 'audit-log',
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
          defaultWidgets: [
            {
              id: 'mixed',
              children: [{ id: 'inner', ref: 'inner' }],
            },
          ],
        },
      },
    });
    expect(() => loadDefaultWidgets(config)).toThrow(
      /Invalid homepage\.defaultWidgets/,
    );
  });

  it('throws when a node has `id`, `ref` and `children`', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [
            {
              id: 'mixed',
              ref: 'mixed',
              children: [{ id: 'inner', ref: 'inner' }],
            },
          ],
        },
      },
    });
    expect(() => loadDefaultWidgets(config)).toThrow(
      /Invalid homepage\.defaultWidgets/,
    );
  });

  it('throws when a node has both `ref` and `children`', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [
            {
              ref: 'mixed',
              children: [{ id: 'inner', ref: 'inner' }],
            },
          ],
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
          defaultWidgets: [{ ref: 'lonely', props: { label: 'lonely' } }],
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
          defaultWidgets: [{ id: 'x', ref: 'x', extra: 'nope' }],
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
              ref: 'x',
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

  it('accepts a group with an empty visibility block', () => {
    const config = mockServices.rootConfig({
      data: {
        homepage: {
          defaultWidgets: [
            {
              if: {},
              children: [{ id: 'x', ref: 'x' }],
            },
          ],
        },
      },
    });
    expect(loadDefaultWidgets(config)).toHaveLength(1);
  });
});

describe('collectReferencedPermissions', () => {
  it('returns an empty set for an empty tree', () => {
    expect(collectReferencedPermissions([])).toEqual(new Set());
  });

  it('walks the whole tree and deduplicates', () => {
    const tree: DefaultWidgetNode[] = [
      {
        id: 'a',
        ref: 'a',
        if: { permissions: ['perm.read', 'perm.write'] },
      },
      {
        children: [
          {
            id: 'b',
            ref: 'b',
            if: { permissions: ['perm.read'] },
          },
          {
            if: { permissions: ['perm.admin'] },
            children: [
              {
                id: 'c',
                ref: 'c',
                if: { permissions: ['perm.write'] },
              },
            ],
          },
        ],
      },
      { id: 'd', ref: 'd' },
    ];
    expect(collectReferencedPermissions(tree)).toEqual(
      new Set(['perm.read', 'perm.write', 'perm.admin']),
    );
  });
});
