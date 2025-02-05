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
  id: 'marketplace',
});

export const pluginsRouteRef = createSubRouteRef({
  id: 'marketplace/plugins',
  path: '/plugins',
  parent: rootRouteRef,
});

export const pluginRouteRef = createSubRouteRef({
  id: 'marketplace/plugin',
  path: '/plugins/:name',
  parent: rootRouteRef,
});

export const pluginInstallRouteRef = createSubRouteRef({
  id: 'marketplace/plugin/install',
  path: '/plugins/:name/install',
  parent: rootRouteRef,
});

export const packagesRouteRef = createSubRouteRef({
  id: 'marketplace/packages',
  path: '/packages',
  parent: rootRouteRef,
});

export const packageRouteRef = createSubRouteRef({
  id: 'marketplace/package',
  path: '/packages/:name',
  parent: rootRouteRef,
});

export const packageInstallRouteRef = createSubRouteRef({
  id: 'marketplace/package/install',
  path: '/packages/:name/install',
  parent: rootRouteRef,
});

export const collectionsRouteRef = createSubRouteRef({
  id: 'marketplace/collections',
  path: '/collections',
  parent: rootRouteRef,
});

export const collectionRouteRef = createSubRouteRef({
  id: 'marketplace/collection',
  path: '/collections/:name',
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
};
