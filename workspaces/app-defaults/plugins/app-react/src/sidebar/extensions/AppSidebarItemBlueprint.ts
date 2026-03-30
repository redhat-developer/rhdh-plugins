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
import type { IconComponent } from '@backstage/frontend-plugin-api';

import { appSidebarItemDataRef } from './appSidebarItemDataRef';

/**
 * Blueprint for plugins to contribute sidebar item content to the app sidebar.
 *
 * Supports three modes:
 * - **Link items**: provide `title`, `href`, and `icon` for a simple nav link
 * - **Custom element items**: provide `element` for fully custom rendering
 * - **Child items**: use `attachTo` to nest under an `AppSidebarGroupBlueprint`
 *
 * The `priority` and `href` fields can be overridden by deployers via
 * `app-config.yaml` without changing plugin code:
 *
 * ```yaml
 * app:
 *   extensions:
 *     - app-sidebar-item:app/my-item:
 *         config:
 *           priority: 100
 *           href: /custom-path
 * ```
 *
 * @example
 * ```
 * const myItem = AppSidebarItemBlueprint.make({
 *   name: 'my-item',
 *   params: {
 *     id: 'my-item',
 *     title: 'My Item',
 *     href: '/my-item',
 *     icon: MyIcon,
 *   },
 * });
 * ```
 *
 * @alpha
 */
export const AppSidebarItemBlueprint = createExtensionBlueprint({
  kind: 'app-sidebar-item',
  attachTo: { id: 'app-root-wrapper:app/sidebar', input: 'sidebarItems' },
  output: [appSidebarItemDataRef],
  dataRefs: {
    content: appSidebarItemDataRef,
  },
  config: {
    schema: {
      priority: z => z.number().optional(),
      href: z => z.string().optional(),
    },
  },
  *factory(
    params: {
      id: string;
      title: string;
      titleKey?: string;
      href?: string;
      icon?: IconComponent;
      element?: React.ReactElement;
      priority?: number;
    },
    { config },
  ) {
    yield appSidebarItemDataRef({
      id: params.id,
      title: params.title,
      titleKey: params.titleKey,
      href: config.href ?? params.href,
      icon: params.icon,
      element: params.element,
      priority: config.priority ?? params.priority,
    });
  },
});
