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
import { toSorted } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { x2aPluginMessages } from './ref';
import x2aPluginTranslationDe from './de';
import x2aPluginTranslationEs from './es';
import x2aPluginTranslationFr from './fr';
import x2aPluginTranslationIt from './it';

const deMessages = flattenMessages(x2aPluginTranslationDe.messages);
const esMessages = flattenMessages(x2aPluginTranslationEs.messages);
const frMessages = flattenMessages(x2aPluginTranslationFr.messages);
const itMessages = flattenMessages(x2aPluginTranslationIt.messages);

function flattenMessages(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  const flattened: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(
          flattened,
          flattenMessages(value as Record<string, unknown>, newKey),
        );
      } else {
        flattened[newKey] = String(value);
      }
    }
  }
  return flattened;
}

const refKeys = new Set(
  Object.keys(flattenMessages(x2aPluginMessages as Record<string, unknown>)),
);
const refKeysSorted = Array.from(refKeys).sort();

const languageModules = [
  ['de', deMessages],
  ['es', esMessages],
  ['fr', frMessages],
  ['it', itMessages],
] as const;

describe('ref (translation keys)', () => {
  it('has at least one key', () => {
    expect(refKeys.size).toBeGreaterThan(0);
  });

  describe.each(languageModules)('"%s" translations', (_lang, messages) => {
    describe('has exactly the same keys as ref (no more, no less)', () => {
      const langKeys = Object.keys(messages);
      const langKeysSet = new Set(langKeys);
      const langKeysSorted = langKeys.sort(toSorted);

      const missing = refKeysSorted.filter(k => !langKeysSet.has(k));
      const extra = langKeysSorted.filter(k => !refKeys.has(k));

      it('should have no missing keys', () => {
        expect(missing).toEqual([]);
      });

      it('should have no extra keys', () => {
        expect(extra).toEqual([]);
      });

      it('should have the same number of keys as ref', () => {
        expect(langKeys).toHaveLength(refKeys.size);
      });
    });
  });
});
