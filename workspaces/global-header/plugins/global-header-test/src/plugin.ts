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

export type { TestButtonProps } from './components/TestButton';
export type { TestHeaderProps } from './components/TestHeader';
export type { CrashButtonProps } from './components/CrashButton';
export type { CrashHeaderProps } from './components/CrashHeader';

/**
 * Global Header Test Plugin
 *
 * @public
 */
export const globalHeaderTestPlugin = createPlugin({
  id: 'global-header-test',
});

/**
 * @public
 */
export const TestButton = globalHeaderTestPlugin.provide(
  createComponentExtension({
    name: 'TestButton',
    component: {
      lazy: () => import('./components/TestButton').then(m => m.TestButton),
    },
  }),
);

/**
 * @public
 */
export const TestHeader = globalHeaderTestPlugin.provide(
  createComponentExtension({
    name: 'TestHeader',
    component: {
      lazy: () => import('./components/TestHeader').then(m => m.TestHeader),
    },
  }),
);

/**
 * @public
 */
export const CrashButton = globalHeaderTestPlugin.provide(
  createComponentExtension({
    name: 'CrashButton',
    component: {
      lazy: () => import('./components/CrashButton').then(m => m.CrashButton),
    },
  }),
);

/**
 * @public
 */
export const CrashHeader = globalHeaderTestPlugin.provide(
  createComponentExtension({
    name: 'CrashHeader',
    component: {
      lazy: () => import('./components/CrashHeader').then(m => m.CrashHeader),
    },
  }),
);
