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
 * es translation for plugin.translations-test.
 * @public
 */
const quickstartTranslationEs = createTranslationMessages({
  ref: translationsTestTranslationRef,
  messages: {
    'page.title': 'Complemento de prueba de traducciones',
    'page.subtitle':
      'Un complemento para probar las funcionalidades de traducción y de i18next',
    'essentials.key': 'valor de la clave',
    'essentials.look.deep': 'valor de explorar en profundidad',
    'interpolation.key': '{{what}} es {{how}}',
    'formatting.intlNumber': 'Algunos {{val, number}}',
    'context.friend': 'Un amigo',
    'context.friend_male': 'Un novio',
    'context.friend_female': 'Una novia',
    'objects.tree.res': 'agregó {{something}}',
  },
});

export default quickstartTranslationEs;
