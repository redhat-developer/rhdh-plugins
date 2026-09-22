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
 * Localized Learning Paths labels used by e2e tests. Sidebar nav title comes
 * from app-react `pages.Learning Paths`; page strings from app-defaults
 * `learningPaths.*`.
 */
export type LearningPathsE2eMessages = {
  /** Localized sidebar / page title (`pages.Learning Paths`). */
  title: string;
};

const enMessages: LearningPathsE2eMessages = {
  title: 'Learning Paths',
};

const localeMessages: Record<string, LearningPathsE2eMessages> = {
  en: enMessages,
  de: { title: 'Lernpfade' },
  es: { title: 'Rutas de aprendizaje' },
  fr: { title: "Parcours d'apprentissage" },
  it: { title: 'Learning Path' },
  ja: { title: 'ラーニングパス' },
};

export function getLearningPathsTranslations(
  locale = 'en',
): LearningPathsE2eMessages {
  const baseLocale = locale.split('-')[0];
  return localeMessages[baseLocale] ?? enMessages;
}
