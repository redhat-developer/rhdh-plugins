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

import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { translationsTestTranslationRef } from './ref';

/**
 * de translation for plugin.translations-test.
 * @public
 */
const quickstartTranslationDe = createTranslationMessages({
  ref: translationsTestTranslationRef,
  messages: {
    'page.title': 'Übersetzungstest-Plugin',
    'page.subtitle':
      'Ein Plugin zum Testen der Übersetzungsfunktionalität und der i18next-Funktionen',
    'essentials.key': 'Wert des Schlüssels',
    'essentials.look.deep': 'Wert der detaillierten Analyse',
    'interpolation.key': '{{what}} ist {{how}}',
    'formatting.intlNumber': 'Einige {{val, number}}',
    'context.friend': 'Ein Freund',
    'context.friend_male': 'Ein fester Freund',
    'context.friend_female': 'Eine feste Freundin',
    'objects.tree.res': 'hat {{something}} hinzugefügt',
  },
});

export default quickstartTranslationDe;
