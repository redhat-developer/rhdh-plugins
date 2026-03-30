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
  createExtensionBlueprint,
  createExtensionInput,
} from '@backstage/frontend-plugin-api';
import type { IconComponent } from '@backstage/frontend-plugin-api';

import { appSidebarGroupDataRef } from './appSidebarGroupDataRef';
import { appSidebarItemDataRef } from './appSidebarItemDataRef';

/**
 * Blueprint for plugins to contribute a sidebar group with child nav items.
 *
 * Child items attach to this group using `AppSidebarItemBlueprint.make` with
 * `attachTo: group.inputs.children`:
 *
 * ```ts
 * const group = AppSidebarGroupBlueprint.make({
 *   name: 'platform',
 *   params: {
 *     id: 'platform',
 *     title: 'Platform',
 *     icon: CategoryIcon,
 *   },
 * });
 *
 * const child = AppSidebarItemBlueprint.make({
 *   name: 'clusters',
 *   attachTo: group.inputs.children,
 *   params: {
 *     id: 'clusters',
 *     title: 'Clusters',
 *     href: '/clusters',
 *     icon: CloudIcon,
 *   },
 * });
 * ```
 *
 * @alpha
 */
export const AppSidebarGroupBlueprint = createExtensionBlueprint({
  kind: 'app-sidebar-group',
  attachTo: { id: 'app-root-wrapper:app/sidebar', input: 'sidebarGroups' },
  output: [appSidebarGroupDataRef],
  dataRefs: {
    group: appSidebarGroupDataRef,
  },
  inputs: {
    children: createExtensionInput([appSidebarItemDataRef]),
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
      titleKey?: string;
      icon?: IconComponent;
      priority?: number;
    },
    { config, inputs },
  ) {
    const children = inputs.children.map(c => c.get(appSidebarItemDataRef));
    yield appSidebarGroupDataRef({
      id: params.id,
      title: params.title,
      titleKey: params.titleKey,
      icon: params.icon,
      children,
      priority: config.priority ?? params.priority,
    });
  },
});
