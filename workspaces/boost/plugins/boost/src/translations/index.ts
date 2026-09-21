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

import { boostTranslationRef } from './ref';

/**
 * Translation resource for the Boost plugin.
 * @public
 */
export const boostTranslations = createTranslationResource({
  ref: boostTranslationRef,
  translations: {
    de: () => import('./de'),
    es: () => import('./es'),
    fr: () => import('./fr'),
    it: () => import('./it'),
    ja: () => import('./ja'),
  },
});

/** @public */
const boostTranslation = TranslationBlueprint.make({
  params: {
    resource: boostTranslations,
  },
});

/**
 * Translation module for the Boost plugin.
 *
 * @public
 */
export const boostTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [boostTranslation],
});

export { boostTranslationRef };

export default boostTranslationsModule;
