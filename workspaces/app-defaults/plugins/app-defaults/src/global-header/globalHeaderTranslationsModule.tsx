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

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';

import { globalHeaderTranslations } from './translations';

const globalHeaderTranslation = TranslationBlueprint.make({
  name: 'global-header-translations',
  params: {
    resource: globalHeaderTranslations,
  },
});

/**
 * App module that registers global header translations.
 * @public
 */
export const globalHeaderTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [globalHeaderTranslation],
});
