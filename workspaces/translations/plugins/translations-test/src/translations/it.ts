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
 * Italian translation for translations-test.
 * @public
 */
const quickstartTranslationIt = createTranslationMessages({
  ref: translationsTestTranslationRef,
  messages: {
    'page.title': 'Plugin di prova delle traduzioni',
    'page.subtitle':
      'Plugin per testare la funzionalità delle traduzioni e le caratteristiche di i18next',
    'essentials.key': 'valore della chiave',
    'essentials.look.deep': "valore dell'analisi approfondita",
    'interpolation.key': '{{what}} è {{how}}',
    'interpolation.nested.key': '{{what}} è {{how.value}}',
    'interpolation.complex.message': 'Ecco un {{link}}.',
    'interpolation.complex.linkText': 'link',
    'formatting.intlNumber': 'Alcuni {{val, number}}',
    'formatting.intlNumberWithOptions':
      'Alcuni {{val, number(minimumFractionDigits: 2)}}',
    'formatting.intlDateTime': 'Il {{val, datetime}}',
    'formatting.intlRelativeTime': 'Lorem {{val, relativetime}}',
    'formatting.intlRelativeTimeWithOptions':
      'Lorem {{val, relativetime(quarter)}}',
    'formatting.intlRelativeTimeWithOptionsExplicit':
      'Lorem {{val, relativetime(range: quarter; style: narrow;)}}',
    'plurals.key_zero': 'zero',
    'plurals.key_one': 'uno',
    'plurals.key_two': 'due',
    'plurals.key_few': 'pochi',
    'plurals.key_many': 'molti',
    'plurals.key_other': 'altro',
    'plurals.keyWithCount_one': '{{count}} elemento',
    'plurals.keyWithCount_other': '{{count}} elementi',
    'context.friend': 'Un amico',
    'context.friend_male': 'Un fidanzato',
    'context.friend_female': 'Una ragazza',
    'objects.tree.res': 'aggiunto {{something}}',
  },
});

export default quickstartTranslationIt;
