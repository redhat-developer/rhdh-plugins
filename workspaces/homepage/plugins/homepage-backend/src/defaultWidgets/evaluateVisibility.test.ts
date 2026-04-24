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
import { DefaultWidgetNode, UserContext } from './types';

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
    const tree: DefaultWidgetNode[] = [
      {
        if: { permissions: ['perm.admin'] },
        children: [
          { id: 'user-management', ref: 'user-management' },
          { id: 'audit-log', ref: 'audit-log' },
        ],
      },
      { id: 'onboarding', ref: 'onboarding' },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual(['onboarding']);
  });

  it('returns only visible children of a visible group', () => {
    const tree: DefaultWidgetNode[] = [
      {
        if: { groups: ['group:default/developers'] },
        children: [
          { id: 'visible-child', ref: 'visible-child' },
          {
            id: 'hidden-child',
            ref: 'hidden-child',
            if: { users: ['user:default/bob'] },
          },
        ],
      },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual(['visible-child']);
  });

  it('preserves depth-first pre-order', () => {
    const tree: DefaultWidgetNode[] = [
      { id: 'a', ref: 'a' },
      {
        children: [
          { id: 'b', ref: 'b' },
          {
            children: [
              { id: 'c', ref: 'c' },
              { id: 'd', ref: 'd' },
            ],
          },
          { id: 'e', ref: 'e' },
        ],
      },
      { id: 'f', ref: 'f' },
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
    const tree: DefaultWidgetNode[] = [
      {
        if: { groups: ['group:default/developers'] },
        children: [
          {
            if: { users: ['user:default/alice'] },
            children: [
              { id: 'deeply-visible', ref: 'deeply-visible' },
              {
                id: 'deeply-hidden',
                ref: 'deeply-hidden',
                if: { permissions: ['perm.admin'] },
              },
            ],
          },
          {
            if: { users: ['user:default/bob'] },
            children: [{ id: 'unreachable', ref: 'unreachable' }],
          },
        ],
      },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual(['deeply-visible']);
  });

  it('returns all leaves when no node has visibility constraints', () => {
    const tree: DefaultWidgetNode[] = [
      { id: 'a', ref: 'a' },
      {
        children: [
          { id: 'b', ref: 'b' },
          { id: 'c', ref: 'c' },
        ],
      },
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
    const tree: DefaultWidgetNode[] = [
      {
        id: 'card-a',
        ref: 'card-a',
        props: { title: 'Card A', description: 'Description A' },
        layout: { xl: { w: 12, h: 5 } },
      },
    ];
    expect(filterToVisibleLeaves(tree, ctx)).toEqual([
      {
        id: 'card-a',
        ref: 'card-a',
        props: { title: 'Card A', description: 'Description A' },
        layout: { xl: { w: 12, h: 5 } },
      },
    ]);
  });

  it('includes props in output', () => {
    const tree: DefaultWidgetNode[] = [
      {
        id: 'i18n-card',
        ref: 'i18n-card',
        props: {
          title: 'Fallback Title',
          titleKey: 'homepage.card.title',
          description: 'Fallback Desc',
          descriptionKey: 'homepage.card.description',
        },
      },
    ];
    expect(filterToVisibleLeaves(tree, ctx)).toEqual([
      {
        id: 'i18n-card',
        ref: 'i18n-card',
        props: {
          title: 'Fallback Title',
          titleKey: 'homepage.card.title',
          description: 'Fallback Desc',
          descriptionKey: 'homepage.card.description',
        },
      },
    ]);
  });

  it('strips if and children from output', () => {
    const tree: DefaultWidgetNode[] = [
      {
        id: 'x',
        ref: 'x',
        if: { groups: ['group:default/developers'] },
      },
    ];
    const result = filterToVisibleLeaves(tree, ctx);
    expect(result).toEqual([{ id: 'x', ref: 'x' }]);
    expect(result[0]).not.toHaveProperty('if');
    expect(result[0]).not.toHaveProperty('children');
  });

  it('omits undefined optional fields from the output', () => {
    const tree: DefaultWidgetNode[] = [{ id: 'minimal', ref: 'minimal' }];
    const result = filterToVisibleLeaves(tree, ctx);
    expect(result).toEqual([{ id: 'minimal', ref: 'minimal' }]);
    expect(Object.keys(result[0])).toEqual(['id', 'ref']);
  });

  it('prunes subtrees and returns visible leaves from groups', () => {
    const tree: DefaultWidgetNode[] = [
      {
        if: { permissions: ['perm.admin'] },
        children: [{ id: 'hidden-inner', ref: 'hidden-inner' }],
      },
      { id: 'visible', ref: 'visible' },
    ];
    expect(filterToVisibleLeaves(tree, ctx)).toEqual([
      { id: 'visible', ref: 'visible' },
    ]);
  });
});
