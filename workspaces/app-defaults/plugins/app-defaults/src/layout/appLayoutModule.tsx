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

import { configApiRef, useApi } from '@backstage/core-plugin-api';
import {
  createExtensionInput,
  createFrontendModule,
  useAnalytics,
} from '@backstage/frontend-plugin-api';
import { AppRootWrapperBlueprint } from '@backstage/plugin-app-react';
import { BUIProvider } from '@backstage/ui';
import type { ReactNode } from 'react';

import {
  ApplicationDrawer,
  appDrawerContentDataRef,
  type AppDrawerContent,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import { applyDefaultSidebarPinState } from '../sidebar/applyDefaultSidebarPinState';

function AppLayoutRoot(props: {
  children?: ReactNode;
  contents: AppDrawerContent[];
}) {
  const { children, contents } = props;
  const configApi = useApi(configApiRef);
  // Synchronous seed: SidebarPage initializes pin state from localStorage
  // during its first render, so this must run before children mount.
  applyDefaultSidebarPinState(configApi);

  return (
    <BUIProvider useAnalytics={useAnalytics}>
      <ApplicationDrawer contents={contents}>{children}</ApplicationDrawer>
    </BUIProvider>
  );
}

/**
 * App-root layout wrapper that provides BUI routing and analytics context to
 * the application and hosts the extensible application drawer.
 *
 * The wrapper keeps the existing `app-root-wrapper:app/drawer` extension ID so
 * existing `AppDrawerContentBlueprint` contributions continue to attach.
 *
 * It also seeds the sidebar pin default from `app.sidebar.defaultPinned`
 * before `SidebarPage` (a child of this wrapper) reads localStorage.
 *
 * @public
 */
export const appLayoutExtension = AppRootWrapperBlueprint.makeWithOverrides({
  name: 'drawer',
  inputs: {
    drawers: createExtensionInput([appDrawerContentDataRef]),
  },
  factory(originalFactory, { inputs }) {
    const contents = inputs.drawers.map(d => d.get(appDrawerContentDataRef));
    return originalFactory({
      component: ({ children }) => (
        <AppLayoutRoot contents={contents}>{children}</AppLayoutRoot>
      ),
    });
  },
});

/**
 * Frontend module that provides the app-level layout and drawer wrapper.
 *
 * @public
 */
export const appLayoutModule = createFrontendModule({
  pluginId: 'app',
  extensions: [appLayoutExtension],
});

/**
 * Backward-compatible alias for the app layout wrapper extension.
 *
 * @deprecated Use `appLayoutExtension` instead.
 * @public
 */
export const appDrawerExtension = appLayoutExtension;

/**
 * Backward-compatible alias for the app layout module.
 *
 * @deprecated Use `appLayoutModule` instead.
 * @public
 */
export const appDrawerModule = appLayoutModule;
