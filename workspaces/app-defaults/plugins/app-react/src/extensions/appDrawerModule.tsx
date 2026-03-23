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

import { AppDrawerProvider } from '../drawer/AppDrawerContext';
import { ApplicationDrawer } from '../drawer/ApplicationDrawer';
import { appDrawerContentDataRef } from './appDrawerContentDataRef';

/**
 * Wrapper extension that provides the AppDrawerContext **and** renders the
 * ApplicationDrawer inside it.
 *
 * Uses AppRootWrapperBlueprint.makeWithOverrides to stay aligned with the
 * blueprint API while adding a custom `drawers` input for content extensions.
 *
 * Because Backstage NFS renders app-root-element extensions as siblings
 * (outside) of app-root-wrapper providers, we cannot use a separate
 * app-root-element for the drawer. Combining both into one wrapper
 * guarantees the drawer lives inside the context provider.
 */
const appDrawerExtension = AppRootWrapperBlueprint.makeWithOverrides({
  name: 'drawer',
  inputs: {
    drawers: createExtensionInput([appDrawerContentDataRef]),
  },
  factory(originalFactory, { inputs }) {
    const contents = inputs.drawers.map(d => d.get(appDrawerContentDataRef));
    return originalFactory({
      component: ({ children }) => (
        <AppDrawerProvider>
          <ApplicationDrawer contents={contents}>{children}</ApplicationDrawer>
        </AppDrawerProvider>
      ),
    });
  },
});

/**
 * Frontend module that provides the app drawer system.
 * Registers a single wrapper extension that provides context and renders
 * the drawer, plus accepts drawer content contributions via inputs.
 *
 * @alpha
 */
export const appDrawerModule = createFrontendModule({
  pluginId: 'app',
  extensions: [appDrawerExtension],
});
