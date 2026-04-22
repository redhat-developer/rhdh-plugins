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

import { CardNode, CardVisibility, UserContext, VisibleCard } from './types';

export function isVisible(
  visibility: CardVisibility | undefined,
  ctx: UserContext,
): boolean {
  if (!visibility) return true;

  const hasAny =
    (visibility.users?.length ?? 0) > 0 ||
    (visibility.groups?.length ?? 0) > 0 ||
    (visibility.permissions?.length ?? 0) > 0;
  if (!hasAny) return true;

  const matchUser =
    visibility.users?.some(ref => ref === ctx.userEntityRef) ?? false;
  const matchGroup =
    visibility.groups?.some(ref => ctx.groupEntityRefs.has(ref)) ?? false;
  const matchPermission =
    visibility.permissions?.some(
      p => ctx.permissionDecisions.get(p) === 'ALLOW',
    ) ?? false;

  return matchUser || matchGroup || matchPermission;
}

export function filterToVisibleLeafIds(
  nodes: CardNode[],
  ctx: UserContext,
): string[] {
  const out: string[] = [];
  const walk = (node: CardNode) => {
    if (!isVisible(node.if, ctx)) return;
    if (node.id !== undefined) out.push(node.id);
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

export function filterToVisibleLeaves(
  nodes: CardNode[],
  ctx: UserContext,
): VisibleCard[] {
  const out: VisibleCard[] = [];
  const walk = (node: CardNode) => {
    if (!isVisible(node.if, ctx)) return;
    if (node.id !== undefined) {
      const card: VisibleCard = { id: node.id };
      if (node.label !== undefined) card.label = node.label;
      if (node.title !== undefined) card.title = node.title;
      if (node.titleKey !== undefined) card.titleKey = node.titleKey;
      if (node.description !== undefined) card.description = node.description;
      if (node.descriptionKey !== undefined)
        card.descriptionKey = node.descriptionKey;
      if (node.priority !== undefined) card.priority = node.priority;
      if (node.layouts !== undefined) card.layouts = node.layouts;
      out.push(card);
    }
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}
