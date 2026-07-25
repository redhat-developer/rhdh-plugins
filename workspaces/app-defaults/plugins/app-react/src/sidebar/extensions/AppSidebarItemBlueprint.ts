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

import { appSidebarItemDataRef } from './appSidebarItemDataRef';

/**
 * Blueprint for plugins to contribute sidebar items to the app sidebar.
 *
 * The `priority` field can be overridden by deployers via `app-config.yaml`
 * without changing plugin code:
 *
 * ```yaml
 * app:
 *   extensions:
 *     - app-sidebar-item:app/my-item:
 *         config:
 *           priority: 100
 * ```
 *
 * @example
 * ```
 * const myItem = AppSidebarItemBlueprint.make({
 *   name: 'my-item',
 *   params: {
 *     id: 'my-item',
 *     title: 'My Item',
 *     icon: MyIcon,
 *     to: '/my-page',
 *   },
 * });
 * ```
 *
 * @alpha
 */
export const AppSidebarItemBlueprint = createExtensionBlueprint({
  kind: 'app-sidebar-item',
  attachTo: { id: 'nav:app/sidebar', input: 'items' },
  output: [appSidebarItemDataRef],
  dataRefs: {
    item: appSidebarItemDataRef,
  },
  config: {
    schema: {
      priority: z => z.number().optional(),
    },
  },
  *factory(
    params: {
      id: string;
      title: string;
      icon: React.ComponentType;
      to?: string;
      priority?: number;
    },
    { config },
  ) {
    yield appSidebarItemDataRef({
      id: params.id,
      title: params.title,
      icon: params.icon,
      to: params.to,
      priority: config.priority ?? params.priority,
    });
  },
});
