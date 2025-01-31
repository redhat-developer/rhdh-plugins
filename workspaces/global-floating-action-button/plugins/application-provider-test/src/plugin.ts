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
export const CrashProvider = applicationProviderTestPlugin.provide(
  createComponentExtension({
    name: 'CrashProvider',
    component: {
      lazy: () =>
        import('./components/CrashProvider').then(m => m.CrashProvider),
    },
  }),
);

/**
 * @public
 */
export const TestProviderOne = applicationProviderTestPlugin.provide(
  createComponentExtension({
    name: 'TestProviderOne',
    component: {
      lazy: () =>
        import('./components/TestProviderOne').then(m => m.TestProviderOne),
    },
  }),
);

/**
 * @public
 */
export const TestProviderTwo = applicationProviderTestPlugin.provide(
  createComponentExtension({
    name: 'TestProviderTwo',
    component: {
      lazy: () =>
        import('./components/TestProviderTwo').then(m => m.TestProviderTwo),
    },
  }),
);

/**
 * @public
 */
export const TestCardOne = applicationProviderTestPlugin.provide(
  createComponentExtension({
    name: 'TestCardOne',
    component: {
      lazy: () => import('./components/TestCardOne').then(m => m.TestCardOne),
    },
  }),
);

/**
 * @public
 */
export const TestCardTwo = applicationProviderTestPlugin.provide(
  createComponentExtension({
    name: 'TestCardTwo',
    component: {
      lazy: () => import('./components/TestCardTwo').then(m => m.TestCardTwo),
    },
  }),
);

/**
 * @public
 */
export const TestPage = applicationProviderTestPlugin.provide(
  createRoutableExtension({
    name: 'TestPage',
    component: () => import('./components/TestPage').then(m => m.TestPage),
    mountPoint: rootRouteRef,
  }),
);

/**
 * @public
 * @deprecated please use `TestProviderOne` and `TestProviderTwo` instead
 */
export const CountProvider = TestProviderOne;

/**
 * @public
 * @deprecated please use `TestCardOne` and `TestCardTwo` instead
 */
export const CountCard = TestCardOne;

/**
 * @public
 * @deprecated please use `TestPage` instead
 */
export const CountPage = TestPage;
