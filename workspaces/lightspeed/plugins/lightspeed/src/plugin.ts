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

import '@patternfly/react-core/dist/styles/base-no-reset.css';
import '@patternfly/chatbot/dist/css/main.css';

import { PropsWithChildren } from 'react';

import {
  configApiRef,
  createApiFactory,
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { lightspeedApiRef } from './api/api';
import { LightspeedApiClient } from './api/LightspeedApiClient';
import { rootRouteRef } from './routes';

/**
 * Lightspeed Plugin
 * @public
 */
export const lightspeedPlugin = createPlugin({
  id: 'lightspeed',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: lightspeedApiRef,
      deps: {
        configApi: configApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ configApi, fetchApi }) =>
        new LightspeedApiClient({ configApi, fetchApi }),
    }),
  ],
});

/**
 * Lightspeed Page
 * @public
 */
export const LightspeedPage = lightspeedPlugin.provide(
  createRoutableExtension({
    name: 'LightspeedPage',
    component: () =>
      import('./components/LightspeedPage').then(m => m.LightspeedPage),
    mountPoint: rootRouteRef,
  }),
);

/**
 * Lightspeed Drawer Provider
 *
 * @public
 */
export const LightspeedDrawerProvider: React.ComponentType<PropsWithChildren> =
  lightspeedPlugin.provide(
    createComponentExtension({
      name: 'LightspeedDrawerProvider',
      component: {
        lazy: () =>
          import('./components/LightspeedDrawerProvider').then(
            m => m.LightspeedDrawerProvider,
          ),
      },
    }),
  );

/**
 * Lightspeed FAB for global floating action button fot LightspeedAI
 *
 * @public
 */
export const LightspeedFAB: React.ComponentType = lightspeedPlugin.provide(
  createComponentExtension({
    name: 'LightspeedFAB',
    component: {
      lazy: () =>
        import('./components/LightspeedFAB').then(m => m.LightspeedFAB),
    },
  }),
);

/**
 * Lightspeed Drawer State Exposer exposes its drawer state
 *
 * @public
 */
export const LightspeedDrawerStateExposer = lightspeedPlugin.provide(
  createComponentExtension({
    name: 'LightspeedDrawerStateExposer',
    component: {
      lazy: () =>
        import('./components/LightspeedDrawerStateExposer').then(
          m => m.LightspeedDrawerStateExposer,
        ),
    },
  }),
);

/**
 * Lightspeed Chat Container component extension
 *
 * @public
 */
export const LightspeedChatContainer = lightspeedPlugin.provide(
  createComponentExtension({
    name: 'LightspeedChatContainer',
    component: {
      lazy: () =>
        import('./components/LightspeedChatContainer').then(
          m => m.LightspeedChatContainer,
        ),
    },
  }),
);
