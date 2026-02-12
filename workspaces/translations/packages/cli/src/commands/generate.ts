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

import { OptionValues } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import glob from 'glob';

import { extractTranslationKeys } from '../lib/i18n/extractKeys';
import { generateTranslationFiles } from '../lib/i18n/generateFiles';
import { mergeTranslationFiles } from '../lib/i18n/mergeFiles';
import { loadI18nConfig, mergeConfigWithOptions } from '../lib/i18n/config';
import { safeExecSyncOrThrow } from '../lib/utils/exec';
import { isRedHatOwnedPlugin } from '../lib/i18n/deployTranslations';

/**
 * Detect repository name from git or directory
 * Used for generating filenames in format: <repo-name>-<sprint>.json
 * @param repoPath - Optional path to repository. If not provided, uses current directory
 */
function detectRepoName(repoPath?: string): string {
  const targetPath = repoPath || process.cwd();

  try {
    // Try to get repo name from git
    const gitRepoUrl = safeExecSyncOrThrow(
      'git',
      ['config', '--get', 'remote.origin.url'],
      {
        cwd: targetPath,
      },
    );
    if (gitRepoUrl) {
      // Extract repo name from URL (handles both https and ssh formats)
      // Remove .git suffix first, then extract the last path segment
      let repoName = gitRepoUrl.replace(/\.git$/, '');
      const lastSlashIndex = repoName.lastIndexOf('/');
      if (lastSlashIndex >= 0) {
        repoName = repoName.substring(lastSlashIndex + 1);
      }
      if (repoName) {
        return repoName;
      }
    }
  } catch {
    // Git not available or not a git repo
  }

  // Fallback: use directory name
  return path.basename(targetPath);
}

// Helper to check if data is in nested structure
function isNestedStructure(
  data: unknown,
): data is Record<string, { en: Record<string, string> }> {
  if (typeof data !== 'object' || data === null) return false;
  const firstKey = Object.keys(data)[0];
  if (!firstKey) return false;
  const firstValue = (data as Record<string, unknown>)[firstKey];
  return (
    typeof firstValue === 'object' && firstValue !== null && 'en' in firstValue
  );
}

/**
 * Language codes to exclude from reference files
 */
const LANGUAGE_CODES = [
  'de',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'pt',
  'zh',
  'ru',
  'ar',
  'hi',
  'nl',
  'pl',
  'sv',
  'tr',
  'uk',
  'vi',
] as const;

/**
 * Check if a file is a language file (non-English)
 */
function isLanguageFile(fileName: string): boolean {
  const isNonEnglishLanguage = LANGUAGE_CODES.some(code => {
    if (fileName === code) return true;
    if (fileName.endsWith(`-${code}`)) return true;
    if (fileName.includes(`.${code}.`) || fileName.includes(`-${code}-`)) {
      return true;
    }
    return false;
  });

  return isNonEnglishLanguage && !fileName.includes('-en') && fileName !== 'en';
}

/**
 * Check if a file is an English reference file
 */
function isEnglishReferenceFile(filePath: string, content: string): boolean {
  const fileName = path.basename(filePath, path.extname(filePath));
  const fullFileName = path.basename(filePath);

  // Check if it's a language file (exclude non-English)
  if (isLanguageFile(fileName)) {
    return false;
  }

  // Check if file contains createTranslationRef (defines new translation keys)
  const hasCreateTranslationRef =
    content.includes('createTranslationRef') &&
    (content.includes("from '@backstage/core-plugin-api/alpha'") ||
      content.includes("from '@backstage/frontend-plugin-api'"));

  // Check if it's an English file with createTranslationMessages that has a ref
  const isEnglishFile =
    fullFileName.endsWith('-en.ts') ||
    fullFileName.endsWith('-en.tsx') ||
    fullFileName === 'en.ts' ||
    fullFileName === 'en.tsx' ||
    fileName.endsWith('-en') ||
    fileName === 'en';

  const hasCreateTranslationMessagesWithRef =
    isEnglishFile &&
    content.includes('createTranslationMessages') &&
    content.includes('ref:') &&
    (content.includes("from '@backstage/core-plugin-api/alpha'") ||
      content.includes("from '@backstage/frontend-plugin-api'"));

  return hasCreateTranslationRef || hasCreateTranslationMessagesWithRef;
}

/**
 * Find all English reference files (TypeScript)
 */
async function findEnglishReferenceFiles(
  sourceDir: string,
  includePattern: string,
  excludePattern: string,
): Promise<string[]> {
  const allSourceFiles = glob.sync(includePattern, {
    cwd: sourceDir,
    ignore: excludePattern,
    absolute: true,
  });

  const sourceFiles: string[] = [];

  for (const filePath of allSourceFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (isEnglishReferenceFile(filePath, content)) {
        sourceFiles.push(filePath);
      }
    } catch {
      // Skip files that can't be read
      continue;
    }
  }

  return sourceFiles;
}

/**
 * Find all JSON translation files (for RHDH repo)
 */
