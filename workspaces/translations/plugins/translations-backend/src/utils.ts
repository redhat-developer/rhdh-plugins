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
export function isValidJSONTranslation(json: Record<string, any>): boolean {
  if (typeof json !== 'object' || json === null) return false;

  for (const [pluginRef, locales] of Object.entries(json)) {
    if (typeof pluginRef !== 'string') return false;
    if (typeof locales !== 'object' || locales === null) return false;

    for (const [locale, messages] of Object.entries(locales)) {
      if (typeof locale !== 'string') return false;
      if (typeof messages !== 'object' || messages === null) return false;

      for (const [k, v] of Object.entries(messages)) {
        if (typeof k !== 'string' || typeof v !== 'string') {
          return false;
        }
      }
    }
  }

  return true;
}

export function deepMergeTranslations(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMergeTranslations(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export function filterLocales(
  allTranslations: Record<string, any>,
  configuredLocales: string[],
): Record<string, any> {
  const filtered: Record<string, any> = {};
  for (const pluginId of Object.keys(allTranslations)) {
    for (const locale of configuredLocales) {
      if (allTranslations[pluginId][locale]) {
        filtered[pluginId] = {
          ...(filtered[pluginId] ?? {}),
          [locale]: allTranslations[pluginId][locale],
        };
      }
    }
  }

  return filtered;
}
