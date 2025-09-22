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

const quickstartTranslationDe = createTranslationMessages({
  ref: translationsTestTranslationRef,
  full: false,
  messages: {
    'page.title': 'Plugin de test de traductions',
    'page.subtitle':
      'Un plugin pour tester la fonctionnalité de traduction et les fonctionnalités i18next',
  },
});

export default quickstartTranslationDe;
