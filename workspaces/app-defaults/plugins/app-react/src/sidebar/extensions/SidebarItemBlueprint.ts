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

import { createExtensionBlueprint } from '@backstage/frontend-plugin-api';
import { z } from 'zod';

import { sidebarItemDataRef } from './sidebarItemDataRef';
import type { SidebarIcon } from '../types';

/**
 * Blueprint for plugins to contribute an entry to the app sidebar.
 *
 * Entries are rendered by the `nav-content:app/sidebar` extension from
 * `@red-hat-developer-hub/backstage-plugin-app-defaults`, ordered by
 * `priority` (higher first, ties broken by title). Set `group` to the `id`
 * of a {@link SidebarItemGroupBlueprint} extension to render the entry
 * inside that group's submenu.
 *
 * `title`, `icon`, `to`, `priority`, `group`, and `requiresRoute` can be
 * overridden by deployers via `app-config.yaml` without changing plugin code:
 *
 * ```yaml
 * app:
 *   extensions:
 *     - sidebar-item:my-plugin/dashboard:
 *         config:
 *           priority: 100
 *           group: admin
 * ```
 *
 * @example
 * ```
 * const dashboardItem = SidebarItemBlueprint.make({
 *   name: 'dashboard',
 *   params: {
 *     title: 'Dashboard',
 *     icon: 'home',
 *     to: '/dashboard',
 *     priority: 10,
 *   },
 * });
 * ```
 *
 * @public
 */
export const SidebarItemBlueprint = createExtensionBlueprint({
  kind: 'sidebar-item',
  attachTo: { id: 'nav-content:app/sidebar', input: 'items' },
  output: [sidebarItemDataRef],
  dataRefs: {
    item: sidebarItemDataRef,
  },
  configSchema: {
    title: z.string().optional(),
    icon: z.string().optional(),
    to: z.string().optional(),
    priority: z.number().optional(),
    group: z.string().optional(),
    requiresRoute: z.boolean().optional(),
  },
  *factory(
    params: {
      title: string;
      icon?: SidebarIcon;
      to?: string;
      onClick?: () => void;
      priority?: number;
      group?: string;
      requiresRoute?: boolean;
    },
    { config, node },
  ) {
    yield sidebarItemDataRef({
      id: node.spec.id,
      title: config.title ?? params.title,
      icon: config.icon ?? params.icon,
      to: config.to ?? params.to,
      onClick: params.onClick,
      priority: config.priority ?? params.priority,
      group: config.group ?? params.group,
      requiresRoute: config.requiresRoute ?? params.requiresRoute,
    });
  },
});
