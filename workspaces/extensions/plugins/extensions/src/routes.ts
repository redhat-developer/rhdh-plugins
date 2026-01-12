/*
 * Copyright The Backstage Authors
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

import { createRouteRef, createSubRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'extensions',
});

export const pluginsRouteRef = createSubRouteRef({
  id: 'extensions/plugins',
  path: '/plugins',
  parent: rootRouteRef,
});

export const pluginRouteRef = createSubRouteRef({
  id: 'extensions/plugin',
  path: '/plugins/:namespace/:name',
  parent: rootRouteRef,
});

export const pluginInstallRouteRef = createSubRouteRef({
  id: 'extensions/plugin/install',
  path: '/plugins/:namespace/:name/install',
  parent: rootRouteRef,
});

export const packagesRouteRef = createSubRouteRef({
  id: 'extensions/packages',
  path: '/packages',
  parent: rootRouteRef,
});

export const packageRouteRef = createSubRouteRef({
  id: 'extensions/package',
  path: '/packages/:namespace/:name',
  parent: rootRouteRef,
});

export const packageInstallRouteRef = createSubRouteRef({
  id: 'extensions/package/install',
  path: '/packages/:namespace/:name/install',
  parent: rootRouteRef,
});

export const collectionsRouteRef = createSubRouteRef({
  id: 'extensions/collections',
  path: '/collections',
  parent: rootRouteRef,
});

export const collectionRouteRef = createSubRouteRef({
  id: 'extensions/collection',
  path: '/collections/:namespace/:name',
  parent: rootRouteRef,
});

export const catalogTabRouteRef = createSubRouteRef({
  id: 'extensions/catalog',
  path: '/catalog',
  parent: rootRouteRef,
});

export const installedTabRouteRef = createSubRouteRef({
  id: 'extensions/installed',
  path: '/installed-packages',
  parent: rootRouteRef,
});

export const allRoutes = {
  rootRouteRef,
  pluginsRouteRef,
  pluginRouteRef,
  pluginInstallRouteRef,
  packagesRouteRef,
  packageRouteRef,
  packageInstallRouteRef,
  collectionsRouteRef,
  collectionRouteRef,
  catalogTabRouteRef,
  installedTabRouteRef,
};
