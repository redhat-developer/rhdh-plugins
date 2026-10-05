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

export type E2eTranslations = {
  languageDropdownTitle: string;
  catalogSideBarTitle: string;
  overviewTabTitle: string;
  /** Localized sidebar / page title (`pages.Learning Paths`). */
  learningPathTitle: string;
};

const localeMessages: Record<string, E2eTranslations> = {
  en: {
    languageDropdownTitle: 'English',
    catalogSideBarTitle: 'Catalog',
    overviewTabTitle: 'Overview',
    learningPathTitle: 'Learning Paths',
  },
  de: {
    languageDropdownTitle: 'Deutsch',
    catalogSideBarTitle: 'Katalog',
    overviewTabTitle: 'Übersicht',
    learningPathTitle: 'Lernpfade',
  },
  es: {
    languageDropdownTitle: 'Español',
    catalogSideBarTitle: 'Catálogo',
    overviewTabTitle: 'Resumen',
    learningPathTitle: 'Rutas de aprendizaje',
  },
  fr: {
    languageDropdownTitle: 'Français',
    catalogSideBarTitle: 'Catalogue',
    overviewTabTitle: 'Aperçu',
    learningPathTitle: "Parcours d'apprentissage",
  },
  it: {
    languageDropdownTitle: 'Italiano',
    catalogSideBarTitle: 'Catalogo',
    overviewTabTitle: 'Panoramica',
    learningPathTitle: 'Learning Path',
  },
  ja: {
    languageDropdownTitle: '日本語',
    catalogSideBarTitle: 'カタログ',
    overviewTabTitle: '概要',
    learningPathTitle: 'ラーニングパス',
  },
};

export function getE2eTranslations(locale: string): E2eTranslations {
  const baseLocale = locale.split('-')[0];
  const messages = localeMessages[baseLocale];
  if (!messages)
    throw new Error(`No e2e messages found for base locale ${baseLocale}`);
  return messages;
}
