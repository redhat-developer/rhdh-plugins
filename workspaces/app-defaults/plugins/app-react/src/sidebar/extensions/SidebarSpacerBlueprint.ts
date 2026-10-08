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

import { SidebarSpace, SidebarSpacer } from '@backstage/core-components';
import { createExtensionBlueprint } from '@backstage/frontend-plugin-api';
import { z } from 'zod';

import { sidebarElementDataRef } from './sidebarElementDataRef';

/**
 * Blueprint for plugins to insert a spacer into the app sidebar.
 *
 * The spacer is a custom sidebar element (see {@link SidebarElementBlueprint})
 * rendered in the slot determined by `priority` (higher first). By default
 * it is a fixed gap (`SidebarSpacer` from `@backstage/core-components`).
 * With `grow: true` it renders the flexible `SidebarSpace` instead, which
 * pushes everything with a lower priority to the bottom of the sidebar.
 * `priority` and `grow` can be overridden by deployers via `app-config.yaml`.
 *
 * @example
 * ```
 * const bottomSpacer = SidebarSpacerBlueprint.make({
 *   name: 'bottom',
 *   params: { priority: -30, grow: true },
 * });
 * ```
 *
 * @public
 */
export const SidebarSpacerBlueprint = createExtensionBlueprint({
  kind: 'sidebar-spacer',
  attachTo: { id: 'nav-content:app/sidebar', input: 'elements' },
  output: [sidebarElementDataRef],
  dataRefs: {
    element: sidebarElementDataRef,
  },
  configSchema: {
    priority: z.number().optional(),
    grow: z.boolean().optional(),
  },
  *factory(params: { priority?: number; grow?: boolean }, { config, node }) {
    const grow = config.grow ?? params.grow ?? false;
    yield sidebarElementDataRef({
      id: node.spec.id,
      component: grow ? SidebarSpace : SidebarSpacer,
      priority: config.priority ?? params.priority,
    });
  },
});
