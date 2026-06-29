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
import { globalHeaderMessages } from '../../plugins/global-header/src/translations/ref.js';
import globalHeaderTranslationDe from '../../plugins/global-header/src/translations/de.js';
import globalHeaderTranslationEs from '../../plugins/global-header/src/translations/es.js';
import globalHeaderTranslationFr from '../../plugins/global-header/src/translations/fr.js';
import globalHeaderTranslationIt from '../../plugins/global-header/src/translations/it.js';
import globalHeaderTranslationJa from '../../plugins/global-header/src/translations/ja.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type GlobalHeaderMessages = typeof globalHeaderMessages;

function transformFlatMessagesIntoTree(
  flatMessages: typeof globalHeaderTranslationDe.messages,
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
  return messages as GlobalHeaderMessages;
}

export function getTranslations(locale: string) {
  switch (locale) {
    case 'en':
      return globalHeaderMessages;
    case 'de':
      return transformFlatMessagesIntoTree(globalHeaderTranslationDe.messages);
    case 'es':
      return transformFlatMessagesIntoTree(globalHeaderTranslationEs.messages);
    case 'fr':
      return transformFlatMessagesIntoTree(globalHeaderTranslationFr.messages);
    case 'it':
      return transformFlatMessagesIntoTree(globalHeaderTranslationIt.messages);
    case 'ja':
      return transformFlatMessagesIntoTree(globalHeaderTranslationJa.messages);
    default:
      return globalHeaderMessages;
  }
}

/**
 * Replace multiple placeholders in a template string
 * @param template - Template string with placeholders like {{key}}
 * @param replacements - Object with key-value pairs for replacement
 * @returns String with all placeholders replaced
 */
export function replaceTemplate(
  template: string,
  replacements: Record<string, string | number>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(`{{${key}}}`, String(value));
  }
  return result;
}
