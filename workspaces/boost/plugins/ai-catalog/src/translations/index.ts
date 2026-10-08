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

import { createTranslationResource } from '@backstage/core-plugin-api/alpha';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';

import { aiCatalogTranslationRef } from './ref';

/**
 * Translation resource for the AI Catalog plugin.
 * @public
 */
export const aiCatalogTranslations = createTranslationResource({
  ref: aiCatalogTranslationRef,
  translations: {
    de: () => import('./de'),
    es: () => import('./es'),
    fr: () => import('./fr'),
    it: () => import('./it'),
    ja: () => import('./ja'),
  },
});

/** @public */
const aiCatalogTranslation = TranslationBlueprint.make({
  params: {
    resource: aiCatalogTranslations,
  },
});

/**
 * Translation module for the AI Catalog plugin.
 *
 * @public
 */
export const aiCatalogTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [aiCatalogTranslation],
});

export { aiCatalogTranslationRef };

export default aiCatalogTranslationsModule;