async function findJsonTranslationFiles(sourceDir: string): Promise<string[]> {
  // Look for JSON files in translations directories
  // Check both relative to sourceDir and at repo root level
  const repoRoot = process.cwd();
  const jsonPatterns = [
    // Patterns relative to sourceDir
    '**/translations/**/*.json',
    'packages/app/src/translations/**/*.json',
    'packages/app/translations/**/*.json',
    // Patterns at repo root level (for RHDH repo)
    'translations/**/*-en.json',
    'translations/**/*en*.json',
  ];

  const jsonFiles: string[] = [];
  for (const pattern of jsonPatterns) {
    try {
      // Try from sourceDir first
      const filesFromSource = glob.sync(pattern, {
        cwd: sourceDir,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/test/**',
        ],
        absolute: true,
      });
      jsonFiles.push(...filesFromSource);

      // Also try from repo root for root-level patterns
      if (pattern.startsWith('translations/')) {
        const filesFromRoot = glob.sync(pattern, {
          cwd: repoRoot,
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/test/**',
          ],
          absolute: true,
        });
        jsonFiles.push(...filesFromRoot);
      }
    } catch {
      // Skip patterns that don't match
      continue;
    }
  }

  // Remove duplicates
  const uniqueFiles = Array.from(new Set(jsonFiles));

  // Filter to only English reference files (exclude language-specific files)
  const englishJsonFiles: string[] = [];
  for (const filePath of uniqueFiles) {
    const fileName = path.basename(filePath, '.json').toLowerCase();
    // Include files with "en" in name, exclude language-specific files
    if (fileName.includes('en') || fileName.includes('reference')) {
      // Double-check it's not a language file
      if (!isLanguageFile(fileName.replace(/en|reference/gi, ''))) {
        englishJsonFiles.push(filePath);
      }
    }
  }

  return englishJsonFiles;
}

/**
 * Check if file path contains 'translations' or 'i18n' directory
 * Matches original filtering: grep -E "(translations|i18n)"
 * Also accepts files named translation.ts, ref.ts, etc. even if not in translations/ directory
 * (for simpler Backstage plugin structures like plugins/home/src/translation.ts)
 */
function pathContainsTranslationsOrI18n(filePath: string): boolean {
  // Check for translations or i18n directory
  if (filePath.includes('/translations/') || filePath.includes('/i18n/')) {
    return true;
  }

  // Also accept files with translation-related names even if not in translations/ directory
  // This handles simpler structures like plugins/home/src/translation.ts
  const fileName = path.basename(filePath).toLowerCase();
  const translationFileNames = [
    'translation.ts',
    'ref.ts',
    'translationref.ts',
    'messages.ts',
    'data.json',
    'alpha.ts',
  ];
  if (
    translationFileNames.some(
      name => fileName === name || fileName.endsWith(name),
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Check if file is a non-English language file that should be ignored
 * Rules: ONLY extract English (en) messages - ignore all other language files
 */
function isNonEnglishLanguageFile(filePath: string): boolean {
  // Common language codes to exclude (not exhaustive, but covers common cases)
  const languageCodes = [
    'de', // German
    'fr', // French
    'es', // Spanish
    'it', // Italian
    'ja', // Japanese
    'zh', // Chinese
    'pt', // Portuguese
    'ru', // Russian
    'ko', // Korean
    'nl', // Dutch
    'sv', // Swedish
    'pl', // Polish
    'cs', // Czech
    'tr', // Turkish
    'ar', // Arabic
    'he', // Hebrew
    'hi', // Hindi
  ];

  const fileName = filePath.toLowerCase();

  // Check for language-specific file patterns:
  // - translation.de.ts, translation.fr.ts, etc.
  // - ref.de.ts, ref.fr.ts, etc.
  // - messages.de.ts, messages.fr.ts, etc.
  // - data.de.json, data.fr.json, etc.
  // - translations/de/..., translations/fr/..., etc.
  // - i18n/de/..., i18n/fr/..., etc.

  for (const lang of languageCodes) {
    // Pattern: file.{lang}.ts or file.{lang}.json
    if (
      fileName.includes(`.${lang}.`) ||
      fileName.includes(`-${lang}.`) ||
      fileName.includes(`_${lang}.`)
    ) {
      return true;
    }
    // Pattern: translations/{lang}/ or i18n/{lang}/
    if (
      fileName.includes(`/translations/${lang}/`) ||
      fileName.includes(`/i18n/${lang}/`) ||
      fileName.includes(`\\translations\\${lang}\\`) ||
      fileName.includes(`\\i18n\\${lang}\\`)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Find Backstage plugin translation ref files in Backstage repository
 * Aligns with first release version: searches plugins/, packages/, workspaces/
 * These contain the English source translations for core Backstage plugins
 */
async function findBackstagePluginTranslationRefs(
  backstageRepoPath: string,
): Promise<string[]> {
  if (!(await fs.pathExists(backstageRepoPath))) {
    console.warn(
      chalk.yellow(
        `⚠️  Backstage repository path does not exist: ${backstageRepoPath}`,
      ),
    );
    return [];
  }

  // Look for translation ref files matching original patterns
  // Files must be in paths containing 'translations' or 'i18n'
  // Exact filenames: translation.ts, ref.ts, translationRef.ts, messages.ts, data.json
  const patterns = [
    // plugins/ directory structure (simpler structure: plugins/{name}/src/translation.ts)
    'plugins/*/src/translation.ts',
    'plugins/*/src/ref.ts',
    'plugins/*/src/translationRef.ts',
    'plugins/*/src/messages.ts',
    'plugins/*/src/data.json',
    'plugins/*/src/**/translation.ts',
    'plugins/*/src/**/ref.ts',
    'plugins/*/src/**/translationRef.ts',
    'plugins/*/src/**/messages.ts',
    'plugins/*/src/**/data.json',
    'plugins/*/src/**/alpha.ts',
    // plugins/ directory structure (packages subdirectory: plugins/*/packages/plugin-*/...)
    'plugins/*/packages/plugin-*/**/translation.ts',
    'plugins/*/packages/plugin-*/**/ref.ts',
    'plugins/*/packages/plugin-*/**/translationRef.ts',
    'plugins/*/packages/plugin-*/**/messages.ts',
    'plugins/*/packages/plugin-*/**/data.json',
    'plugins/*/packages/core-*/**/translation.ts',
    'plugins/*/packages/core-*/**/ref.ts',
    'plugins/*/packages/core-*/**/translationRef.ts',
    'plugins/*/packages/core-*/**/messages.ts',
    'plugins/*/packages/core-*/**/data.json',
    // packages/ directory structure
    'packages/plugin-*/**/translation.ts',
    'packages/plugin-*/**/ref.ts',
    'packages/plugin-*/**/translationRef.ts',
    'packages/plugin-*/**/messages.ts',
    'packages/plugin-*/**/data.json',
    'packages/core-*/**/translation.ts',
    'packages/core-*/**/ref.ts',
    'packages/core-*/**/translationRef.ts',
    'packages/core-*/**/messages.ts',
    'packages/core-*/**/data.json',
    // workspaces/ directory structure
    'workspaces/*/packages/plugin-*/**/translation.ts',
    'workspaces/*/packages/plugin-*/**/ref.ts',
    'workspaces/*/packages/plugin-*/**/translationRef.ts',
    'workspaces/*/packages/plugin-*/**/messages.ts',
    'workspaces/*/packages/plugin-*/**/data.json',
    'workspaces/*/packages/core-*/**/translation.ts',
    'workspaces/*/packages/core-*/**/ref.ts',
    'workspaces/*/packages/core-*/**/translationRef.ts',
    'workspaces/*/packages/core-*/**/messages.ts',
    'workspaces/*/packages/core-*/**/data.json',
    // Also check for alpha.ts files (some plugins export refs from alpha.ts)
    'plugins/*/packages/plugin-*/**/alpha.ts',
    'plugins/*/packages/core-*/**/alpha.ts',
    'packages/plugin-*/**/alpha.ts',
    'packages/core-*/**/alpha.ts',
    'workspaces/*/packages/plugin-*/**/alpha.ts',
    'workspaces/*/packages/core-*/**/alpha.ts',
  ];

  const pluginRefFiles: string[] = [];
  for (const pattern of patterns) {
    try {
      const files = glob.sync(pattern, {
        cwd: backstageRepoPath,
        ignore: [
          '**/build/**',
          '**/dist/**',
          '**/node_modules/**',
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/*.test.d.ts',
          '**/*.spec.d.ts',
        ],
        absolute: true,
      });
      // Filter files to only include those in paths containing 'translations' or 'i18n'
      // This matches the original: grep -E "(translations|i18n)"
      // Also filter out non-English language files (ONLY extract English messages)
      const filteredFiles = files.filter(
        file =>
          pathContainsTranslationsOrI18n(file) &&
          !isNonEnglishLanguageFile(file),
      );
      pluginRefFiles.push(...filteredFiles);
    } catch {
      // Skip patterns that don't match
      continue;
    }
  }

  // Remove duplicates
  return Array.from(new Set(pluginRefFiles));
}

/**
 * Extract plugin name from Backstage plugin package path
 * Handles Backstage repository structure: plugins/, packages/, workspaces/
 * Also supports legacy node_modules structure for backward compatibility
 */
function extractBackstagePluginName(filePath: string): string | null {
  // Helper: Map React variants to base plugin names (they share translations)
  const normalizePluginName = (name: string): string => {
    return name.endsWith('-react') ? name.replace(/-react$/, '') : name;
  };

  // Pattern 0: plugins/{name}/src/... (simpler structure: plugins/home/src/translation.ts)
  const simplePluginsMatch = /plugins\/([^/]+)\//.exec(filePath);
  if (simplePluginsMatch && filePath.includes('/src/')) {
    return normalizePluginName(simplePluginsMatch[1]);
  }

  // Pattern 1: plugins/{name}/packages/plugin-{name}/...
  const pluginsMatch = /plugins\/([^/]+)\/packages\/plugin-([^/]+)/.exec(
    filePath,
  );
  if (pluginsMatch) {
    return normalizePluginName(pluginsMatch[2]);
  }

  // Pattern 2: packages/plugin-{name}/...
  const packagesPluginMatch = /packages\/plugin-([^/]+)/.exec(filePath);
  if (packagesPluginMatch) {
    return normalizePluginName(packagesPluginMatch[1]);
  }

  // Pattern 3: packages/core-{name}/...
  const packagesCoreMatch = /packages\/core-([^/]+)/.exec(filePath);
  if (packagesCoreMatch) {
    return `core-${packagesCoreMatch[1]}`;
  }

  // Pattern 4: workspaces/{name}/packages/plugin-{name}/...
  const workspacesMatch = /workspaces\/([^/]+)\/packages\/plugin-([^/]+)/.exec(
    filePath,
  );
  if (workspacesMatch) {
    return normalizePluginName(workspacesMatch[2]);
  }

  // Pattern 5: Legacy node_modules/@backstage/plugin-{name}/... (backward compatibility)
  const nodeModulesPluginMatch = /@backstage\/plugin-([^/]+)/.exec(filePath);
  if (nodeModulesPluginMatch) {
    return normalizePluginName(nodeModulesPluginMatch[1]);
  }

  // Pattern 6: Legacy node_modules/@backstage/core-{name}/... (backward compatibility)
  const nodeModulesCoreMatch = /@backstage\/core-([^/]+)/.exec(filePath);
  if (nodeModulesCoreMatch) {
    return `core-${nodeModulesCoreMatch[1]}`;
  }

  return null;
}

/**
 * Check if a Backstage plugin is actually installed/used in the RHDH project
 * Checks:
 * 1. If plugin package exists in node_modules (already verified by finding ref files)
 * 2. If plugin is imported/referenced in app source code
 * 3. If plugin is listed in package.json dependencies
 */
function buildPackageName(pluginName: string): string {
  // Map plugin names to their package names
  // e.g., "home" -> "@backstage/plugin-home"
  // e.g., "catalog-graph" -> "@backstage/plugin-catalog-graph"
  // e.g., "core-components" -> "@backstage/core-components"
  return pluginName.startsWith('core-')
    ? `@backstage/${pluginName}`
    : `@backstage/plugin-${pluginName}`;
}

async function checkPackageJsonDependencies(
  packageJsonPath: string,
  packageName: string,
): Promise<boolean> {
  if (!(await fs.pathExists(packageJsonPath))) {
    return false;
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath);
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };
    return packageName in allDeps;
  } catch {
    return false;
  }
}

function buildPackagePatterns(
  pluginName: string,
  packageName: string,
): string[] {
  const patterns = [
    packageName,
    `backstage-plugin-${pluginName}`,
    `backstage/core-${pluginName.replace('core-', '')}`,
    `backstage-plugin-${pluginName}-react`,
    `plugin-${pluginName}-react`,
    packageName.replace('@backstage/', ''),
  ];

  // Special case: home plugin might be referenced via dynamic-home-page
  if (pluginName === 'home' || pluginName === 'home-react') {
    patterns.push('dynamic-home-page');
    patterns.push('backstage-plugin-dynamic-home-page');
  }

  return patterns;
}

function buildPluginIdPatterns(pluginName: string): string[] {
  return [
    `backstage.plugin-${pluginName}`,
    `backstage.core-${pluginName.replace('core-', '')}`,
  ];
}

function matchesPackagePattern(line: string, pattern: string): boolean {
  if (line.includes('backend') || line.includes('module')) {
    return false;
  }

  if (line.includes(pattern)) {
    return true;
  }

  // Check for local path format: ./dynamic-plugins/dist/backstage-plugin-{name}
  return (
    line.includes(`./dynamic-plugins/dist/${pattern}`) ||
    line.includes(`dynamic-plugins/dist/${pattern}`)
  );
}

function matchesPluginIdPattern(trimmedLine: string, pattern: string): boolean {
  return (
    trimmedLine.includes(`"${pattern}"`) || trimmedLine.includes(`'${pattern}'`)
  );
}

interface PluginEntry {
  startLine: number;
  disabled: boolean | null;
}

function parseDynamicPluginsFile(
  content: string,
  packagePatterns: string[],
  pluginIdPatterns: string[],
): boolean {
  const lines = content.split('\n');
  const pluginEntries: PluginEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    const matchesPackage = packagePatterns.some(pattern =>
      matchesPackagePattern(line, pattern),
    );
    const matchesPluginId = pluginIdPatterns.some(pattern =>
      matchesPluginIdPattern(trimmedLine, pattern),
    );

    if (
      matchesPackage ||
      (matchesPluginId && trimmedLine.startsWith('backstage.'))
    ) {
      pluginEntries.push({ startLine: i, disabled: null });
    }

    // Update disabled status for tracked entries
    for (const entry of pluginEntries) {
      if (i >= entry.startLine && i < entry.startLine + 10) {
        if (trimmedLine.startsWith('disabled:')) {
          entry.disabled = trimmedLine.includes('disabled: false')
            ? false
            : trimmedLine.includes('disabled: true');
        }
      }
    }
  }

  // Check if any entry is enabled (disabled: false or no disabled field)
  return pluginEntries.some(
    entry => entry.disabled === false || entry.disabled === null,
  );
}

async function checkDynamicPlugins(
  repoRoot: string,
  pluginName: string,
  packageName: string,
): Promise<boolean> {
  const dynamicPluginsPath = path.join(
    repoRoot,
    'dynamic-plugins.default.yaml',
  );

  if (!(await fs.pathExists(dynamicPluginsPath))) {
    return false;
  }

  try {
    const content = await fs.readFile(dynamicPluginsPath, 'utf-8');
    const packagePatterns = buildPackagePatterns(pluginName, packageName);
    const pluginIdPatterns = buildPluginIdPatterns(pluginName);
    return parseDynamicPluginsFile(content, packagePatterns, pluginIdPatterns);
  } catch {
    return false;
  }
}

async function checkSourceCodeImports(
  repoRoot: string,
  packageName: string,
): Promise<boolean> {
  const searchPatterns = [
    `packages/app/src/**/*.{ts,tsx,js,jsx}`,
    `packages/app/src/**/*.tsx`,
    `src/**/*.{ts,tsx,js,jsx}`,
  ];

  for (const pattern of searchPatterns) {
    try {
      const files = glob.sync(pattern, {
        cwd: repoRoot,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.test.*',
          '**/*.spec.*',
        ],
        absolute: true,
      });

      for (const file of files.slice(0, 50)) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          if (
            content.includes(`from '${packageName}'`) ||
            content.includes(`from "${packageName}"`) ||
            content.includes(`require('${packageName}')`) ||
            content.includes(`require("${packageName}")`) ||
            content.includes(`'${packageName}'`) ||
            content.includes(`"${packageName}"`)
          ) {
            return true;
          }
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  return false;
}

async function isPluginUsedInRhdh(
  pluginName: string,
  repoRoot: string,
): Promise<boolean> {
  const packageName = buildPackageName(pluginName);

  // Check if package exists in node_modules (basic check)
  const nodeModulesPath = path.join(repoRoot, 'node_modules', packageName);
  if (!(await fs.pathExists(nodeModulesPath))) {
    return false;
  }

  // Check if plugin is in package.json dependencies
  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (await checkPackageJsonDependencies(packageJsonPath, packageName)) {
    return true;
  }

  // Check app package.json (for monorepo structure)
  const appPackageJsonPath = path.join(
    repoRoot,
    'packages',
    'app',
    'package.json',
  );
  if (await checkPackageJsonDependencies(appPackageJsonPath, packageName)) {
    return true;
  }

  // Check dynamic-plugins.default.yaml for enabled plugins
  if (await checkDynamicPlugins(repoRoot, pluginName, packageName)) {
    return true;
  }

  // Check if plugin is imported/referenced in app source code
  if (await checkSourceCodeImports(repoRoot, packageName)) {
    return true;
  }

  // If we can't find evidence of usage, assume it's not used
  return false;
}

function findLanguageData(
  pluginData: Record<string, unknown>,
  isCorePlugins: boolean,
): Record<string, unknown> | null {
  // Prefer 'en' if available
  if (
    'en' in pluginData &&
    typeof pluginData.en === 'object' &&
    pluginData.en !== null
  ) {
    return pluginData.en as Record<string, unknown>;
  }

  if (isCorePlugins) {
    // For core-plugins, use first available language to extract key structure
    for (const [, langData] of Object.entries(pluginData)) {
      if (typeof langData === 'object' && langData !== null) {
        return langData as Record<string, unknown>;
      }
    }
  } else {
    // For RHDH files, fall back to any language if no 'en'
    for (const [lang, langData] of Object.entries(pluginData)) {
      if (typeof langData === 'object' && langData !== null && lang !== 'en') {
        return langData as Record<string, unknown>;
      }
    }
  }

  return null;
}

function extractKeysFromLanguageData(
  languageData: Record<string, unknown>,
  isCorePlugins: boolean,
  hasEnglish: boolean,
): Record<string, string> {
  const keys: Record<string, string> = {};

  for (const [key, value] of Object.entries(languageData)) {
    if (typeof value === 'string') {
      // For core-plugins files, if we're extracting from a non-English file,
      // use the key name as the English placeholder value
      keys[key] = isCorePlugins && !hasEnglish ? key : value;
    }
  }

  return keys;
}

function extractNestedStructure(
  data: Record<string, unknown>,
  isCorePlugins: boolean,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  for (const [pluginName, pluginData] of Object.entries(data)) {
    if (typeof pluginData !== 'object' || pluginData === null) {
      continue;
    }

    const languageData = findLanguageData(
      pluginData as Record<string, unknown>,
      isCorePlugins,
    );

    if (languageData) {
      const hasEnglish = 'en' in pluginData;
      result[pluginName] = extractKeysFromLanguageData(
        languageData,
        isCorePlugins,
        hasEnglish,
      );
    }
  }

  return result;
}

function extractFlatStructure(
  data: unknown,
  filePath: string,
): Record<string, Record<string, string>> {
  const translations =
    typeof data === 'object' && data !== null && 'translations' in data
      ? (data as { translations: Record<string, unknown> }).translations
      : (data as Record<string, unknown>);

  if (typeof translations !== 'object' || translations === null) {
    return {};
  }

  const pluginName = detectPluginName(filePath) || 'translations';
  const result: Record<string, Record<string, string>> = {};
  result[pluginName] = {};

  for (const [key, value] of Object.entries(translations)) {
    if (typeof value === 'string') {
      result[pluginName][key] = value;
    }
  }

  return result;
}

/**
 * Extract keys from JSON translation file
 * Handles both English files and translated files (extracts key structure)
 * For core-plugins files, extracts all keys from any language to build the structure
 */
async function extractKeysFromJsonFile(
  filePath: string,
  isCorePlugins: boolean = false,
): Promise<Record<string, Record<string, string>>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as unknown;

    // Handle nested structure: { plugin: { en: { key: value } } } or { plugin: { fr: { key: value } } }
    if (typeof data === 'object' && data !== null) {
      const nestedResult = extractNestedStructure(
        data as Record<string, unknown>,
        isCorePlugins,
      );
      if (Object.keys(nestedResult).length > 0) {
        return nestedResult;
      }
    }

    // Handle flat structure: { key: value } or { translations: { key: value } }
    return extractFlatStructure(data, filePath);
  } catch (error) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Could not extract keys from JSON file ${filePath}: ${error}`,
      ),
    );
    return {};
  }
}

/**
 * Detect plugin name from file path
 */
function detectPluginName(filePath: string): string | null {
  // Pattern 1: workspaces/{workspace}/plugins/{plugin}/...
  const workspaceRegex = /workspaces\/([^/]+)\/plugins\/([^/]+)/;
  const workspaceMatch = workspaceRegex.exec(filePath);
  if (workspaceMatch) {
    return workspaceMatch[2];
  }

  // Pattern 2: .../translations/{plugin}/ref.ts
  const translationsRegex = /translations\/([^/]+)\//;
  const translationsMatch = translationsRegex.exec(filePath);
  if (translationsMatch) {
    return translationsMatch[1];
  }

  // Pattern 3: Fallback - use parent directory name
  const dirName = path.dirname(filePath);
  const parentDir = path.basename(dirName);
  if (parentDir === 'translations' || parentDir.includes('translation')) {
    const grandParentDir = path.basename(path.dirname(dirName));
    return grandParentDir;
  }

  return parentDir;
}

/**
 * Invalid plugin names to filter out
 */
const INVALID_PLUGIN_NAMES = new Set([
  'dist',
  'build',
  'node_modules',
  'packages',
  'src',
  'lib',
  'components',
  'utils',
]);

/**
 * Extract translation keys and group by plugin
 */
function validatePluginName(
  pluginName: string | null,
  filePath: string,
): pluginName is string {
  if (!pluginName) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Could not determine plugin name for ${path.relative(
          process.cwd(),
          filePath,
        )}, skipping`,
      ),
    );
    return false;
  }

  if (INVALID_PLUGIN_NAMES.has(pluginName.toLowerCase())) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Skipping invalid plugin name "${pluginName}" from ${path.relative(
          process.cwd(),
          filePath,
        )}`,
      ),
    );
    return false;
  }

  return true;
}

function mergeKeysIntoPluginGroup(
  pluginGroups: Record<string, Record<string, string>>,
  pluginName: string,
  keys: Record<string, string>,
  filePath: string,
): void {
  if (!pluginGroups[pluginName]) {
    pluginGroups[pluginName] = {};
  }

  const overwrittenKeys: string[] = [];
  for (const [key, value] of Object.entries(keys)) {
    const stringValue = String(value);
    if (
      pluginGroups[pluginName][key] &&
      pluginGroups[pluginName][key] !== stringValue
    ) {
      overwrittenKeys.push(key);
    }
    pluginGroups[pluginName][key] = stringValue;
  }

  if (overwrittenKeys.length > 0) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: ${
          overwrittenKeys.length
        } keys were overwritten in plugin "${pluginName}" from ${path.relative(
          process.cwd(),
          filePath,
        )}`,
      ),
    );
  }
}

async function processSourceFile(
  filePath: string,
  pluginGroups: Record<string, Record<string, string>>,
): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const extractResult = extractTranslationKeys(content, filePath);
    const keys = extractResult.keys;

    // Use plugin ID from createTranslationRef if available, otherwise use file path
    const pluginName = extractResult.pluginId || detectPluginName(filePath);

    if (!validatePluginName(pluginName, filePath)) {
      return;
    }

    mergeKeysIntoPluginGroup(pluginGroups, pluginName, keys, filePath);
  } catch (error) {
    console.warn(
      chalk.yellow(`⚠️  Warning: Could not process ${filePath}: ${error}`),
    );
  }
}

