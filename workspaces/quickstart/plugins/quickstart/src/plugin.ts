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
import { PropsWithChildren } from 'react';
import { QuickstartButtonProps } from './components/QuickstartButton/QuickstartButton';
import { quickstartTranslationRef } from './translations';

export type { QuickstartButtonProps } from './components/QuickstartButton/QuickstartButton';

/**
 * Quick start plugin
 *
 * @public
 */
export const quickstartPlugin = createPlugin({
  id: 'quickstart',
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'fr', 'es'],
    resources: [quickstartTranslationRef],
  },
} as any);

/**
 * Quick start drawer provider
 *
 * @public
 */
export const QuickstartDrawerProvider: React.ComponentType<PropsWithChildren> =
  quickstartPlugin.provide(
    createComponentExtension({
      name: 'QuickstartDrawerProvider',
      component: {
        lazy: () =>
          import('./components/QuickstartDrawerProvider').then(
            m => m.QuickstartDrawerProvider,
          ),
      },
    }),
  );

/**
 * Quickstart Drawer Content component extension
 *
 * @public
 */
export const QuickstartDrawerContent = quickstartPlugin.provide(
  createComponentExtension({
    name: 'QuickstartDrawerContent',
    component: {
      lazy: () =>
        import('./components/QuickstartDrawerContent').then(
          m => m.QuickstartDrawerContent,
        ),
    },
  }),
);

/**
 * Quick start button for global header help dropdown
 *
 * @public
 */
export const QuickstartButton: React.ComponentType<QuickstartButtonProps> =
  quickstartPlugin.provide(
    createComponentExtension({
      name: 'QuickstartButton',
      component: {
        lazy: () =>
          import('./components/QuickstartButton/QuickstartButton').then(
            m => m.QuickstartButton,
          ),
      },
    }),
  );
