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
import { bulkImportMessages } from '../../../../plugins/bulk-import/src/translations/ref.js';
import bulkImportTranslationDe from '../../../../plugins/bulk-import/src/translations/de.js';
import bulkImportTranslationEs from '../../../../plugins/bulk-import/src/translations/es.js';
import bulkImportTranslationFr from '../../../../plugins/bulk-import/src/translations/fr.js';
import bulkImportTranslationIt from '../../../../plugins/bulk-import/src/translations/it.js';
import bulkImportTranslationJa from '../../../../plugins/bulk-import/src/translations/ja.js';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type BulkImportMessages = typeof bulkImportMessages;

function transform(messages: typeof bulkImportTranslationDe.messages) {
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

  return result as BulkImportMessages;
}

export function getTranslations(locale: string): BulkImportMessages {
  switch (locale) {
    case 'en':
      return bulkImportMessages;
    case 'de':
      return transform(bulkImportTranslationDe.messages);
    case 'es':
      return transform(bulkImportTranslationEs.messages);
    case 'fr':
      return transform(bulkImportTranslationFr.messages);
    case 'it':
      return transform(bulkImportTranslationIt.messages);
    case 'ja':
      return transform(bulkImportTranslationJa.messages);
    default:
      return bulkImportMessages;
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

/**
 * Get the "Selected repositories (count)" heading text
 * Built from selectedLabel + selectedRepositories + count
 * @param translations - Translation messages object
 * @param count - Number of selected repositories
 * @returns Formatted heading string like "Selected repositories (5)"
 */
export function getSelectedRepositoriesHeading(
  translations: BulkImportMessages,
  count: number,
): string {
  return `${translations.addRepositories.selectedLabel} ${translations.addRepositories.selectedRepositories} (${count})`;
}
