/*
 * Copyright The Backstage Authors
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
 * Helper function to get translated or fallback text for collection keys
 * @param fallbackText - The fallback text to use if translation is not available
 * @param translationKey - The translation key to attempt to translate
 * @param t - The translation function from useTranslation hook
 * @returns The translated text or fallback text
 */
export const getTranslatedText = (
  fallbackText: string | undefined,
  translationKey: string | undefined,
  t: (key: string, options?: any) => string,
): string => {
  if (translationKey && translationKey.startsWith('collection.')) {
    try {
      return t(translationKey as any, {});
    } catch (error) {
      // Fall back to original text if translation fails
      return fallbackText || '';
    }
  }
  return fallbackText || '';
};
