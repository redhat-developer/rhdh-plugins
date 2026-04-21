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
  filterToVisibleLeafIds,
  filterToVisibleLeaves,
  isVisible,
} from './evaluateVisibility';
import { CardNode, UserContext } from './types';

function makeCtx(partial?: Partial<UserContext>): UserContext {
  return {
    userEntityRef: 'user:default/alice',
    groupEntityRefs: new Set(),
    permissionDecisions: new Map(),
    ...partial,
  };
}

describe('isVisible', () => {
  const ctx = makeCtx({
    groupEntityRefs: new Set(['group:default/developers']),
    permissionDecisions: new Map([
      ['perm.allowed', 'ALLOW'],
      ['perm.denied', 'DENY'],
    ]),
  });

  it('visible when no visibility block is provided', () => {
    expect(isVisible(undefined, ctx)).toBe(true);
  });

  it('visible when visibility block is empty', () => {
    expect(isVisible({}, ctx)).toBe(true);
  });

  it('visible when visibility has only empty arrays', () => {
    expect(isVisible({ users: [], groups: [], permissions: [] }, ctx)).toBe(
      true,
    );
  });

  it('visible when user ref matches', () => {
    expect(isVisible({ users: ['user:default/alice'] }, ctx)).toBe(true);
  });

  it('hidden when only user ref is set and does not match', () => {
    expect(isVisible({ users: ['user:default/bob'] }, ctx)).toBe(false);
  });

  it('visible when any group ref in the list matches', () => {
    expect(
      isVisible(
        { groups: ['group:default/platform', 'group:default/developers'] },
        ctx,
      ),
    ).toBe(true);
  });

  it('hidden when no group ref in the list matches', () => {
    expect(isVisible({ groups: ['group:default/platform'] }, ctx)).toBe(false);
  });

  it('visible when any referenced permission is ALLOW', () => {
    expect(
      isVisible({ permissions: ['perm.denied', 'perm.allowed'] }, ctx),
    ).toBe(true);
  });

  it('hidden when all referenced permissions are DENY', () => {
    expect(isVisible({ permissions: ['perm.denied'] }, ctx)).toBe(false);
  });

  it('hidden when a permission is missing from decisions (fails closed)', () => {
    expect(isVisible({ permissions: ['perm.unknown'] }, ctx)).toBe(false);
  });

  it('visible via OR across fields (permission allows even when user and group miss)', () => {
    expect(
      isVisible(
        {
          users: ['user:default/bob'],
          groups: ['group:default/platform'],
          permissions: ['perm.allowed'],
        },
        ctx,
      ),
    ).toBe(true);
  });

  it('hidden when every listed field fails', () => {
    expect(
      isVisible(
        {
          users: ['user:default/bob'],
          groups: ['group:default/platform'],
          permissions: ['perm.denied'],
        },
        ctx,
      ),
    ).toBe(false);
  });
});

describe('filterToVisibleLeafIds', () => {
  const ctx = makeCtx({
    groupEntityRefs: new Set(['group:default/developers']),
    permissionDecisions: new Map([['perm.admin', 'DENY']]),
  });

  it('returns an empty list for an empty tree', () => {
    expect(filterToVisibleLeafIds([], ctx)).toEqual([]);
  });

  it('prunes an entire subtree when the parent group is hidden', () => {
    const tree: CardNode[] = [
      {
        label: 'Admin tools',
        visibility: { permissions: ['perm.admin'] },
        children: [{ id: 'user-management' }, { id: 'audit-log' }],
      },
      { id: 'onboarding' },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual(['onboarding']);
  });

  it('returns only visible children of a visible group', () => {
    const tree: CardNode[] = [
      {
        label: 'Team tools',
        visibility: { groups: ['group:default/developers'] },
        children: [
          { id: 'visible-child' },
          {
            id: 'hidden-child',
            visibility: { users: ['user:default/bob'] },
          },
        ],
      },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual(['visible-child']);
  });

  it('preserves depth-first pre-order', () => {
    const tree: CardNode[] = [
      { id: 'a' },
      {
        label: 'mid',
        children: [
          { id: 'b' },
          {
            label: 'inner',
            children: [{ id: 'c' }, { id: 'd' }],
          },
          { id: 'e' },
        ],
      },
      { id: 'f' },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ]);
  });

  it('handles deep nesting with mixed permissions across levels', () => {
    const tree: CardNode[] = [
      {
        label: 'level-1',
        visibility: { groups: ['group:default/developers'] },
        children: [
          {
            label: 'level-2',
            visibility: { users: ['user:default/alice'] },
            children: [
              { id: 'deeply-visible' },
              {
                id: 'deeply-hidden',
                visibility: { permissions: ['perm.admin'] },
              },
            ],
          },
          {
            label: 'level-2-hidden',
            visibility: { users: ['user:default/bob'] },
            children: [{ id: 'unreachable' }],
          },
        ],
      },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual(['deeply-visible']);
  });

  it('returns all leaves when no node has visibility constraints', () => {
    const tree: CardNode[] = [
      { id: 'a' },
      { label: 'g', children: [{ id: 'b' }, { id: 'c' }] },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual(['a', 'b', 'c']);
  });
});

describe('filterToVisibleLeaves', () => {
  const ctx = makeCtx({
    groupEntityRefs: new Set(['group:default/developers']),
    permissionDecisions: new Map([['perm.admin', 'DENY']]),
  });

  it('returns full card objects with metadata', () => {
    const tree: CardNode[] = [
      {
        id: 'card-a',
        title: 'Card A',
        description: 'Description A',
        priority: 100,
        layouts: { xl: { w: 12, h: 5 } },
      },
    ];
    expect(filterToVisibleLeaves(tree, ctx)).toEqual([
      {
        id: 'card-a',
        title: 'Card A',
        description: 'Description A',
        priority: 100,
        layouts: { xl: { w: 12, h: 5 } },
      },
    ]);
  });

  it('strips visibility and children from output', () => {
    const tree: CardNode[] = [
      {
        id: 'x',
        label: 'Label X',
        visibility: { groups: ['group:default/developers'] },
      },
    ];
    const result = filterToVisibleLeaves(tree, ctx);
    expect(result).toEqual([{ id: 'x', label: 'Label X' }]);
    expect(result[0]).not.toHaveProperty('visibility');
    expect(result[0]).not.toHaveProperty('children');
  });

  it('omits undefined optional fields from the output', () => {
    const tree: CardNode[] = [{ id: 'minimal' }];
    const result = filterToVisibleLeaves(tree, ctx);
    expect(result).toEqual([{ id: 'minimal' }]);
    expect(Object.keys(result[0])).toEqual(['id']);
  });

  it('prunes subtrees and returns visible leaves from groups', () => {
    const tree: CardNode[] = [
      {
        label: 'Admin tools',
        visibility: { permissions: ['perm.admin'] },
        children: [{ id: 'hidden-inner', title: 'Hidden' }],
      },
      { id: 'visible', priority: 50 },
    ];
    expect(filterToVisibleLeaves(tree, ctx)).toEqual([
      { id: 'visible', priority: 50 },
    ]);
  });
});
