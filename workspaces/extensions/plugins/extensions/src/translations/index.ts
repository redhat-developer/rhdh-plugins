/*
 * Copyright The Backstage Authors
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
import { extensionsTranslationRef } from './ref';

/**
 * Translation Resource for extensions
 * @alpha
 */
export const extensionsTranslations = createTranslationResource({
  ref: extensionsTranslationRef,
  translations: {
    de: () => import('./de'),
    fr: () => import('./fr'),
    es: () => import('./es'),
    it: () => import('./it'),
  },
});

export { extensionsTranslationRef } from './ref';
