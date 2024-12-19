/*
 * Copyright 2024 The Backstage Authors
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
import { createRouteRef } from '@backstage/core-plugin-api';

const testRouteRef = createRouteRef({
  id: 'test-global-floating-action-button',
});

export const globalFloatingActionButtonPlugin = createPlugin({
  id: 'global-floating-action-button',
  // routes: {
  //   root: rootRouteRef,
  // },
});

export const TestFloatingActionButtonPage =
  globalFloatingActionButtonPlugin.provide(
    createRoutableExtension({
      name: 'TestFloatingActionButtonPage',
      component: () => import('./components').then(m => m.ExampleComponent),
      mountPoint: testRouteRef,
    }),
  );

/**
 * @public
 * Floating Button Component
 */
export const GlobalFloatingButton = globalFloatingActionButtonPlugin.provide(
  createComponentExtension({
    name: 'GlobalFloatingButton',
    component: {
      lazy: () => import('./components').then(m => m.FloatingButton),
    },
  }),
);
