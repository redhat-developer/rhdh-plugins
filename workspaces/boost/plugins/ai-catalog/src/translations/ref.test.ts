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

import { aiCatalogMessages } from './ref';
import aiCatalogTranslationDe from './de';
import aiCatalogTranslationEs from './es';
import aiCatalogTranslationFr from './fr';
import aiCatalogTranslationIt from './it';
import aiCatalogTranslationJa from './ja';

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
  Object.keys(flattenMessages(aiCatalogMessages as Record<string, unknown>)),
);
const refKeysSorted = Array.from(refKeys).sort();
const refFlattened = flattenMessages(
  aiCatalogMessages as Record<string, unknown>,
);

const languageModules = [
  ['de', aiCatalogTranslationDe.messages],
  ['es', aiCatalogTranslationEs.messages],
  ['fr', aiCatalogTranslationFr.messages],
  ['it', aiCatalogTranslationIt.messages],
  ['ja', aiCatalogTranslationJa.messages],
] as const;

describe('ref (translation keys)', () => {
  it('has at least one key', () => {
    expect(refKeys.size).toBeGreaterThan(0);
  });

  describe.each(languageModules)('"%s" translations', (_lang, messages) => {
    describe('has exactly the same keys as ref (no more, no less)', () => {
      const langKeys = Object.keys(messages);
      const langKeysSet = new Set(langKeys);
      const langKeysSorted = [...langKeys].sort();

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

    it('preserves interpolation placeholders', () => {
      const placeholderRe = /\{\{(\w+)\}\}/g;
      for (const [key, value] of Object.entries(messages)) {
        const refValue = refFlattened[key];
        if (!refValue) continue;
        const refPlaceholders = [...refValue.matchAll(placeholderRe)].map(
          m => m[1],
        );
        const langPlaceholders = [
          ...(value as string).matchAll(placeholderRe),
        ].map(m => m[1]);
        expect(langPlaceholders.sort()).toEqual(refPlaceholders.sort());
      }
    });
  });
});
