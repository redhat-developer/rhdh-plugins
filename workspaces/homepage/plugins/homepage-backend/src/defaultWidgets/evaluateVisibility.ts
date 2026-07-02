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
  DefaultWidgetNode,
  DefaultWidgetVisibility,
  UserContext,
  VisibleDefaultWidget,
} from './types';
import { matches } from '../permissions/permissionUtils';

function matchesVisibility(
  defaultWidget: DefaultWidgetNode,
  visibility: DefaultWidgetVisibility,
  ctx: UserContext,
): boolean {
  const matchesAnyUser =
    visibility.users?.some(ref => ref === ctx.userEntityRef) ?? false;
  const matchesAnyGroup =
    visibility.groups?.some(ref => ctx.groupEntityRefs.has(ref)) ?? false;
  const matchesAnyOtherPolicy =
    visibility.permissions?.some(p => {
      const decision = ctx.otherPolicyDecisions.get(p);
      if (!decision) return false;
      return (
        decision.result === 'ALLOW' ||
        (decision.result === 'CONDITIONAL' &&
          matches(defaultWidget, decision.conditions))
      );
    }) ?? false;

  return matchesAnyUser || matchesAnyGroup || matchesAnyOtherPolicy;
}

export function isVisible(
  defaultWidget: DefaultWidgetNode,
  ctx: UserContext,
): boolean {
  const hasTags = (defaultWidget?.tags?.length ?? 0) > 0;

  if (ctx.defaultWidgetsReadDecision.result === 'DENY' && hasTags) {
    return false;
  }

  if (
    ctx.defaultWidgetsReadDecision.result === 'CONDITIONAL' &&
    !matches(defaultWidget, ctx.defaultWidgetsReadDecision.conditions)
  ) {
    return false;
  }

  const visibility = defaultWidget.if;
  if (!visibility) return true;

  const hasAny =
    (visibility.users?.length ?? 0) > 0 ||
    (visibility.groups?.length ?? 0) > 0 ||
    (visibility.permissions?.length ?? 0) > 0;
  if (!hasAny) return true;

  return matchesVisibility(defaultWidget, visibility, ctx);
}

export function isExcluded(
  defaultWidget: DefaultWidgetNode,
  ctx: UserContext,
): boolean {
  const visibility = defaultWidget.unless;
  if (!visibility) return false;

  const hasAny =
    (visibility.users?.length ?? 0) > 0 ||
    (visibility.groups?.length ?? 0) > 0 ||
    (visibility.permissions?.length ?? 0) > 0;
  if (!hasAny) return false;

  return matchesVisibility(defaultWidget, visibility, ctx);
}

export function filterToVisibleLeaves(
  nodes: DefaultWidgetNode[],
  ctx: UserContext,
): VisibleDefaultWidget[] {
  const out: VisibleDefaultWidget[] = [];
  const walk = (node: DefaultWidgetNode) => {
    if (!isVisible(node, ctx)) return;
    if (isExcluded(node, ctx)) return;
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
