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

import { appDrawerContentDataRef } from './appDrawerContentDataRef';

/**
 * Blueprint for plugins to contribute drawer content to the app drawer.
 *
 * The `resizable`, `defaultWidth`, and `priority` fields can be overridden by
 * deployers via `app-config.yaml` without changing plugin code:
 *
 * ```yaml
 * app:
 *   extensions:
 *     - app-drawer-content:app/my-drawer:
 *         config:
 *           defaultWidth: 600
 *           resizable: false
 * ```
 *
 * @example
 * ```
 * const myDrawer = AppDrawerContentBlueprint.make({
 *   name: 'my-drawer',
 *   params: {
 *     id: 'my-drawer',
 *     element: <MyDrawerContent />,
 *     resizable: true,
 *     defaultWidth: 500,
 *   },
 * });
 * ```
 *
 * @alpha
 */
export const AppDrawerContentBlueprint = createExtensionBlueprint({
  kind: 'app-drawer-content',
  attachTo: { id: 'app-root-wrapper:app/drawer', input: 'drawers' },
  output: [appDrawerContentDataRef],
  dataRefs: {
    content: appDrawerContentDataRef,
  },
  config: {
    schema: {
      defaultWidth: z => z.number().optional(),
      resizable: z => z.boolean().optional(),
      priority: z => z.number().optional(),
    },
  },
  *factory(
    params: {
      id: string;
      element: React.ReactElement;
      resizable?: boolean;
      defaultWidth?: number;
      priority?: number;
    },
    { config },
  ) {
    yield appDrawerContentDataRef({
      id: params.id,
      element: params.element,
      resizable: config.resizable ?? params.resizable,
      defaultWidth: config.defaultWidth ?? params.defaultWidth,
      priority: config.priority ?? params.priority,
    });
  },
});
