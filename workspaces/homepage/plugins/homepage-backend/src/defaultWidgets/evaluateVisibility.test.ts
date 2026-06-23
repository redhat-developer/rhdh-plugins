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
  AuthorizeResult,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  filterToVisibleLeafIds,
  filterToVisibleLeaves,
  isExcluded,
  isVisible,
} from './evaluateVisibility';
import { DefaultWidgetNode, UserContext } from './types';

function makeCtx(partial?: Partial<UserContext>): UserContext {
  return {
    userEntityRef: 'user:default/alice',
    groupEntityRefs: new Set(),
    policyDecisions: new Map(),
    ...partial,
  };
}

describe('isVisible', () => {
  const ctx = makeCtx({
    groupEntityRefs: new Set(['group:default/developers']),
    policyDecisions: new Map<string, PolicyDecision>([
      ['perm.allowed', { result: AuthorizeResult.ALLOW }],
      ['perm.denied', { result: AuthorizeResult.DENY }],
    ]),
  });

  it('visible when no visibility block is provided', () => {
    expect(isVisible({}, ctx)).toBe(true);
  });

  it('visible when visibility block is empty', () => {
    expect(isVisible({ if: {} }, ctx)).toBe(true);
  });

  it('visible when visibility has only empty arrays', () => {
    expect(
      isVisible({ if: { users: [], groups: [], permissions: [] } }, ctx),
    ).toBe(true);
  });

  it('visible when user ref matches', () => {
    expect(isVisible({ if: { users: ['user:default/alice'] } }, ctx)).toBe(
      true,
    );
  });

  it('hidden when only user ref is set and does not match', () => {
    expect(isVisible({ if: { users: ['user:default/bob'] } }, ctx)).toBe(false);
  });

  it('visible when any group ref in the list matches', () => {
    expect(
      isVisible(
        {
          if: {
            groups: ['group:default/platform', 'group:default/developers'],
          },
        },
        ctx,
      ),
    ).toBe(true);
  });

  it('hidden when no group ref in the list matches', () => {
    expect(isVisible({ if: { groups: ['group:default/platform'] } }, ctx)).toBe(
      false,
    );
  });

  it('visible when any referenced permission is ALLOW', () => {
    expect(
      isVisible({ if: { permissions: ['perm.denied', 'perm.allowed'] } }, ctx),
    ).toBe(true);
  });

  it('hidden when all referenced permissions are DENY', () => {
    expect(isVisible({ if: { permissions: ['perm.denied'] } }, ctx)).toBe(
      false,
    );
  });

  it('hidden when a permission is missing from decisions (fails closed)', () => {
    expect(isVisible({ if: { permissions: ['perm.unknown'] } }, ctx)).toBe(
      false,
    );
  });

  it('visible via OR across fields (permission allows even when user and group miss)', () => {
    expect(
      isVisible(
        {
          if: {
            users: ['user:default/bob'],
            groups: ['group:default/platform'],
            permissions: ['perm.allowed'],
          },
        },
        ctx,
      ),
    ).toBe(true);
  });

  it('hidden when every listed field fails', () => {
    expect(
      isVisible(
        {
          if: {
            users: ['user:default/bob'],
            groups: ['group:default/platform'],
            permissions: ['perm.denied'],
          },
        },
        ctx,
      ),
    ).toBe(false);
  });

  describe('conditional permissions', () => {
    const conditionFor = (widgetIds: string[]) => ({
      rule: 'HAS_WIDGET_ID',
      resourceType: 'homepage-default-widget',
      params: { widgetIds },
    });

    const conditionalDecision = (
      conditions: PolicyDecision extends infer T
        ? T extends { conditions: infer C }
          ? C
          : never
        : never,
    ): PolicyDecision => ({
      result: AuthorizeResult.CONDITIONAL,
      pluginId: 'homepage',
      resourceType: 'homepage-default-widget',
      conditions,
    });

    it('visible when CONDITIONAL decision matches widget id', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          ['perm.cond', conditionalDecision(conditionFor(['my-widget']))],
        ]),
      });
      expect(
        isVisible(
          { id: 'my-widget', if: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(true);
    });

    it('hidden when CONDITIONAL decision does not match widget id', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          ['perm.cond', conditionalDecision(conditionFor(['other-widget']))],
        ]),
      });
      expect(
        isVisible(
          { id: 'my-widget', if: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(false);
    });

    it('visible when CONDITIONAL uses allOf and all conditions match', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          [
            'perm.cond',
            conditionalDecision({
              allOf: [conditionFor(['my-widget', 'other-widget'])],
            }),
          ],
        ]),
      });
      expect(
        isVisible(
          { id: 'my-widget', if: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(true);
    });

    it('hidden when CONDITIONAL uses allOf and one condition fails', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          [
            'perm.cond',
            conditionalDecision({
              allOf: [
                conditionFor(['my-widget']),
                conditionFor(['other-widget']),
              ],
            }),
          ],
        ]),
      });
      expect(
        isVisible(
          { id: 'my-widget', if: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(false);
    });

    it('visible when CONDITIONAL uses anyOf and one condition matches', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          [
            'perm.cond',
            conditionalDecision({
              anyOf: [
                conditionFor(['other-widget']),
                conditionFor(['my-widget']),
              ],
            }),
          ],
        ]),
      });
      expect(
        isVisible(
          { id: 'my-widget', if: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(true);
    });

    it('hidden when CONDITIONAL uses not and the inner condition matches', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          [
            'perm.cond',
            conditionalDecision({ not: conditionFor(['my-widget']) }),
          ],
        ]),
      });
      expect(
        isVisible(
          { id: 'my-widget', if: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(false);
    });

    it('visible when CONDITIONAL uses not and the inner condition does not match', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          [
            'perm.cond',
            conditionalDecision({ not: conditionFor(['other-widget']) }),
          ],
        ]),
      });
      expect(
        isVisible(
          { id: 'my-widget', if: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(true);
    });

    it('hidden when CONDITIONAL references an unknown rule', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map<string, PolicyDecision>([
          [
            'perm.cond',
            {
              result: AuthorizeResult.CONDITIONAL,
              pluginId: 'homepage',
              resourceType: 'homepage-default-widget',
              conditions: {
                rule: 'UNKNOWN_RULE',
                resourceType: 'homepage-default-widget',
                params: {},
              },
            },
          ],
        ]),
      });
      expect(
        isVisible(
          { id: 'my-widget', if: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(false);
    });
  });
});

