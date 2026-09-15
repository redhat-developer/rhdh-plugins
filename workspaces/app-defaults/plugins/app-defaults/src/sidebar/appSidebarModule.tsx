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
  createExtensionInput,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import {
  sidebarItemDataRef,
  sidebarItemGroupDataRef,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import { AppSidebar } from './AppSidebar';

/**
 * Nav content extension that renders the RHDH sidebar from contributed
 * `SidebarItemBlueprint` and `SidebarItemGroupBlueprint` extensions.
 *
 * Extension ID: `nav-content:app/sidebar`. Both blueprints from
 * `@red-hat-developer-hub/backstage-plugin-app-react` attach here by
 * default, so plugins only need to declare their items and groups.
 *
 * @public
 */
export const appSidebarExtension = NavContentBlueprint.makeWithOverrides({
  name: 'sidebar',
  inputs: {
    items: createExtensionInput([sidebarItemDataRef]),
    groups: createExtensionInput([sidebarItemGroupDataRef]),
  },
  factory(originalFactory, { inputs }) {
    const items = inputs.items.map(i => i.get(sidebarItemDataRef));
    const groups = inputs.groups.map(g => g.get(sidebarItemGroupDataRef));
    return originalFactory({
      component: ({ navItems }) => (
        <AppSidebar items={items} groups={groups} navItems={navItems} />
      ),
    });
  },
});

/**
 * Frontend module that provides the priority-ordered app sidebar.
 * Registers the nav content extension that accepts sidebar item and group
 * contributions via inputs.
 *
 * @public
 */
export const appSidebarModule = createFrontendModule({
  pluginId: 'app',
  extensions: [appSidebarExtension],
});