function convertToStructuredData(
  pluginGroups: Record<string, Record<string, string>>,
): Record<string, { en: Record<string, string> }> {
  const structuredData: Record<string, { en: Record<string, string> }> = {};
  for (const [pluginName, keys] of Object.entries(pluginGroups)) {
    structuredData[pluginName] = { en: keys };
  }
  return structuredData;
}

async function extractAndGroupKeys(
  sourceFiles: string[],
): Promise<Record<string, { en: Record<string, string> }>> {
  const pluginGroups: Record<string, Record<string, string>> = {};

  for (const filePath of sourceFiles) {
    await processSourceFile(filePath, pluginGroups);
  }

  return convertToStructuredData(pluginGroups);
}

/**
 * Generate or merge translation files
 */
async function generateOrMergeFiles(
  translationKeys:
    | Record<string, string>
    | Record<string, { en: Record<string, string> }>,
  outputPath: string,
  formatStr: string,
  mergeExisting: boolean,
): Promise<void> {
  if (mergeExisting && (await fs.pathExists(outputPath))) {
    console.log(chalk.yellow(`🔄 Merging with existing ${outputPath}...`));
    await mergeTranslationFiles(translationKeys, outputPath, formatStr);
  } else {
    console.log(chalk.yellow(`📝 Generating ${outputPath}...`));
    await generateTranslationFiles(translationKeys, outputPath, formatStr);
  }
}

