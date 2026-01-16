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
 * fr translation for plugin.translations-test.
 * @public
 */
const quickstartTranslationFr = createTranslationMessages({
  ref: translationsTestTranslationRef,
  messages: {
    'page.title': 'Plugin de test de traductions',
    'page.subtitle':
      "Un plugin pour tester les fonctionnalités de traduction et les fonctionnalités d'i18next",
    'essentials.key': 'valeur de la clé',
    'essentials.look.deep': 'valeur look deep',
    'interpolation.key': '{{what}} est {{how}}',
    'interpolation.nested.key': '{{what}} est {{how.value}}',
    'interpolation.complex.message': 'Voici un {{link}}.',
    'interpolation.complex.linkText': 'lien',
    'formatting.intlNumber': 'Certains {{val, number}}',
    'formatting.intlNumberWithOptions':
      'Certains {{val, number(minimumFractionDigits: 2)}}',
    'formatting.intlDateTime': 'Le {{val, datetime}}',
    'formatting.intlRelativeTime': 'Lorem {{val, relativetime}}',
    'formatting.intlRelativeTimeWithOptions':
      'Lorem {{val, relativetime(quarter)}}',
    'formatting.intlRelativeTimeWithOptionsExplicit':
      'Lorem {{val, relativetime(range: quarter; style: narrow;)}}',
    'plurals.key_zero': 'zéro',
    'plurals.key_one': 'un',
    'plurals.key_two': 'deux',
    'plurals.key_few': 'peu',
    'plurals.key_many': 'plusieurs',
    'plurals.key_other': 'autre',
    'plurals.keyWithCount_one': '{{count}} article',
    'plurals.keyWithCount_other': '{{count}} articles',
    'context.friend': 'Un ami',
    'context.friend_male': 'Un petit ami',
    'context.friend_female': 'Une petite amie',
    'objects.tree.res': 'a ajouté {{something}}',
  },
});

export default quickstartTranslationFr;
