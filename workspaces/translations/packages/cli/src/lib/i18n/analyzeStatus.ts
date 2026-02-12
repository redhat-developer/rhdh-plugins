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

import path from 'node:path';

import fs from 'fs-extra';
import glob from 'glob';

export interface TranslationStatus {
  sourceFiles: string[];
  totalKeys: number;
  languages: string[];
  overallCompletion: number;
  languageStats: {
    [language: string]: {
      total: number;
      translated: number;
      completion: number;
    };
  };
  missingKeys: string[];
  extraKeys: { [language: string]: string[] };
}

export interface AnalyzeOptions {
  sourceDir: string;
  i18nDir: string;
  localesDir: string;
}

/**
 * Analyze translation status across the project
 */
export async function analyzeTranslationStatus(
  options: AnalyzeOptions,
): Promise<TranslationStatus> {
  const { sourceDir, i18nDir, localesDir } = options;

  // Find source files
  const sourceFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
    cwd: sourceDir,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });

  // Find reference translation file
  const referenceFile = path.join(i18nDir, 'reference.json');
  let referenceKeys: string[] = [];

  if (await fs.pathExists(referenceFile)) {
    const referenceData = await fs.readJson(referenceFile);
    referenceKeys = Object.keys(referenceData.translations || referenceData);
  }

  // Find language files
  const languageFiles = await findLanguageFiles(localesDir);
  const languages = languageFiles.map(file =>
    path.basename(file, path.extname(file)),
  );

  // Analyze each language
  const languageStats: {
    [language: string]: {
      total: number;
      translated: number;
      completion: number;
    };
  } = {};
  const extraKeys: { [language: string]: string[] } = {};

  for (const languageFile of languageFiles) {
    const language = path.basename(languageFile, path.extname(languageFile));
    const fileData = await fs.readJson(languageFile);
    const languageKeys = Object.keys(fileData.translations || fileData);

    const translated = languageKeys.filter(key => {
      const value = (fileData.translations || fileData)[key];
      return value && value.trim() !== '' && value !== key;
    });

    languageStats[language] = {
      total: referenceKeys.length,
      translated: translated.length,
      completion:
        referenceKeys.length > 0
          ? (translated.length / referenceKeys.length) * 100
          : 0,
    };

    // Find extra keys (keys in language file but not in reference)
    extraKeys[language] = languageKeys.filter(
      key => !referenceKeys.includes(key),
    );
  }

  // Find missing keys (keys in reference but not in any language file)
  const missingKeys = referenceKeys.filter(key => {
    return !languages.some(lang => {
      const langKeys = Object.keys(languageStats[lang] || {});
      return langKeys.includes(key);
    });
  });

  // Calculate overall completion
  const totalTranslations = languages.reduce(
    (sum, lang) => sum + (languageStats[lang]?.translated || 0),
    0,
  );
  const totalPossible = referenceKeys.length * languages.length;
  const overallCompletion =
    totalPossible > 0 ? (totalTranslations / totalPossible) * 100 : 0;

  return {
    sourceFiles,
    totalKeys: referenceKeys.length,
    languages,
    overallCompletion,
    languageStats,
    missingKeys,
    extraKeys,
  };
}

/**
 * Find language files in the locales directory
 */
async function findLanguageFiles(localesDir: string): Promise<string[]> {
  if (!(await fs.pathExists(localesDir))) {
    return [];
  }

  const files = await fs.readdir(localesDir);
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(localesDir, file));
}
