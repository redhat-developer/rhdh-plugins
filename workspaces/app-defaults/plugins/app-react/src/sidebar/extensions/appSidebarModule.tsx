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

import { ApplicationSidebar } from '../components/ApplicationSidebar';
import { appSidebarItemDataRef } from './appSidebarItemDataRef';

/**
 * Nav content extension that renders the ApplicationSidebar with support
 * for plugin-contributed sidebar items via the `items` input.
 *
 * Uses NavContentBlueprint.makeWithOverrides to stay aligned with the
 * blueprint API while adding a custom `items` input for sidebar item
 * extensions.
 */
const appSidebarExtension = NavContentBlueprint.makeWithOverrides({
  name: 'sidebar',
  inputs: {
    items: createExtensionInput([appSidebarItemDataRef]),
  },
  factory(originalFactory, { inputs }) {
    const items = inputs.items.map(i => i.get(appSidebarItemDataRef));
    return originalFactory({
      component: ({ navItems }) => (
        <ApplicationSidebar navItems={navItems} items={items} />
      ),
    });
  },
});

/**
 * Frontend module that provides the app sidebar system.
 * Registers a nav content extension that renders the sidebar and accepts
 * sidebar item contributions via inputs.
 *
 * @alpha
 */
export const appSidebarModule = createFrontendModule({
  pluginId: 'app',
  extensions: [appSidebarExtension],
});
