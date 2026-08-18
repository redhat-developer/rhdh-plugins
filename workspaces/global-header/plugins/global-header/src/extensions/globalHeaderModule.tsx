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

import { lazy, Suspense, useMemo } from 'react';
import type { PropsWithChildren } from 'react';

import {
  createExtensionInput,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import {
  AppRootWrapperBlueprint,
  IconBundleBlueprint,
} from '@backstage/plugin-app-react';
import { ErrorBoundary } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';

import { globalHeaderSystemIcons } from '../icons/globalHeaderSystemIcons';

import { GlobalHeaderProvider } from './GlobalHeaderContext';
import {
  globalHeaderComponentDataRef,
  globalHeaderMenuItemDataRef,
} from './dataRefs';
import type {
  GlobalHeaderComponentData,
  GlobalHeaderMenuItemData,
} from '../types';
import { readConfigMenuItems } from '../utils/readConfigMenuItems';
import { readConfigComponents } from '../utils/readConfigComponents';

// AppRootWrapperBlueprint has no loader — lazy the AppBar shell so MUI stays
// off the root federation sync chunk (same idea as PageBlueprint loaders).
const LazyGlobalHeader = lazy(() =>
  import('../components/GlobalHeader').then(m => ({ default: m.GlobalHeader })),
);

function GlobalHeaderWrapper({
  extensionComponents,
  extensionMenuItems,
  children,
}: PropsWithChildren<{
  extensionComponents: GlobalHeaderComponentData[];
  extensionMenuItems: GlobalHeaderMenuItemData[];
}>) {
  const configApi = useApi(configApiRef);
  const configComponents = useMemo(
    () => readConfigComponents(configApi),
    [configApi],
  );
  const allComponents = useMemo(
    () =>
      [...extensionComponents, ...configComponents].sort(
        (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
      ),
    [extensionComponents, configComponents],
  );
  const configMenuItems = useMemo(
    () => readConfigMenuItems(configApi),
    [configApi],
  );
  const allMenuItems = useMemo(
    () =>
      [...extensionMenuItems, ...configMenuItems].sort(
        (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
      ),
    [extensionMenuItems, configMenuItems],
  );
  return (
    <GlobalHeaderProvider components={allComponents} menuItems={allMenuItems}>
      <Suspense fallback={null}>
        <ErrorBoundary>
          <LazyGlobalHeader />
        </ErrorBoundary>
      </Suspense>
      {children}
    </GlobalHeaderProvider>
  );
}

/**
 * Wrapper extension that collects header component and menu item extensions,
 * merges config-driven items from `globalHeader.components` and
 * `globalHeader.menuItems`, and renders them in a global header bar at the
 * top of the app.
 */
const globalHeaderExtension = AppRootWrapperBlueprint.makeWithOverrides({
  name: 'global-header',
  inputs: {
    components: createExtensionInput([globalHeaderComponentDataRef]),
    menuItems: createExtensionInput([globalHeaderMenuItemDataRef]),
  },
  factory(originalFactory, { inputs }) {
    const extensionComponents = inputs.components
      .map(c => c.get(globalHeaderComponentDataRef))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    const extensionMenuItems = inputs.menuItems.map(m =>
      m.get(globalHeaderMenuItemDataRef),
    );

    return originalFactory({
      component: ({ children }) => (
        <GlobalHeaderWrapper
          extensionComponents={extensionComponents}
          extensionMenuItems={extensionMenuItems}
        >
          {children}
        </GlobalHeaderWrapper>
      ),
    });
  },
});

const globalHeaderIconsExtension = IconBundleBlueprint.make({
  name: 'global-header-icons',
  params: {
    icons: globalHeaderSystemIcons,
  },
});

/**
 * Frontend module that provides the global header system.
 * Registers a wrapper extension with input slots for toolbar components
 * and dropdown menu items.
 *
 * Uses `pluginId: 'app'` because the `wrappers` input on `app/root` is
 * marked `internal: true`, restricting attachments to extensions from the
 * `app` plugin.
 *
 * @public
 */
export const globalHeaderModule = createFrontendModule({
  pluginId: 'app',
  extensions: [globalHeaderIconsExtension, globalHeaderExtension],
});
