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
import { AppRootWrapperBlueprint } from '@backstage/plugin-app-react';

import { SidebarContent } from './Sidebar';
import { SidebarItemsProvider } from './SidebarItemsContext';
import { appSidebarGroupDataRef } from './extensions/appSidebarGroupDataRef';
import { appSidebarItemDataRef } from './extensions/appSidebarItemDataRef';

export * from './extensions';

/**
 * Wrapper extension that provides contributed sidebar items and groups via
 * React context to the sidebar renderer.
 *
 * Uses AppRootWrapperBlueprint.makeWithOverrides to declare `sidebarItems`
 * and `sidebarGroups` inputs, following the same pattern as appDrawerModule.
 */
const appSidebarExtension = AppRootWrapperBlueprint.makeWithOverrides({
  name: 'sidebar',
  inputs: {
    sidebarItems: createExtensionInput([appSidebarItemDataRef]),
    sidebarGroups: createExtensionInput([appSidebarGroupDataRef]),
  },
  factory(originalFactory, { inputs }) {
    const items = inputs.sidebarItems.map(i => i.get(appSidebarItemDataRef));
    const groups = inputs.sidebarGroups.map(g => g.get(appSidebarGroupDataRef));
    return originalFactory({
      component: ({ children }) => (
        <SidebarItemsProvider items={items} groups={groups}>
          {children}
        </SidebarItemsProvider>
      ),
    });
  },
});

export const appSidebarModule = createFrontendModule({
  pluginId: 'app',
  extensions: [appSidebarExtension, SidebarContent],
});
