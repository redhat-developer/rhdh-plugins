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

export type LearningPathsE2eMessages = {
  menuItem: {
    learningPaths: string;
  };
  learningPaths: {
    title: string;
  };
};

const enMessages: LearningPathsE2eMessages = {
  menuItem: {
    learningPaths: 'Learning Paths',
  },
  learningPaths: {
    title: 'Learning Paths',
  },
};

const localeMessages: Record<string, LearningPathsE2eMessages> = {
  en: enMessages,
  de: {
    menuItem: { learningPaths: 'Lernpfade' },
    learningPaths: { title: 'Lernpfade' },
  },
  es: {
    menuItem: { learningPaths: 'Rutas de aprendizaje' },
    learningPaths: { title: 'Rutas de aprendizaje' },
  },
  fr: {
    menuItem: { learningPaths: "Parcours d'apprentissage" },
    learningPaths: { title: "Parcours d'apprentissage" },
  },
  it: {
    menuItem: { learningPaths: 'Learning Path' },
    learningPaths: { title: 'Learning Path' },
  },
  ja: {
    menuItem: { learningPaths: 'ラーニングパス' },
    learningPaths: { title: 'ラーニングパス' },
  },
};

export function getLearningPathsTranslations(
  locale = 'en',
): LearningPathsE2eMessages {
  const baseLocale = locale.split('-')[0];
  return localeMessages[baseLocale] ?? enMessages;
}
