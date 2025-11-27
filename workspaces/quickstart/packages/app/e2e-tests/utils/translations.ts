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

/* eslint-disable @backstage/no-relative-monorepo-imports */
import { quickstartMessages } from '../../../../plugins/quickstart/src/translations/ref.js';
import quickstartTranslationDe from '../../../../plugins/quickstart/src/translations/de.js';
import quickstartTranslationFr from '../../../../plugins/quickstart/src/translations/fr.js';
import quickstartTranslationEs from '../../../../plugins/quickstart/src/translations/es.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type QuickstartMessages = typeof quickstartMessages;

function transform(messages: typeof quickstartTranslationDe.messages) {
  const result = Object.keys(messages).reduce((res, key) => {
    const path = key.split('.');
    const lastIndex = path.length - 1;
    path.reduce((acc: Record<string, string | {}>, currentPath, i) => {
      acc[currentPath] =
        lastIndex === i
          ? (messages as Record<string, string>)[key]
          : acc[currentPath] || {};
      return acc[currentPath];
    }, res);
    return res;
  }, {});

  return result as QuickstartMessages;
}

export function getTranslations(locale: string) {
  const languageCode = locale.split('-')[0].toLowerCase();

  switch (languageCode) {
    case 'en':
      return quickstartMessages;
    case 'fr':
      return transform(quickstartTranslationFr.messages);
    case 'de':
      return transform(quickstartTranslationDe.messages);
    case 'es':
      return transform(quickstartTranslationEs.messages);
    default:
      return quickstartMessages;
  }
}
