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
} from '@backstage/core-plugin-api';
import { globalFloatingActionButtonTranslationRef } from './translations';

/**
 * Global Floating Action Button Plugin
 *
 * @public
 */
export const globalFloatingActionButtonPlugin = createPlugin({
  id: 'global-floating-action-button',
});

/**
 * Dynamic Global Floating Action Button Plugin
 *
 * @public
 */
export const dynamicGlobalFloatingActionButtonPlugin = createPlugin({
  id: 'dynamic-global-floating-action-button',
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'es', 'fr', 'it', 'ja'],
    resources: [globalFloatingActionButtonTranslationRef],
  },
} as any);

/**
 * Global Floating Action Button
 *
 * @public
 */
export const GlobalFloatingActionButton =
  globalFloatingActionButtonPlugin.provide(
    createComponentExtension({
      name: 'GlobalFloatingActionButton',
      component: {
        lazy: () =>
          import('./components/GlobalFloatingActionButton').then(
            m => m.GlobalFloatingActionButton,
          ),
      },
    }),
  );

/**
 * Dynamic Global Floating Action Button
 *
 * @public
 */
export const DynamicGlobalFloatingActionButton: React.ComponentType =
  dynamicGlobalFloatingActionButtonPlugin.provide(
    createComponentExtension({
      name: 'DynamicGlobalFloatingActionButton',
      component: {
        lazy: () =>
          import('./components/DynamicGlobalFloatingActionButton').then(
            m => m.DynamicGlobalFloatingActionButton,
          ),
      },
    }),
  );

/**
 * Null Component
 *
 * @public
 */
export const NullComponent: React.ComponentType =
  dynamicGlobalFloatingActionButtonPlugin.provide(
    createComponentExtension({
      name: 'NullComponent',
      component: {
        lazy: () =>
          import('./components/NullComponent').then(m => m.NullComponent),
      },
    }),
  );

/**
 * Translation resource for the global floating action button plugin
 *
 * @public
 */
export {
  globalFloatingActionButtonTranslations,
  globalFloatingActionButtonTranslationRef,
} from './translations';
