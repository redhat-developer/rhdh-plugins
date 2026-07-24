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
import { extensionsMessages } from '../../plugins/extensions/src/alpha/translations/ref.js';
import extensionsTranslationDe from '../../plugins/extensions/src/alpha/translations/de.js';
import extensionsTranslationEs from '../../plugins/extensions/src/alpha/translations/es.js';
import extensionsTranslationFr from '../../plugins/extensions/src/alpha/translations/fr.js';
import extensionsTranslationIt from '../../plugins/extensions/src/alpha/translations/it.js';
import extensionsTranslationJa from '../../plugins/extensions/src/alpha/translations/ja.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type ExtensionsMessages = typeof extensionsMessages;

function transformFlatMessagesIntoTree(
  flatMessages: typeof extensionsTranslationDe.messages,
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
  return messages as ExtensionsMessages;
}

export function getTranslations(locale: string) {
  switch (locale) {
    case 'en':
      return extensionsMessages;
    case 'de':
      return transformFlatMessagesIntoTree(extensionsTranslationDe.messages);
    case 'es':
      return transformFlatMessagesIntoTree(extensionsTranslationEs.messages);
    case 'fr':
      return transformFlatMessagesIntoTree(extensionsTranslationFr.messages);
    case 'it':
      return transformFlatMessagesIntoTree(extensionsTranslationIt.messages);
    case 'ja':
      return transformFlatMessagesIntoTree(extensionsTranslationJa.messages);
    default:
      return extensionsMessages;
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