describe('isExcluded', () => {
  const ctx = makeCtx({
    groupEntityRefs: new Set(['group:default/developers']),
    policyDecisions: new Map<string, PolicyDecision>([
      ['perm.allowed', { result: AuthorizeResult.ALLOW }],
      ['perm.denied', { result: AuthorizeResult.DENY }],
    ]),
  });

  it('not excluded when no unless block is provided', () => {
    expect(isExcluded({}, ctx)).toBe(false);
  });

  it('not excluded when unless block is empty', () => {
    expect(isExcluded({ unless: {} }, ctx)).toBe(false);
  });

  it('not excluded when unless has only empty arrays', () => {
    expect(
      isExcluded({ unless: { users: [], groups: [], permissions: [] } }, ctx),
    ).toBe(false);
  });

  it('excluded when user ref matches', () => {
    expect(isExcluded({ unless: { users: ['user:default/alice'] } }, ctx)).toBe(
      true,
    );
  });

  it('not excluded when user ref does not match', () => {
    expect(isExcluded({ unless: { users: ['user:default/bob'] } }, ctx)).toBe(
      false,
    );
  });

  it('excluded when group ref matches', () => {
    expect(
      isExcluded({ unless: { groups: ['group:default/developers'] } }, ctx),
    ).toBe(true);
  });

  it('excluded when permission is ALLOW', () => {
    expect(isExcluded({ unless: { permissions: ['perm.allowed'] } }, ctx)).toBe(
      true,
    );
  });

  it('not excluded when permission is DENY', () => {
    expect(isExcluded({ unless: { permissions: ['perm.denied'] } }, ctx)).toBe(
      false,
    );
  });

  it('not excluded when permission is missing from decisions (fails closed)', () => {
    expect(isExcluded({ unless: { permissions: ['perm.unknown'] } }, ctx)).toBe(
      false,
    );
  });

  describe('conditional permissions', () => {
    const conditionFor = (widgetIds: string[]) => ({
      rule: 'HAS_WIDGET_ID',
      resourceType: 'homepage-default-widget',
      params: { widgetIds },
    });

    const conditionalDecision = (
      conditions: PolicyDecision extends infer T
        ? T extends { conditions: infer C }
          ? C
          : never
        : never,
    ): PolicyDecision => ({
      result: AuthorizeResult.CONDITIONAL,
      pluginId: 'homepage',
      resourceType: 'homepage-default-widget',
      conditions,
    });

    it('excluded when CONDITIONAL decision matches widget id', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          ['perm.cond', conditionalDecision(conditionFor(['my-widget']))],
        ]),
      });
      expect(
        isExcluded(
          { id: 'my-widget', unless: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(true);
    });

    it('not excluded when CONDITIONAL decision does not match widget id', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          ['perm.cond', conditionalDecision(conditionFor(['other-widget']))],
        ]),
      });
      expect(
        isExcluded(
          { id: 'my-widget', unless: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(false);
    });

    it('not excluded when CONDITIONAL uses not and the inner condition matches', () => {
      const ctxCond = makeCtx({
        policyDecisions: new Map([
          [
            'perm.cond',
            conditionalDecision({ not: conditionFor(['my-widget']) }),
          ],
        ]),
      });
      expect(
        isExcluded(
          { id: 'my-widget', unless: { permissions: ['perm.cond'] } },
          ctxCond,
        ),
      ).toBe(false);
    });
  });
});

