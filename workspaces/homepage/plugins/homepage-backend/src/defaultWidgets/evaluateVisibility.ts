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

export function isVisible(
  visibility: DefaultWidgetVisibility | undefined,
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
  nodes: DefaultWidgetNode[],
  ctx: UserContext,
): string[] {
  const out: string[] = [];
  const walk = (node: DefaultWidgetNode) => {
    if (!isVisible(node.if, ctx)) return;
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
    if (!isVisible(node.if, ctx)) return;
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
