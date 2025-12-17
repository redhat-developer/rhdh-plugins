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
  createComponentExtension,
} from '@backstage/core-plugin-api';

/**
 * Test Drawer Plugin
 *
 * @public
 */
export const testDrawerPlugin = createPlugin({
  id: 'test-drawer',
});

/**
 * Test Drawer Provider component extension
 *
 * @public
 */
export const TestDrawerProvider = testDrawerPlugin.provide(
  createComponentExtension({
    name: 'TestDrawerProvider',
    component: {
      lazy: () =>
        import('./components/TestDrawerProvider').then(
          m => m.TestDrawerProvider,
        ),
    },
  }),
);

/**
 * Test Drawer Content component extension
 *
 * @public
 */
export const TestDrawerContent = testDrawerPlugin.provide(
  createComponentExtension({
    name: 'TestDrawerContent',
    component: {
      lazy: () =>
        import('./components/TestDrawerContent').then(m => m.TestDrawerContent),
    },
  }),
);

/**
 * Test Drawer Button component extension
 *
 * @public
 */
export const TestDrawerButton = testDrawerPlugin.provide(
  createComponentExtension({
    name: 'TestDrawerButton',
    component: {
      lazy: () =>
        import('./components/TestDrawerButton').then(m => m.TestDrawerButton),
    },
  }),
);

