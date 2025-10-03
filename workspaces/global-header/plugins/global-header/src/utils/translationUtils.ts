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
import { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import { globalHeaderTranslationRef } from '../translations';

/**
 * Translates text using a dedicated translation key or fallback logic
 * @param t - Translation function
 * @param titleKey - Dedicated translation key (e.g., "profile.settings")
 * @param title - Fallback title text (e.g., "Settings")
 * @returns Translated text or fallback
 */

export const translateWithFallback = (
  t: TranslationFunction<typeof globalHeaderTranslationRef.T>,
  translationKey?: string,
  fallbackText?: string,
): string => {
  if (!translationKey) {
    return fallbackText || '';
  }
  const translation = t(translationKey as keyof typeof t, {});
  return translation !== translationKey ? translation : fallbackText || '';
};
