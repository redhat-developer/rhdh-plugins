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
import { quickstartMessages } from '../../plugins/quickstart/src/translations/ref.js';
import quickstartTranslationDe from '../../plugins/quickstart/src/translations/de.js';
import quickstartTranslationFr from '../../plugins/quickstart/src/translations/fr.js';
import quickstartTranslationEs from '../../plugins/quickstart/src/translations/es.js';
import quickstartTranslationIt from '../../plugins/quickstart/src/translations/it.js';
import quickstartTranslationJa from '../../plugins/quickstart/src/translations/ja.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type QuickstartMessages = typeof quickstartMessages;

function transformFlatMessagesIntoTree(
  flatMessages: typeof quickstartTranslationDe.messages,
) {
  const messages = {} as Record<string, any>;
  for (const key of Object.keys(flatMessages)) {
    const path = key.split('.');
    let current = messages;
    for (let i = 0; i < path.length - 1; i++) {
      current[path[i]] = current[path[i]] || {};
      current = current[path[i]] as Record<string, any>;
    }
    current[path[path.length - 1]] =
      flatMessages[key as keyof typeof flatMessages];
  }
  return messages as QuickstartMessages;
}

export function getTranslations(locale: string) {
  const languageCode = locale.split('-')[0].toLowerCase();

  switch (languageCode) {
    case 'en':
      return quickstartMessages;
    case 'fr':
      return transformFlatMessagesIntoTree(quickstartTranslationFr.messages);
    case 'de':
      return transformFlatMessagesIntoTree(quickstartTranslationDe.messages);
    case 'es':
      return transformFlatMessagesIntoTree(quickstartTranslationEs.messages);
    case 'it':
      return transformFlatMessagesIntoTree(quickstartTranslationIt.messages);
    case 'ja':
      return transformFlatMessagesIntoTree(quickstartTranslationJa.messages);
    default:
      return quickstartMessages;
  }
}
