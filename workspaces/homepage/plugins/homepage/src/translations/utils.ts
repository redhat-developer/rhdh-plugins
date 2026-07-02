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
 * Lightweight translation callback used by homepage utilities and tests.
 * Compatible with `TranslationFunction` from `useTranslation`, without
 * pulling in its expensive generic instantiation during full typechecks.
 */
export type HomepageTranslateFn = (key: string, options?: any) => string;

/**
 * Utility function to get translated text with fallback to original text
 *
 * @param t - Translation function
 * @param translationKey - Optional translation key to look up
 * @param fallbackText - Text to display if translation key is not provided or translation is not found
 * @returns Translated text or fallback text
 */
export const getTranslatedTextWithFallback = (
  t: HomepageTranslateFn,
  translationKey: string | undefined,
  fallbackText: string | undefined,
): string | undefined => {
  if (!translationKey) {
    return fallbackText;
  }

  const translation = t(translationKey, {});
  return translation !== translationKey ? translation : fallbackText;
};