describe('filterToVisibleLeafIds', () => {
  const ctx = makeCtx({
    groupEntityRefs: new Set(['group:default/developers']),
    policyDecisions: new Map<string, PolicyDecision>([
      ['perm.admin', { result: AuthorizeResult.DENY }],
    ]),
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

  it('excludes a leaf when unless matches the user', () => {
    const tree: DefaultWidgetNode[] = [
      { id: 'a', ref: 'a' },
      {
        id: 'b',
        ref: 'b',
        unless: { users: ['user:default/alice'] },
      },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual(['a']);
  });

  it('unless takes precedence over if (deny wins)', () => {
    const tree: DefaultWidgetNode[] = [
      {
        id: 'a',
        ref: 'a',
        if: { groups: ['group:default/developers'] },
        unless: { users: ['user:default/alice'] },
      },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual([]);
  });

  it('prunes entire subtree when unless on group node matches', () => {
    const tree: DefaultWidgetNode[] = [
      {
        unless: { groups: ['group:default/developers'] },
        children: [
          { id: 'a', ref: 'a' },
          { id: 'b', ref: 'b' },
        ],
      },
      { id: 'c', ref: 'c' },
    ];
    expect(filterToVisibleLeafIds(tree, ctx)).toEqual(['c']);
  });

  it('excludes a leaf when unless matches a permission', () => {
    const ctxWithPerm = makeCtx({
      policyDecisions: new Map<string, PolicyDecision>([
        ['perm.exclude', { result: AuthorizeResult.ALLOW }],
      ]),
    });
    const tree: DefaultWidgetNode[] = [
      { id: 'a', ref: 'a' },
      {
        id: 'b',
        ref: 'b',
        unless: { permissions: ['perm.exclude'] },
      },
    ];
    expect(filterToVisibleLeafIds(tree, ctxWithPerm)).toEqual(['a']);
  });

  it('keeps a leaf when unless permission is DENY', () => {
    const ctxWithPerm = makeCtx({
      policyDecisions: new Map<string, PolicyDecision>([
        ['perm.exclude', { result: AuthorizeResult.DENY }],
      ]),
    });
    const tree: DefaultWidgetNode[] = [
      { id: 'a', ref: 'a' },
      {
        id: 'b',
        ref: 'b',
        unless: { permissions: ['perm.exclude'] },
      },
    ];
    expect(filterToVisibleLeafIds(tree, ctxWithPerm)).toEqual(['a', 'b']);
  });
});

describe('filterToVisibleLeaves', () => {
  const ctx = makeCtx({
    groupEntityRefs: new Set(['group:default/developers']),
    policyDecisions: new Map<string, PolicyDecision>([
      ['perm.admin', { result: AuthorizeResult.DENY }],
    ]),
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

  it('includes tags in output when present', () => {
    const tree: DefaultWidgetNode[] = [
      { id: 'tagged', ref: 'tagged', tags: ['admin', 'management'] },
    ];
    expect(filterToVisibleLeaves(tree, ctx)).toEqual([
      { id: 'tagged', ref: 'tagged', tags: ['admin', 'management'] },
    ]);
  });

  it('omits tags from output when empty array', () => {
    const tree: DefaultWidgetNode[] = [{ id: 'x', ref: 'x', tags: [] }];
    const result = filterToVisibleLeaves(tree, ctx);
    expect(result).toEqual([{ id: 'x', ref: 'x' }]);
    expect(Object.keys(result[0])).toEqual(['id', 'ref']);
  });

  it('excludes widget when unless matches', () => {
    const tree: DefaultWidgetNode[] = [
      { id: 'a', ref: 'a' },
      {
        id: 'b',
        ref: 'b',
        unless: { groups: ['group:default/developers'] },
      },
    ];
    expect(filterToVisibleLeaves(tree, ctx)).toEqual([{ id: 'a', ref: 'a' }]);
  });

  it('unless takes precedence over if in leaf output', () => {
    const tree: DefaultWidgetNode[] = [
      {
        id: 'x',
        ref: 'x',
        if: { groups: ['group:default/developers'] },
        unless: { users: ['user:default/alice'] },
      },
    ];
    expect(filterToVisibleLeaves(tree, ctx)).toEqual([]);
  });

  it('excludes widget when unless matches a permission', () => {
    const ctxWithPerm = makeCtx({
      policyDecisions: new Map<string, PolicyDecision>([
        ['perm.exclude', { result: AuthorizeResult.ALLOW }],
      ]),
    });
    const tree: DefaultWidgetNode[] = [
      { id: 'a', ref: 'a' },
      {
        id: 'b',
        ref: 'b',
        unless: { permissions: ['perm.exclude'] },
      },
    ];
    expect(filterToVisibleLeaves(tree, ctxWithPerm)).toEqual([
      { id: 'a', ref: 'a' },
    ]);
  });
});
