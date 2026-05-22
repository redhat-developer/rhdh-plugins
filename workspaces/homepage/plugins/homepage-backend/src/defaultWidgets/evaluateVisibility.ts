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
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';
import { DefaultWidgetNode, UserContext, VisibleDefaultWidget } from './types';
import { rules } from '../permissions/rules';

export function isVisible(
  defaultWidget: DefaultWidgetNode,
  ctx: UserContext,
): boolean {
  const visibility = defaultWidget?.if;
  if (!visibility) return true;

  const hasAnyCondition =
    (visibility.users?.length ?? 0) > 0 ||
    (visibility.groups?.length ?? 0) > 0 ||
    (visibility.permissions?.length ?? 0) > 0;
  if (!hasAnyCondition) return true;

  const matchUser =
    visibility.users?.some(ref => ref === ctx.userEntityRef) ?? false;
  const matchGroup =
    visibility.groups?.some(ref => ctx.groupEntityRefs.has(ref)) ?? false;
  const matchPolicy =
    visibility.permissions?.some(p => {
      const decision = ctx.policyDecisions.get(p);
      if (!decision) return false;
      return (
        decision.result === 'ALLOW' ||
        (decision.result === 'CONDITIONAL' &&
          matches(defaultWidget, decision.conditions))
      );
    }) ?? false;

  const matchAny = matchUser || matchGroup || matchPolicy;

  return matchAny;
}

export function filterToVisibleLeafIds(
  nodes: DefaultWidgetNode[],
  ctx: UserContext,
): string[] {
  const out: string[] = [];
  const walk = (node: DefaultWidgetNode) => {
    if (!isVisible(node, ctx)) return;
    if (node.id !== undefined) out.push(node.id);
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

export function filterToVisibleLeaves(
  nodes: DefaultWidgetNode[],
  ctx: UserContext,
): VisibleDefaultWidget[] {
  const out: VisibleDefaultWidget[] = [];
  const walk = (node: DefaultWidgetNode) => {
    if (!isVisible(node, ctx)) return;
    if (node.id !== undefined) {
      const card: VisibleDefaultWidget = {
        id: node.id,
        ref: node.ref ?? node.id,
      };
      if (node.props !== undefined) card.props = node.props;
      if (node.layout !== undefined) card.layout = node.layout;
      out.push(card);
    }
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

const matches = (
  defaultWidget: DefaultWidgetNode,
  filters?: PermissionCriteria<
    PermissionCondition<string, PermissionRuleParams>
  >,
): boolean => {
  if (!filters) {
    return true;
  }

  if ('allOf' in filters) {
    return filters.allOf.every(filter => matches(defaultWidget, filter));
  }

  if ('anyOf' in filters) {
    return filters.anyOf.some(filter => matches(defaultWidget, filter));
  }

  if ('not' in filters) {
    return !matches(defaultWidget, filters.not);
  }

  return (
    Object.values(rules)
      .find(r => r.name === filters.rule)
      ?.apply(defaultWidget, filters.params ?? {}) ?? false
  );
};
