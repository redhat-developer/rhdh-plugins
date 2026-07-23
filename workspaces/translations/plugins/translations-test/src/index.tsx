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
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import ScienceIcon from '@mui/icons-material/Science';
import {
  translationsTestTranslationRef,
  translationsTestTranslations,
} from './translations';

const translationsTestPage = PageBlueprint.make({
  params: {
    path: '/translations-test',
    title: 'Translations Test',
    icon: <ScienceIcon />,
    noHeader: true,
    loader: () =>
      import('./components/TranslationsTestPage').then(m => (
        <m.TranslationsTestPage />
      )),
  },
});

const translationsTestTranslation = TranslationBlueprint.make({
  name: 'translations-test-translations',
  params: {
    resource: translationsTestTranslations,
  },
});

/** @public */
export default createFrontendPlugin({
  pluginId: 'translations-test',
  extensions: [translationsTestPage, translationsTestTranslation],
});

export { translationsTestTranslationRef, translationsTestTranslations };
