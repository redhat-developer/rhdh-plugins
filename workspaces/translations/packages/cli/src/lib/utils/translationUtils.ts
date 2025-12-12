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

/**
 * Count translation keys from a JSON translation file.
 * Handles both nested structure ({ "plugin": { "en": { "key": "value" } } })
 * and flat structure ({ "translations": { "key": "value" } } or { "key": "value" }).
 *
 * @param data - Parsed JSON data from translation file
 * @returns Number of translation keys
 */
export function countTranslationKeys(data: unknown): number {
  if (!data || typeof data !== 'object') {
    return 0;
  }

  // Check if it's a nested structure: { "plugin": { "en": { "key": "value" } } }
  const isNested = Object.values(data).some(
    (val: unknown) => typeof val === 'object' && val !== null && 'en' in val,
  );

  if (isNested) {
    let keyCount = 0;
    for (const pluginData of Object.values(data)) {
      const enData = (pluginData as { en?: Record<string, unknown> })?.en;
      if (enData && typeof enData === 'object') {
        keyCount += Object.keys(enData).length;
      }
    }
    return keyCount;
  }

  // Flat structure: { "translations": { "key": "value" } } or { "key": "value" }
  const translations =
    (data as { translations?: Record<string, unknown> }).translations || data;
  return Object.keys(translations).length;
}
