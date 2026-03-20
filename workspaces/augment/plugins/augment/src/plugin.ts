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
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
  configApiRef,
  identityApiRef,
  IconComponent,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { augmentApiRef, AugmentApiClient } from './api';
import { AugmentIconComponent } from './components/AugmentIcon';

/**
 * Augment plugin
 * @public
 */
export const augmentPlugin = createPlugin({
  id: 'augment',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: augmentApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        configApi: configApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, fetchApi, configApi, identityApi }) =>
        new AugmentApiClient({
          discoveryApi,
          fetchApi,
          configApi,
          identityApi,
        }),
    }),
  ],
});

/**
 * Augment Page
 * @public
 */
export const AugmentPage = augmentPlugin.provide(
  createRoutableExtension({
    name: 'AugmentPage',
    component: () =>
      import('./components/AugmentPage').then(m => m.AugmentPage),
    mountPoint: rootRouteRef,
  }),
);

/**
 * Augment Icon
 * @public
 */
export const AugmentIcon: IconComponent = AugmentIconComponent;
