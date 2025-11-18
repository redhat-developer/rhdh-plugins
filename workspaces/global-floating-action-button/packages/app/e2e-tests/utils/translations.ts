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

// These translation files are not exported by the package, so relative imports are necessary for e2e tests
/* eslint-disable @backstage/no-relative-monorepo-imports */
import { globalFloatingActionButtonMessages } from '../../../../plugins/global-floating-action-button/src/translations/ref.js';
import globalFloatingActionButtonTranslationDe from '../../../../plugins/global-floating-action-button/src/translations/de.js';
import globalFloatingActionButtonTranslationFr from '../../../../plugins/global-floating-action-button/src/translations/fr.js';
import globalFloatingActionButtonTranslationEs from '../../../../plugins/global-floating-action-button/src/translations/es.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type GlobalFloatingActionButtonMessages =
  typeof globalFloatingActionButtonMessages;

function transform(
  messages: typeof globalFloatingActionButtonTranslationDe.messages,
) {
  const result = Object.keys(messages).reduce((res, key) => {
    const path = key.split('.');
    const lastIndex = path.length - 1;
    path.reduce((acc, currentPath, i) => {
      acc[currentPath] =
        lastIndex === i ? messages[key] : acc[currentPath] || {};
      return acc[currentPath];
    }, res);
    return res;
  }, {});

  return result as GlobalFloatingActionButtonMessages;
}

export function getTranslations(locale: string) {
  const languageCode = locale.split('-')[0].toLowerCase();

  switch (languageCode) {
    case 'en':
      return globalFloatingActionButtonMessages;
    case 'fr':
      return transform(globalFloatingActionButtonTranslationFr.messages);
    case 'de':
      return transform(globalFloatingActionButtonTranslationDe.messages);
    case 'es':
      return transform(globalFloatingActionButtonTranslationEs.messages);
    default:
      return globalFloatingActionButtonMessages;
  }
}
