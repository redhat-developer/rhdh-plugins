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

import type { ComponentType } from 'react';
import { createExtensionBlueprint } from '@backstage/frontend-plugin-api';
import { z } from 'zod';

import { sidebarElementDataRef } from './sidebarElementDataRef';

/**
 * Blueprint for plugins to contribute a custom React component to the app
 * sidebar.
 *
 * Use this instead of {@link SidebarItemBlueprint} when the entry needs its
 * own component, for example the search modal or the notifications item,
 * which rely on hooks and context. The component is rendered at the top
 * level of the sidebar in the slot determined by `priority` (higher first),
 * alongside regular items and groups. Elements cannot be placed inside a
 * group.
 *
 * `priority` can be overridden by deployers via `app-config.yaml`:
 *
 * ```yaml
 * app:
 *   extensions:
 *     - sidebar-element:my-plugin/notifications:
 *         config:
 *           priority: -50
 * ```
 *
 * @example
 * ```
 * const notificationsElement = SidebarElementBlueprint.make({
 *   name: 'notifications',
 *   params: {
 *     component: NotificationsSidebarItem,
 *     priority: -50,
 *   },
 * });
 * ```
 *
 * @public
 */
export const SidebarElementBlueprint = createExtensionBlueprint({
  kind: 'sidebar-element',
  attachTo: { id: 'nav-content:app/sidebar', input: 'elements' },
  output: [sidebarElementDataRef],
  dataRefs: {
    element: sidebarElementDataRef,
  },
  configSchema: {
    priority: z.number().optional(),
  },
  *factory(
    params: {
      component: ComponentType<{}>;
      priority?: number;
    },
    { config, node },
  ) {
    yield sidebarElementDataRef({
      id: node.spec.id,
      component: params.component,
      priority: config.priority ?? params.priority,
    });
  },
});
