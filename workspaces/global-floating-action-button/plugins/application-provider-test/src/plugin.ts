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
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

/**
 * @public
 */
export const applicationProviderTestPlugin = createPlugin({
  id: 'application-provider-test',
});

/**
 * @public
 */
export const CountProvider = applicationProviderTestPlugin.provide(
  createComponentExtension({
    name: 'CountProvider',
    component: {
      lazy: () =>
        import('./components/CountProvider').then(m => m.CountProvider),
    },
  }),
);

/**
 * @public
 */
export const CountCard = applicationProviderTestPlugin.provide(
  createComponentExtension({
    name: 'CountCard',
    component: {
      lazy: () => import('./components/CountCard').then(m => m.CountCard),
    },
  }),
);

/**
 * @public
 */
export const CountPage = applicationProviderTestPlugin.provide(
  createRoutableExtension({
    name: 'CountPage',
    component: () => import('./components/CountPage').then(m => m.CountPage),
    mountPoint: rootRouteRef,
  }),
);
