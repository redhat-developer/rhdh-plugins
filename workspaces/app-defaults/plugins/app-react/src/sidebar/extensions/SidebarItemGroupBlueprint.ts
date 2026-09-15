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

import { sidebarItemGroupDataRef } from './sidebarItemGroupDataRef';
import type { SidebarIcon } from '../types';

/**
 * Blueprint for plugins to contribute a group to the app sidebar.
 *
 * A group renders as a sidebar entry with an expandable submenu. Every
 * {@link SidebarItemBlueprint} extension whose `group` matches this group's
 * `id` is rendered inside the submenu, ordered by `priority`. Groups
 * themselves are ordered among top-level items by `priority` as well.
 *
 * `title`, `icon`, `to`, and `priority` can be overridden by deployers via
 * `app-config.yaml`:
 *
 * ```yaml
 * app:
 *   extensions:
 *     - sidebar-item-group:my-plugin/admin:
 *         config:
 *           priority: -100
 * ```
 *
 * @example
 * ```
 * const adminGroup = SidebarItemGroupBlueprint.make({
 *   name: 'admin',
 *   params: {
 *     id: 'admin',
 *     title: 'Administration',
 *     icon: 'admin',
 *   },
 * });
 * ```
 *
 * @public
 */
export const SidebarItemGroupBlueprint = createExtensionBlueprint({
  kind: 'sidebar-item-group',
  attachTo: { id: 'nav-content:app/sidebar', input: 'groups' },
  output: [sidebarItemGroupDataRef],
  dataRefs: {
    group: sidebarItemGroupDataRef,
  },
  configSchema: {
    title: z.string().optional(),
    icon: z.string().optional(),
    to: z.string().optional(),
    priority: z.number().optional(),
  },
  *factory(
    params: {
      id: string;
      title: string;
      icon?: SidebarIcon;
      to?: string;
      priority?: number;
    },
    { config },
  ) {
    yield sidebarItemGroupDataRef({
      id: params.id,
      title: config.title ?? params.title,
      icon: config.icon ?? params.icon,
      to: config.to ?? params.to,
      priority: config.priority ?? params.priority,
    });
  },
});