/**
 * Validate generated file
 */
async function validateGeneratedFile(
  outputPath: string,
  formatStr: string,
): Promise<void> {
  if (formatStr !== 'json') {
    return;
  }

  console.log(chalk.yellow(`🔍 Validating generated file...`));
  const { validateTranslationFile } = await import('../lib/i18n/validateFile');
  const isValid = await validateTranslationFile(outputPath);
  if (!isValid) {
    throw new Error(`Generated file failed validation: ${outputPath}`);
  }
  console.log(chalk.green(`✅ Generated file is valid`));
}

/**
 * Display summary of included plugins
 */
function displaySummary(
  translationKeys: Record<string, { en: Record<string, string> }>,
): void {
  console.log(chalk.blue('\n📋 Included Plugins Summary:'));
  console.log(chalk.gray('─'.repeat(60)));

  const plugins = Object.entries(translationKeys)
    .map(([pluginName, pluginData]) => ({
      name: pluginName,
      keyCount: Object.keys(pluginData.en || {}).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let totalKeys = 0;
  for (const plugin of plugins) {
    const keyLabel = plugin.keyCount === 1 ? 'key' : 'keys';
    console.log(
      chalk.cyan(
        `  • ${plugin.name.padEnd(35)} ${chalk.yellow(
          plugin.keyCount.toString().padStart(4),
        )} ${keyLabel}`,
      ),
    );
    totalKeys += plugin.keyCount;
  }

  console.log(chalk.gray('─'.repeat(60)));
  const pluginLabel = plugins.length === 1 ? 'plugin' : 'plugins';
  const totalKeyLabel = totalKeys === 1 ? 'key' : 'keys';
  console.log(
    chalk.cyan(
      `  Total: ${chalk.yellow(
        plugins.length.toString(),
      )} ${pluginLabel}, ${chalk.yellow(
        totalKeys.toString(),
      )} ${totalKeyLabel}`,
    ),
  );
  console.log('');
}

function validateSprintOptions(
  outputFilename: string | undefined,
  sprint: string | undefined,
): void {
  if (!outputFilename && !sprint) {
    throw new Error(
      '--sprint is required. Please provide a sprint value (e.g., --sprint s3285)',
    );
  }

  if (sprint && !/^s?\d+$/i.test(sprint)) {
    throw new Error(
      `Invalid sprint format: "${sprint}". Sprint should be in format "s3285" or "3285"`,
    );
  }
}

function getBackstageRepoPath(
  opts: OptionValues,
  config: Awaited<ReturnType<typeof loadI18nConfig>>,
): string | null {
  return (
    (opts.backstageRepoPath as string | undefined) ||
    config.backstageRepoPath ||
    process.env.BACKSTAGE_REPO_PATH ||
    null
  );
}

function mapPluginName(pluginName: string, refFile: string): string {
  let mapped = pluginName.replace(/^plugin-/, '');

  if (pluginName === 'plugin-home-react' || refFile.includes('home-react')) {
    mapped = 'home-react';
  } else if (pluginName === 'plugin-home') {
    mapped = 'home';
  }

  return mapped;
}

async function extractKeysFromDataJson(
  refFile: string,
): Promise<{ keys: Record<string, string>; pluginName: string | null }> {
  const keys: Record<string, string> = {};
  const jsonContent = await fs.readJson(refFile);

  if (typeof jsonContent === 'object' && jsonContent !== null) {
    for (const [key, value] of Object.entries(jsonContent)) {
      if (typeof value === 'string') {
        keys[key] = value;
      } else if (
        typeof value === 'object' &&
        value !== null &&
        'defaultMessage' in value
      ) {
        keys[key] = (value as { defaultMessage: string }).defaultMessage;
      }
    }
  }

  const pluginName = extractBackstagePluginName(refFile);
  return { keys, pluginName };
}

async function extractKeysFromRefFile(
  refFile: string,
): Promise<{ keys: Record<string, string>; pluginName: string | null }> {
  if (refFile.endsWith('data.json')) {
    return extractKeysFromDataJson(refFile);
  }

  const content = await fs.readFile(refFile, 'utf-8');
  const extractResult = extractTranslationKeys(content, refFile);
  const pluginName =
    extractResult.pluginId || extractBackstagePluginName(refFile);

  return { keys: extractResult.keys, pluginName };
}

async function checkPluginUsage(
  pluginRefFiles: string[],
  rhdhRepoPath: string,
): Promise<{ usedPlugins: Set<string>; unusedPlugins: Set<string> }> {
  const usedPlugins = new Set<string>();
  const unusedPlugins = new Set<string>();

  for (const refFile of pluginRefFiles) {
    try {
      const pluginName = extractBackstagePluginName(refFile);
      if (!pluginName) continue;

      const mappedPluginName = mapPluginName(pluginName, refFile);
      const isUsed = await isPluginUsedInRhdh(mappedPluginName, rhdhRepoPath);

      if (isUsed) {
        usedPlugins.add(mappedPluginName);
      } else {
        unusedPlugins.add(mappedPluginName);
      }
    } catch {
      continue;
    }
  }

  return { usedPlugins, unusedPlugins };
}

async function extractKeysFromCorePluginRefs(
  pluginRefFiles: string[],
  shouldFilterByUsage: boolean,
  usedPlugins: Set<string>,
  communityPluginsRoot?: string | null,
): Promise<Record<string, { en: Record<string, string> }>> {
  const structuredData: Record<string, { en: Record<string, string> }> = {};

  // Check if we're scanning community-plugins repo (has workspaces/plugins structure, not workspaces/packages)
  const isCommunityPluginsRepo =
    communityPluginsRoot &&
    pluginRefFiles.some(
      file =>
        file.includes('workspaces/') &&
        file.includes('/plugins/') &&
        !file.includes('/packages/'),
    );

  let filteredCount = 0;
  for (const refFile of pluginRefFiles) {
    try {
      const { keys, pluginName } = await extractKeysFromRefFile(refFile);

      if (!pluginName || Object.keys(keys).length === 0) {
        continue;
      }

      const mappedPluginName = mapPluginName(pluginName, refFile);

      // Filter: Only include Red Hat owned plugins when scanning community-plugins repo
      if (isCommunityPluginsRepo && communityPluginsRoot) {
        if (!isRedHatOwnedPlugin(mappedPluginName, communityPluginsRoot)) {
          filteredCount++;
          continue;
        }
      }

      if (shouldFilterByUsage && !usedPlugins.has(mappedPluginName)) {
        continue;
      }

      if (!structuredData[mappedPluginName]) {
        structuredData[mappedPluginName] = { en: {} };
      }

      for (const [key, value] of Object.entries(keys)) {
        if (!structuredData[mappedPluginName].en[key]) {
          structuredData[mappedPluginName].en[key] = value;
        }
      }
    } catch (error) {
      console.warn(
        chalk.yellow(
          `⚠️  Warning: Could not extract from ${refFile}: ${error}`,
        ),
      );
    }
  }

  if (isCommunityPluginsRepo && filteredCount > 0) {
    console.log(
      chalk.gray(
        `  Filtered out ${filteredCount} non-Red Hat owned plugin(s) from community-plugins repo`,
      ),
    );
  }

  return structuredData;
}

function filterTranslatedFiles(
  files: string[],
  outputDirPath: string,
  outputFileName: string,
): string[] {
  return files.filter(file => {
    const fileName = path.basename(file);

    if (file.startsWith(outputDirPath) && fileName === outputFileName) {
      return false;
    }

    if (
      fileName.includes('reference') ||
      fileName.includes('core-plugins-reference')
    ) {
      return false;
    }

    return true;
  });
}

async function findCorePluginsTranslatedFiles(
  repoRoot: string,
  outputDir: string,
): Promise<string[]> {
  const corePluginsJsonPatterns = [
    'translations/core-plugins*.json',
    'translations/**/core-plugins*.json',
  ];

  const translatedFiles: string[] = [];
  const outputDirPath = path.resolve(repoRoot, String(outputDir || 'i18n'));
  const outputFileName = 'core-plugins-reference.json';

  for (const pattern of corePluginsJsonPatterns) {
    try {
      const files = glob.sync(pattern, {
        cwd: repoRoot,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/test/**',
        ],
        absolute: true,
      });

      const filteredFiles = filterTranslatedFiles(
        files,
        outputDirPath,
        outputFileName,
      );
      translatedFiles.push(...filteredFiles);
    } catch {
      // Ignore if pattern doesn't match
    }
  }

  return translatedFiles;
}

async function extractKeysFromTranslatedFiles(
  translatedFiles: string[],
  repoRoot: string,
): Promise<Record<string, Record<string, string>>> {
  const structuredData: Record<string, Record<string, string>> = {};

  for (const translatedFile of translatedFiles) {
    console.log(
      chalk.gray(`  Processing: ${path.relative(repoRoot, translatedFile)}`),
    );

    const translatedKeys = await extractKeysFromJsonFile(translatedFile, true);

    const totalKeys = Object.values(translatedKeys).reduce(
      (sum, keys) => sum + Object.keys(keys).length,
      0,
    );
    const pluginCount = Object.keys(translatedKeys).length;
    console.log(
      chalk.gray(
        `    Extracted ${totalKeys} keys from ${pluginCount} plugin${
          pluginCount !== 1 ? 's' : ''
        }`,
      ),
    );

    for (const [pluginName, pluginKeys] of Object.entries(translatedKeys)) {
      if (!structuredData[pluginName]) {
        structuredData[pluginName] = {};
      }

      for (const [key, value] of Object.entries(pluginKeys)) {
        if (!structuredData[pluginName][key]) {
          structuredData[pluginName][key] = value;
        }
      }
    }
  }

  return structuredData;
}

async function processCorePlugins(
  backstageRepoPath: string,
  repoRoot: string,
  outputDir: string,
): Promise<Record<string, { en: Record<string, string> }>> {
  console.log(
    chalk.yellow(
      `📁 Scanning Backstage plugin packages in: ${backstageRepoPath}`,
    ),
  );

  const pluginRefFiles = await findBackstagePluginTranslationRefs(
    backstageRepoPath,
  );
  console.log(
    chalk.gray(
      `Found ${pluginRefFiles.length} Backstage plugin translation ref files`,
    ),
  );

  const structuredData: Record<string, { en: Record<string, string> }> = {};

  if (pluginRefFiles.length === 0) {
    return structuredData;
  }

  const rhdhRepoPath = process.env.RHDH_REPO_PATH || null;
  const shouldFilterByUsage = Boolean(rhdhRepoPath);
  let usedPlugins = new Set<string>();

  if (shouldFilterByUsage) {
    console.log(
      chalk.yellow(`🔍 Checking which plugins are actually used in RHDH...`),
    );

    const { usedPlugins: checkedUsed, unusedPlugins } = await checkPluginUsage(
      pluginRefFiles,
      rhdhRepoPath!,
    );

    usedPlugins = checkedUsed;

    if (unusedPlugins.size > 0) {
      console.log(
        chalk.gray(
          `  Skipping ${unusedPlugins.size} unused plugin(s): ${Array.from(
            unusedPlugins,
          )
            .slice(0, 5)
            .join(', ')}${unusedPlugins.size > 5 ? '...' : ''}`,
        ),
      );
    }
    console.log(
      chalk.gray(`  Found ${usedPlugins.size} plugin(s) actually used in RHDH`),
    );
  } else {
    console.log(
      chalk.yellow(
        `📦 Extracting all Backstage core plugins (RHDH_REPO_PATH not set, skipping usage filter)...`,
      ),
    );
  }

  // Check if we're scanning community-plugins repo (has workspaces/plugins structure)
  // If so, we need to filter to only Red Hat owned plugins
  const isCommunityPluginsRepo = pluginRefFiles.some(
    file =>
      file.includes('workspaces/') &&
      file.includes('/plugins/') &&
      !file.includes('/packages/'),
  );
  const communityPluginsRoot = isCommunityPluginsRepo
    ? backstageRepoPath
    : null;

  if (isCommunityPluginsRepo) {
    console.log(
      chalk.yellow(
        `🔍 Detected community-plugins repo - filtering to Red Hat owned plugins only...`,
      ),
    );
  }

  const refData = await extractKeysFromCorePluginRefs(
    pluginRefFiles,
    shouldFilterByUsage,
    usedPlugins,
    communityPluginsRoot,
  );

  Object.assign(structuredData, refData);

  const pluginCount = Object.keys(structuredData).length;
  if (isCommunityPluginsRepo) {
    console.log(
      chalk.green(
        `✅ Extracted keys from ${pluginCount} Red Hat owned plugin(s) in community-plugins repo`,
      ),
    );
  } else {
    console.log(
      chalk.green(
        `✅ Extracted keys from ${usedPlugins.size} Backstage plugin packages used in RHDH`,
      ),
    );
  }

  const translatedFiles = await findCorePluginsTranslatedFiles(
    repoRoot,
    outputDir,
  );

  if (translatedFiles.length > 0) {
    console.log(
      chalk.yellow(
        `📁 Scanning ${translatedFiles.length} existing core-plugins file(s) to extract translation keys...`,
      ),
    );

    const translatedData = await extractKeysFromTranslatedFiles(
      translatedFiles,
      repoRoot,
    );

    // Filter: Only include Red Hat owned plugins when scanning community-plugins repo
    let filteredTranslatedCount = 0;
    for (const [pluginName, pluginKeys] of Object.entries(translatedData)) {
      if (isCommunityPluginsRepo && communityPluginsRoot) {
        if (!isRedHatOwnedPlugin(pluginName, communityPluginsRoot)) {
          filteredTranslatedCount++;
          continue;
        }
      }

      if (!structuredData[pluginName]) {
        structuredData[pluginName] = { en: {} };
      }

      for (const [key, value] of Object.entries(pluginKeys)) {
        if (!structuredData[pluginName].en[key]) {
          structuredData[pluginName].en[key] = value;
        }
      }
    }

    if (isCommunityPluginsRepo && filteredTranslatedCount > 0) {
      console.log(
        chalk.gray(
          `  Filtered out ${filteredTranslatedCount} non-Red Hat owned plugin(s) from translated files`,
        ),
      );
    }

    console.log(
      chalk.green(
        `✅ Extracted keys from ${translatedFiles.length} existing core-plugins translation file(s)`,
      ),
    );
  }

  return structuredData;
}

function filterRhdhPlugins(
  rhdhData: Record<string, { en: Record<string, string> }>,
): Record<string, { en: Record<string, string> }> {
  const backstageCorePlugins = new Set([
    'home',
    'catalog-graph',
    'api-docs',
    'kubernetes',
    'kubernetes-cluster',
    'techdocs',
    'home-react',
    'catalog-react',
    'org',
    'search-react',
    'kubernetes-react',
    'scaffolder-react',
  ]);

  const rhdhPlugins: Record<string, { en: Record<string, string> }> = {};

  for (const [pluginName, pluginData] of Object.entries(rhdhData)) {
    if (
      !backstageCorePlugins.has(pluginName) ||
      pluginName === 'catalog' ||
      pluginName === 'scaffolder' ||
      pluginName === 'search' ||
      pluginName === 'core-components' ||
      pluginName === 'catalog-import' ||
      pluginName === 'user-settings'
    ) {
      rhdhPlugins[pluginName] = pluginData;
    }
  }

  return rhdhPlugins;
}

async function processRhdhPlugins(
  sourceDir: string,
  includePattern: string,
  excludePattern: string,
): Promise<Record<string, { en: Record<string, string> }>> {
  console.log(chalk.yellow(`📁 Scanning ${sourceDir} for translation keys...`));

  const allSourceFiles = glob.sync(includePattern, {
    cwd: sourceDir,
    ignore: excludePattern,
    absolute: true,
  });

  const sourceFiles = await findEnglishReferenceFiles(
    sourceDir,
    includePattern,
    excludePattern,
  );

  console.log(
    chalk.gray(
      `Found ${allSourceFiles.length} files, ${sourceFiles.length} are English reference files`,
    ),
  );

  const rhdhData = await extractAndGroupKeys(sourceFiles);

  console.log(chalk.yellow(`📁 Scanning for JSON translation files...`));
  const jsonFiles = await findJsonTranslationFiles(sourceDir);
  console.log(chalk.gray(`Found ${jsonFiles.length} JSON translation files`));

  if (jsonFiles.length > 0) {
    for (const jsonFile of jsonFiles) {
      const jsonKeys = await extractKeysFromJsonFile(jsonFile);
      for (const [pluginName, keys] of Object.entries(jsonKeys)) {
        if (!rhdhData[pluginName]) {
          rhdhData[pluginName] = { en: {} };
        }
        for (const [key, value] of Object.entries(keys)) {
          if (!rhdhData[pluginName].en[key]) {
            rhdhData[pluginName].en[key] = value;
          }
        }
      }
    }
    console.log(
      chalk.green(
        `✅ Merged keys from ${jsonFiles.length} JSON translation files`,
      ),
    );
  }

  return filterRhdhPlugins(rhdhData);
}

function generateFilename(
  outputFilename: string | undefined,
  sprint: string | undefined,
  corePlugins: boolean,
  backstageRepoPath: string | null,
): string {
  if (outputFilename) {
    return outputFilename.replace(/\.json$/, '');
  }

  if (!sprint) {
    throw new Error(
      'Sprint value is required. Please provide --sprint option (e.g., --sprint s3285)',
    );
  }

  const normalizedSprint =
    sprint.startsWith('s') || sprint.startsWith('S')
      ? sprint.toLowerCase()
      : `s${sprint}`;

  const repoName =
    corePlugins && backstageRepoPath
      ? detectRepoName(backstageRepoPath)
      : detectRepoName();

  return `${repoName.toLowerCase()}-${normalizedSprint}`;
}

function getOutputDirectory(
  corePlugins: boolean,
  backstageRepoPath: string | null,
  outputDir: string,
): string {
  if (corePlugins && backstageRepoPath) {
    return path.join(backstageRepoPath, 'i18n');
  }
  return String(outputDir || 'i18n');
}

export async function generateCommand(opts: OptionValues): Promise<void> {
  const corePlugins = Boolean(opts.corePlugins) || opts.corePlugins === 'true';
  const outputFilename = opts.outputFilename as string | undefined;
  const sprint = opts.sprint as string | undefined;

  validateSprintOptions(outputFilename, sprint);

  if (corePlugins) {
    console.log(
      chalk.blue('🌍 Generating core-plugins translation reference file...'),
    );
  } else {
    console.log(chalk.blue('🌍 Generating RHDH translation reference file...'));
  }

  const config = await loadI18nConfig();
  const mergedOpts = await mergeConfigWithOptions(config, opts);

  const {
    sourceDir = 'src',
    outputDir = 'i18n',
    format = 'json',
    includePattern = '**/*.{ts,tsx,js,jsx}',
    excludePattern = '**/node_modules/**',
    extractKeys = true,
    mergeExisting = false,
  } = mergedOpts as {
    sourceDir?: string;
    outputDir?: string;
    format?: string;
    includePattern?: string;
    excludePattern?: string;
    extractKeys?: boolean;
    mergeExisting?: boolean;
  };

  try {
    await fs.ensureDir(outputDir);

    const translationKeys: Record<string, { en: Record<string, string> }> = {};
    const backstageRepoPath = getBackstageRepoPath(opts, config);

    if (extractKeys) {
      const repoRoot = process.cwd();
      let structuredData: Record<string, { en: Record<string, string> }>;

      if (corePlugins) {
        if (!backstageRepoPath) {
          console.error(
            chalk.red(
              '❌ Backstage repository path is required for --core-plugins mode',
            ),
          );
          console.error(
            chalk.yellow(
              '   Please provide one of:\n' +
                '     1. --backstage-repo-path <path>\n' +
                '     2. Add "backstageRepoPath" to .i18n.config.json\n' +
                '     3. Set BACKSTAGE_REPO_PATH environment variable',
            ),
          );
          process.exit(1);
        }

        structuredData = await processCorePlugins(
          backstageRepoPath,
          repoRoot,
          outputDir,
        );

        console.log(
          chalk.gray(
            `  Including all ${
              Object.keys(structuredData).length
            } core plugins (including React versions with unique translations)`,
          ),
        );
      } else {
        structuredData = await processRhdhPlugins(
          sourceDir,
          includePattern,
          excludePattern,
        );
      }

      const totalKeys = Object.values(structuredData).reduce(
        (sum, pluginData) => sum + Object.keys(pluginData.en || {}).length,
        0,
      );
      console.log(
        chalk.green(
          `✅ Extracted ${totalKeys} translation keys from ${
            Object.keys(structuredData).length
          } plugins`,
        ),
      );

      Object.assign(translationKeys, structuredData);
    }

    const formatStr = String(format || 'json');
    const filename = generateFilename(
      outputFilename,
      sprint,
      corePlugins,
      backstageRepoPath,
    );
    const finalOutputDir = getOutputDirectory(
      corePlugins,
      backstageRepoPath,
      outputDir,
    );

    if (corePlugins && backstageRepoPath) {
      await fs.ensureDir(finalOutputDir);
    }

    const outputPath = path.join(finalOutputDir, `${filename}.${formatStr}`);

    // Always pass as nested structure to match reference.json format
    await generateOrMergeFiles(
      translationKeys as Record<string, { en: Record<string, string> }>,
      outputPath,
      formatStr,
      mergeExisting,
    );

    await validateGeneratedFile(outputPath, formatStr);

    if (extractKeys && isNestedStructure(translationKeys)) {
      displaySummary(
        translationKeys as Record<string, { en: Record<string, string> }>,
      );
    }

    console.log(
      chalk.green(`✅ Translation reference files generated successfully!`),
    );
    console.log(chalk.gray(`   Output: ${outputPath}`));

    if (extractKeys && isNestedStructure(translationKeys)) {
      const totalKeys = Object.values(
        translationKeys as Record<string, { en: Record<string, string> }>,
      ).reduce(
        (sum, pluginData) => sum + Object.keys(pluginData.en || {}).length,
        0,
      );
      console.log(
        chalk.gray(`   Plugins: ${Object.keys(translationKeys).length}`),
      );
      console.log(chalk.gray(`   Keys: ${totalKeys}`));
    } else {
      console.log(
        chalk.gray(`   Keys: ${Object.keys(translationKeys).length}`),
      );
    }
  } catch (error) {
    console.error(chalk.red('❌ Error generating translation files:'), error);
    throw error;
  }
}
