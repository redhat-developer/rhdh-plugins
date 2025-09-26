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
  createComponentExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

/**
 * @public
 */
export const translationsPlugin = createPlugin({
  id: 'translations',
  routes: {
    root: rootRouteRef,
  },
});

/**
 * @public
 */
export const TranslationsPage = translationsPlugin.provide(
  createRoutableExtension({
    name: 'TranslationsPage',
    component: () =>
      import('./components/TranslationsPage').then(m => m.TranslationsPage),
    mountPoint: rootRouteRef,
  }),
);

/**
 * Export Translation Keys
 * @public
 */
export const ExportTranslationKeys = translationsPlugin.provide(
  createComponentExtension({
    name: 'ExportTranslationKeys',
    component: {
      lazy: () =>
        import('./components/ExportTranslationKeys').then(
          m => m.ExportTranslationKeys,
        ),
    },
  }),
);
