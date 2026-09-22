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
    'essentials.look.deep': 'Wert der eingehenden Prüfung',
    'interpolation.key': '{{what}} ist {{how}}',
    'formatting.intlNumber': 'Einige {{val, number}}',
    'context.friend': 'Ein Freund',
    'context.friend_male': 'Ein Freund',
    'context.friend_female': 'Eine Freundin',
    'objects.tree.res': 'hat {{something}} hinzugefügt',
      'formatting.intlDateTime': 'Am {{val, datetime}}',
    'formatting.intlNumberWithOptions': 'Einige {{val, number(minimumFractionDigits: 2)}}',
    'formatting.intlRelativeTime': 'Lorem {{val, relativetime}}',
    'formatting.intlRelativeTimeWithOptions': 'Lorem {{val, relativetime(quartal)}}',
    'formatting.intlRelativeTimeWithOptionsExplicit': 'Lorem {{val, relativetime(range: quarter; style: narrow;)}}',
    'interpolation.complex.linkText': 'Link',
    'interpolation.complex.message': 'Hier ist ein {{link}}.',
    'interpolation.nested.key': '{{what}} ist {{how.value}}',
    'plurals.keyWithCount_one': '{{count}} Element',
    'plurals.keyWithCount_other': '{{count}} Elemente',
    'plurals.key_few': 'wenige',
    'plurals.key_many': 'viele',
    'plurals.key_one': 'eins',
    'plurals.key_other': 'andere',
    'plurals.key_two': 'zwei',
    'plurals.key_zero': 'null',
},
});

export default quickstartTranslationDe;
