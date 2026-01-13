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

import {
  extractTranslationKeys,
  type ExtractResult,
} from '../lib/i18n/extractKeys';
import { generateTranslationFiles } from '../lib/i18n/generateFiles';
import { mergeTranslationFiles } from '../lib/i18n/mergeFiles';
import { loadI18nConfig, mergeConfigWithOptions } from '../lib/i18n/config';
import { safeExecSyncOrThrow } from '../lib/utils/exec';

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
  // Pattern 0: plugins/{name}/src/... (simpler structure: plugins/home/src/translation.ts)
  const simplePluginsMatch = /plugins\/([^/]+)\//.exec(filePath);
  if (simplePluginsMatch && filePath.includes('/src/')) {
    let pluginName = simplePluginsMatch[1];
    // Map React variants to base plugin names (they share translations)
    if (pluginName.endsWith('-react')) {
      pluginName = pluginName.replace(/-react$/, '');
    }
    return pluginName;
  }

  // Pattern 1: plugins/{name}/packages/plugin-{name}/...
  const pluginsMatch = /plugins\/([^/]+)\/packages\/plugin-([^/]+)/.exec(
    filePath,
  );
  if (pluginsMatch) {
    let pluginName = pluginsMatch[2];
    // Map React variants to base plugin names (they share translations)
    if (pluginName.endsWith('-react')) {
      pluginName = pluginName.replace(/-react$/, '');
    }
    return pluginName;
  }

  // Pattern 2: packages/plugin-{name}/...
  const packagesPluginMatch = /packages\/plugin-([^/]+)/.exec(filePath);
  if (packagesPluginMatch) {
    let pluginName = packagesPluginMatch[1];
    if (pluginName.endsWith('-react')) {
      pluginName = pluginName.replace(/-react$/, '');
    }
    return pluginName;
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
    let pluginName = workspacesMatch[2];
    if (pluginName.endsWith('-react')) {
      pluginName = pluginName.replace(/-react$/, '');
    }
    return pluginName;
  }

  // Pattern 5: Legacy node_modules/@backstage/plugin-{name}/... (backward compatibility)
  const nodeModulesPluginMatch = /@backstage\/plugin-([^/]+)/.exec(filePath);
  if (nodeModulesPluginMatch) {
    let pluginName = nodeModulesPluginMatch[1];
    if (pluginName.endsWith('-react')) {
      pluginName = pluginName.replace(/-react$/, '');
    }
    return pluginName;
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
async function isPluginUsedInRhdh(
  pluginName: string,
  repoRoot: string,
): Promise<boolean> {
  // Map plugin names to their package names
  // e.g., "home" -> "@backstage/plugin-home"
  // e.g., "catalog-graph" -> "@backstage/plugin-catalog-graph"
  // e.g., "core-components" -> "@backstage/core-components"
  let packageName: string;
  if (pluginName.startsWith('core-')) {
    packageName = `@backstage/${pluginName}`;
  } else {
    packageName = `@backstage/plugin-${pluginName}`;
  }

  // Check if package exists in node_modules (basic check)
  const nodeModulesPath = path.join(repoRoot, 'node_modules', packageName);
  if (!(await fs.pathExists(nodeModulesPath))) {
    return false;
  }

  // Check if plugin is in package.json dependencies
  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };
      if (packageName in allDeps) {
        return true;
      }
    } catch {
      // If we can't read package.json, continue with other checks
    }
  }

  // Check app package.json (for monorepo structure)
  const appPackageJsonPath = path.join(
    repoRoot,
    'packages',
    'app',
    'package.json',
  );
  if (await fs.pathExists(appPackageJsonPath)) {
    try {
      const appPackageJson = await fs.readJson(appPackageJsonPath);
      const allDeps = {
        ...appPackageJson.dependencies,
        ...appPackageJson.devDependencies,
        ...appPackageJson.peerDependencies,
      };
      if (packageName in allDeps) {
        return true;
      }
    } catch {
      // If we can't read app package.json, continue
    }
  }

  // Check dynamic-plugins.default.yaml for enabled plugins
  // Plugins can be installed via dynamic plugins even if not in package.json
  // Parse YAML file as text to check for enabled plugins (disabled: false or no disabled field)
  const dynamicPluginsPath = path.join(
    repoRoot,
    'dynamic-plugins.default.yaml',
  );
  if (await fs.pathExists(dynamicPluginsPath)) {
    try {
      const content = await fs.readFile(dynamicPluginsPath, 'utf-8');
      const lines = content.split('\n');

      // Patterns to match the plugin package
      // Handle various package name formats:
      // - OCI: oci://quay.io/rhdh/backstage-plugin-techdocs:...
      // - Local: ./dynamic-plugins/dist/backstage-plugin-techdocs
      // - Package: @backstage/plugin-techdocs
      // - React variants: @backstage/plugin-techdocs-react (uses techdocs translations)
      const packagePatterns = [
        packageName,
        `backstage-plugin-${pluginName}`, // Matches: backstage-plugin-techdocs
        `backstage/core-${pluginName.replace('core-', '')}`,
        // Also check for React variants (techdocs-react uses techdocs translations)
        `backstage-plugin-${pluginName}-react`,
        `plugin-${pluginName}-react`,
        // Handle package name without @backstage/ prefix (for dynamic-plugins format)
        packageName.replace('@backstage/', ''),
      ];

      // Also check for plugin IDs in config (e.g., "backstage.plugin-home", "backstage.plugin-techdocs")
      const pluginIdPatterns = [
        `backstage.plugin-${pluginName}`,
        `backstage.core-${pluginName.replace('core-', '')}`,
      ];

      // Special case: home plugin might be referenced via dynamic-home-page or home page mount points
      if (pluginName === 'home' || pluginName === 'home-react') {
        packagePatterns.push('dynamic-home-page');
        packagePatterns.push('backstage-plugin-dynamic-home-page');
      }

      // Track all plugin entries and their disabled status
      const pluginEntries: Array<{
        startLine: number;
        disabled: boolean | null;
      }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Check if this line contains the package name (starts a new plugin entry)
        // Handle both OCI format (oci://...) and local path format (./dynamic-plugins/...)
        const matchesPackage = packagePatterns.some(pattern => {
          if (line.includes('backend') || line.includes('module')) {
            return false;
          }
          // Check for direct pattern match
          if (line.includes(pattern)) {
            return true;
          }
          // Check for local path format: ./dynamic-plugins/dist/backstage-plugin-{name}
          if (
            line.includes(`./dynamic-plugins/dist/${pattern}`) ||
            line.includes(`dynamic-plugins/dist/${pattern}`)
          ) {
            return true;
          }
          return false;
        });
        const matchesPluginId = pluginIdPatterns.some(
          pattern =>
            trimmedLine.includes(`"${pattern}"`) ||
            trimmedLine.includes(`'${pattern}'`),
        );

        if (
          matchesPackage ||
          (matchesPluginId && trimmedLine.startsWith('backstage.'))
        ) {
          // Found a plugin entry - track it
          pluginEntries.push({ startLine: i, disabled: null });
        }

        // For each tracked entry, check for disabled field in the following lines
        for (const entry of pluginEntries) {
          if (i >= entry.startLine && i < entry.startLine + 10) {
            // Check within 10 lines of the package declaration
            if (trimmedLine.startsWith('disabled:')) {
              entry.disabled = trimmedLine.includes('disabled: true');
              // If we find disabled: false, this entry is enabled
              if (trimmedLine.includes('disabled: false')) {
                entry.disabled = false;
              }
            }
          }
        }
      }

      // Check if any entry is enabled (disabled: false or no disabled field)
      for (const entry of pluginEntries) {
        if (entry.disabled === false || entry.disabled === null) {
          return true;
        }
      }
    } catch {
      // Skip if we can't read/parse the file
    }
  }

  // Check if plugin is imported/referenced in app source code
  // Look for imports like: from '@backstage/plugin-{name}' or '@backstage/core-{name}'
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

      // Check first 50 files for performance (plugins are usually imported early)
      for (const file of files.slice(0, 50)) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          // Check for import statements
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
          // Skip files that can't be read
          continue;
        }
      }
    } catch {
      // Skip patterns that don't match
      continue;
    }
  }

  // If we can't find evidence of usage, assume it's not used
  // This is conservative - we'd rather exclude unused plugins than include them
  return false;
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
      const result: Record<string, Record<string, string>> = {};

      for (const [pluginName, pluginData] of Object.entries(data)) {
        if (typeof pluginData !== 'object' || pluginData === null) {
          continue;
        }

        // For core-plugins, extract from any language (they all have the same keys)
        // For RHDH files, prefer 'en' but fall back to other languages
        let languageData: Record<string, unknown> | null = null;

        if (
          'en' in pluginData &&
          typeof pluginData.en === 'object' &&
          pluginData.en !== null
        ) {
          languageData = pluginData.en as Record<string, unknown>;
        } else if (isCorePlugins) {
          // For core-plugins, use first available language to extract key structure
          for (const [lang, langData] of Object.entries(pluginData)) {
            if (typeof langData === 'object' && langData !== null) {
              languageData = langData as Record<string, unknown>;
              break;
            }
          }
        } else {
          // For RHDH files, fall back to any language if no 'en'
          for (const [lang, langData] of Object.entries(pluginData)) {
            if (
              typeof langData === 'object' &&
              langData !== null &&
              lang !== 'en'
            ) {
              languageData = langData as Record<string, unknown>;
              break;
            }
          }
        }

        if (languageData) {
          result[pluginName] = {};
          for (const [key, value] of Object.entries(languageData)) {
            if (typeof value === 'string') {
              // For core-plugins files, if we're extracting from a non-English file,
              // use the key name as the English placeholder value
              // This allows us to build the structure even from translated files
              if (isCorePlugins && !('en' in pluginData)) {
                // Use key as placeholder - the actual English will come from ref files if available
                result[pluginName][key] = key;
              } else {
                // For RHDH files or files with 'en', use the actual value
                result[pluginName][key] = value;
              }
            }
          }
        }
      }

      if (Object.keys(result).length > 0) {
        return result;
      }
    }

    // Handle flat structure: { key: value } or { translations: { key: value } }
    const translations =
      typeof data === 'object' && data !== null && 'translations' in data
        ? (data as { translations: Record<string, unknown> }).translations
        : (data as Record<string, unknown>);

    if (typeof translations !== 'object' || translations === null) {
      return {};
    }

    // Try to detect plugin name from file path
    const pluginName = detectPluginName(filePath) || 'translations';
    const result: Record<string, Record<string, string>> = {};
    result[pluginName] = {};

    for (const [key, value] of Object.entries(translations)) {
      if (typeof value === 'string') {
        result[pluginName][key] = value;
      }
    }

    return result;
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
async function extractAndGroupKeys(
  sourceFiles: string[],
): Promise<Record<string, { en: Record<string, string> }>> {
  const pluginGroups: Record<string, Record<string, string>> = {};

  for (const filePath of sourceFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const extractResult = extractTranslationKeys(content, filePath);
      const keys = extractResult.keys;

      // Use plugin ID from createTranslationRef if available, otherwise use file path
      const pluginName = extractResult.pluginId || detectPluginName(filePath);

      if (!pluginName) {
        console.warn(
          chalk.yellow(
            `⚠️  Warning: Could not determine plugin name for ${path.relative(
              process.cwd(),
              filePath,
            )}, skipping`,
          ),
        );
        continue;
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
        continue;
      }

      if (!pluginGroups[pluginName]) {
        pluginGroups[pluginName] = {};
      }

      // Merge keys into plugin group (warn about overwrites)
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
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️  Warning: Could not process ${filePath}: ${error}`),
      );
    }
  }

  // Convert to nested structure: { plugin: { en: { keys } } }
  const structuredData: Record<string, { en: Record<string, string> }> = {};
  for (const [pluginName, keys] of Object.entries(pluginGroups)) {
    structuredData[pluginName] = { en: keys };
  }

  return structuredData;
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

export async function generateCommand(opts: OptionValues): Promise<void> {
  // Handle --core-plugins flag (can be true, 'true', or the flag name)
  const corePlugins = Boolean(opts.corePlugins) || opts.corePlugins === 'true';
  const outputFilename = opts.outputFilename as string | undefined;
  const sprint = opts.sprint as string | undefined;

  // Validate sprint value if not using custom filename
  if (!outputFilename && !sprint) {
    throw new Error(
      '--sprint is required. Please provide a sprint value (e.g., --sprint s3285)',
    );
  }

  // Validate sprint format (should start with 's' followed by numbers, or just numbers)
  if (sprint && !/^s?\d+$/i.test(sprint)) {
    throw new Error(
      `Invalid sprint format: "${sprint}". Sprint should be in format "s3285" or "3285"`,
    );
  }

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

    // Always use nested structure format: { plugin: { en: { key: value } } }
    const translationKeys: Record<string, { en: Record<string, string> }> = {};

    // Get backstage repo path early so we can use it for filename generation
    const backstageRepoPath =
      (opts.backstageRepoPath as string | undefined) ||
      config.backstageRepoPath ||
      process.env.BACKSTAGE_REPO_PATH ||
      null;

    if (extractKeys) {
      const structuredData: Record<string, { en: Record<string, string> }> = {};
      const repoRoot = process.cwd();

      if (corePlugins) {
        // For core-plugins: Scan Backstage plugin packages in Backstage repository
        // This is the primary source for English translation keys

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

        if (pluginRefFiles.length > 0) {
          // For core-plugins mode, optionally filter by RHDH usage
          // If RHDH repo path is not available, extract all plugins
          const rhdhRepoPath = process.env.RHDH_REPO_PATH || null;
          const shouldFilterByUsage = Boolean(rhdhRepoPath);

          const usedPlugins = new Set<string>();
          const unusedPlugins = new Set<string>();

          if (shouldFilterByUsage) {
            console.log(
              chalk.yellow(
                `🔍 Checking which plugins are actually used in RHDH...`,
              ),
            );

            // First pass: collect all plugin names and check usage
            for (const refFile of pluginRefFiles) {
              try {
                const pluginName = extractBackstagePluginName(refFile);
                if (!pluginName) continue;

                let mappedPluginName = pluginName.replace(/^plugin-/, '');

                // Handle special cases
                if (
                  pluginName === 'plugin-home-react' ||
                  refFile.includes('home-react')
                ) {
                  mappedPluginName = 'home-react';
                } else if (pluginName === 'plugin-home') {
                  mappedPluginName = 'home';
                }

                // Check if plugin is actually used in RHDH
                if (rhdhRepoPath) {
                  const isUsed = await isPluginUsedInRhdh(
                    mappedPluginName,
                    rhdhRepoPath,
                  );
                  if (isUsed) {
                    usedPlugins.add(mappedPluginName);
                  } else {
                    unusedPlugins.add(mappedPluginName);
                  }
                }
              } catch (error) {
                // Skip if we can't determine usage
                continue;
              }
            }

            if (unusedPlugins.size > 0) {
              console.log(
                chalk.gray(
                  `  Skipping ${
                    unusedPlugins.size
                  } unused plugin(s): ${Array.from(unusedPlugins)
                    .slice(0, 5)
                    .join(', ')}${unusedPlugins.size > 5 ? '...' : ''}`,
                ),
              );
            }
            console.log(
              chalk.gray(
                `  Found ${usedPlugins.size} plugin(s) actually used in RHDH`,
              ),
            );
          } else {
            console.log(
              chalk.yellow(
                `📦 Extracting all Backstage core plugins (RHDH_REPO_PATH not set, skipping usage filter)...`,
              ),
            );
          }

          // Second pass: extract keys from plugins (filtered by usage if enabled)
          for (const refFile of pluginRefFiles) {
            try {
              let keys: Record<string, string> = {};
              let pluginName: string | null = null;

              // Handle data.json files (compiled react-intl messages)
              if (refFile.endsWith('data.json')) {
                try {
                  const jsonContent = await fs.readJson(refFile);
                  // data.json typically has structure: { "key": { "defaultMessage": "value", "id": "key" } }
                  // or flat: { "key": "value" }
                  if (typeof jsonContent === 'object' && jsonContent !== null) {
                    for (const [key, value] of Object.entries(jsonContent)) {
                      if (typeof value === 'string') {
                        keys[key] = value;
                      } else if (
                        typeof value === 'object' &&
                        value !== null &&
                        'defaultMessage' in value
                      ) {
                        keys[key] = (
                          value as { defaultMessage: string }
                        ).defaultMessage;
                      }
                    }
                  }
                  // Extract plugin name from file path for data.json files
                  pluginName = extractBackstagePluginName(refFile);
                } catch (jsonError) {
                  console.warn(
                    chalk.yellow(
                      `⚠️  Warning: Could not parse JSON from ${refFile}: ${jsonError}`,
                    ),
                  );
                  continue;
                }
              } else {
                // Handle TypeScript/JavaScript files
                const content = await fs.readFile(refFile, 'utf-8');
                const extractResult = extractTranslationKeys(content, refFile);
                keys = extractResult.keys;

                // Use plugin ID from createTranslationRef 'id' field if available
                // Fall back to file path extraction if not found
                if (extractResult.pluginId) {
                  pluginName = extractResult.pluginId;
                } else {
                  pluginName = extractBackstagePluginName(refFile);
                }
              }

              if (pluginName && Object.keys(keys).length > 0) {
                let mappedPluginName = pluginName.replace(/^plugin-/, '');

                // Handle special cases
                if (
                  pluginName === 'plugin-home-react' ||
                  refFile.includes('home-react')
                ) {
                  mappedPluginName = 'home-react';
                } else if (pluginName === 'plugin-home') {
                  mappedPluginName = 'home';
                }

                // Only process if plugin is actually used (if filtering is enabled)
                if (shouldFilterByUsage && !usedPlugins.has(mappedPluginName)) {
                  continue;
                }

                if (!structuredData[mappedPluginName]) {
                  structuredData[mappedPluginName] = { en: {} };
                }

                // Merge keys, prioritize English values from ref files
                for (const [key, value] of Object.entries(keys)) {
                  if (!structuredData[mappedPluginName].en[key]) {
                    structuredData[mappedPluginName].en[key] = value;
                  }
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
          console.log(
            chalk.green(
              `✅ Extracted keys from ${usedPlugins.size} Backstage plugin packages used in RHDH`,
            ),
          );
        }

        // Also check for existing core-plugins translated JSON files to extract key structure
        // This is a fallback/secondary source when node_modules doesn't have source .ts files
        // Look in translations/ directory (where the example files are stored)
        // These files help us identify all keys even if we can't find the English ref files
        const corePluginsJsonPatterns = [
          'translations/core-plugins*.json',
          'translations/**/core-plugins*.json',
        ];

        const translatedFiles: string[] = [];
        const outputDirPath = path.resolve(
          repoRoot,
          String(outputDir || 'i18n'),
        );
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
            // Filter out:
            // 1. Files in the output directory (they might be our generated files)
            // 2. Files with "reference" in the name (those are English reference files, not translated)
            const filteredFiles = files.filter(file => {
              const relativePath = path.relative(repoRoot, file);
              const fileName = path.basename(file);

              // Exclude if it's in the output directory and is a reference file
              if (
                file.startsWith(outputDirPath) &&
                fileName === outputFileName
              ) {
                return false;
              }

              // Exclude reference files (we want translated files like -fr.json, -it.json, or -fr-C.json, -it-C.json, etc.)
              if (
                fileName.includes('reference') ||
                fileName.includes('core-plugins-reference')
              ) {
                return false;
              }

              // Include files that look like translated files (have language codes)
              return true;
            });
            translatedFiles.push(...filteredFiles);
          } catch {
            // Ignore if pattern doesn't match
          }
        }

        if (translatedFiles.length > 0) {
          console.log(
            chalk.yellow(
              `📁 Scanning ${translatedFiles.length} existing core-plugins file(s) to extract translation keys...`,
            ),
          );
          for (const translatedFile of translatedFiles) {
            console.log(
              chalk.gray(
                `  Processing: ${path.relative(repoRoot, translatedFile)}`,
              ),
            );
            const translatedKeys = await extractKeysFromJsonFile(
              translatedFile,
              true,
            );

            // Log what we extracted
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

            // Extract keys from translated files (they have the structure we need)
            // For each plugin, extract all keys - use key name as placeholder if no English value
            // This ensures we capture all keys even if ref files don't have them
            for (const [pluginName, pluginData] of Object.entries(
              translatedKeys,
            )) {
              if (!structuredData[pluginName]) {
                structuredData[pluginName] = { en: {} };
              }
              // pluginData is Record<string, string> - these are the translation keys
              // For core-plugins from translated files, the value is the key name (placeholder)
              // Only add if we don't already have an English value from ref files
              for (const [key, value] of Object.entries(pluginData)) {
                if (!structuredData[pluginName].en[key]) {
                  // Use the value (should be key name as placeholder for core-plugins from non-English files)
                  // This ensures we have the key structure even if English values aren't available
                  structuredData[pluginName].en[key] = value;
                }
              }
            }
          }
          console.log(
            chalk.green(
              `✅ Extracted keys from ${translatedFiles.length} existing core-plugins translation file(s)`,
            ),
          );
        }
      } else {
        // For RHDH-specific: Only scan RHDH TypeScript files and JSON files (exclude Backstage core plugins)
        console.log(
          chalk.yellow(`📁 Scanning ${sourceDir} for translation keys...`),
        );

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

        // Also scan JSON translation files (for RHDH repo)
        console.log(chalk.yellow(`📁 Scanning for JSON translation files...`));
        const jsonFiles = await findJsonTranslationFiles(sourceDir);
        console.log(
          chalk.gray(`Found ${jsonFiles.length} JSON translation files`),
        );

        if (jsonFiles.length > 0) {
          for (const jsonFile of jsonFiles) {
            const jsonKeys = await extractKeysFromJsonFile(jsonFile);
            // Merge JSON keys into structured data
            for (const [pluginName, keys] of Object.entries(jsonKeys)) {
              if (!rhdhData[pluginName]) {
                rhdhData[pluginName] = { en: {} };
              }
              // Merge keys, only add if key doesn't exist (preserve English from TypeScript)
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

        // Filter to only include RHDH-specific plugins (exclude Backstage core plugins)
        // RHDH-specific plugins: catalog (overrides), catalog-import, core-components (overrides), rhdh, scaffolder (overrides), search (overrides), user-settings
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

        for (const [pluginName, pluginData] of Object.entries(rhdhData)) {
          // Only include if it's not a Backstage core plugin
          // Or if it's a core plugin but has RHDH-specific overrides (like catalog, scaffolder, search)
          if (
            !backstageCorePlugins.has(pluginName) ||
            pluginName === 'catalog' ||
            pluginName === 'scaffolder' ||
            pluginName === 'search' ||
            pluginName === 'core-components' ||
            pluginName === 'catalog-import' ||
            pluginName === 'user-settings'
          ) {
            structuredData[pluginName] = pluginData;
          }
        }
      }

      // For core-plugins, we want to include ALL Backstage core plugins that are used/installed
      // Even if they have RHDH overrides, the base Backstage translations should be in core-plugins-reference.json
      // The RHDH-specific overrides go in reference.json, but base translations belong in core-plugins-reference.json
      if (corePlugins) {
        // Note: React plugins (catalog-react, search-react, scaffolder-react) have their own unique translations
        // and should be included in the core-plugins-reference.json file.
        // They are NOT just wrappers - they have distinct translation keys that are separate from base plugins.
        console.log(
          chalk.gray(
            `  Including all ${
              Object.keys(structuredData).length
            } core plugins (including React versions with unique translations)`,
          ),
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

    // Generate filename in format: <repo-name>-<sprint>.json
    // Examples: rhdh-s3285.json, backstage-s3285.json
    let filename: string;
    if (outputFilename) {
      // Use custom filename if provided (overrides sprint-based naming)
      filename = outputFilename.replace(/\.json$/, '');
    } else {
      // Auto-generate: <repo-name>-<sprint>.json
      // Sprint is required, so it should be available here
      if (!sprint) {
        throw new Error(
          'Sprint value is required. Please provide --sprint option (e.g., --sprint s3285)',
        );
      }

      // Normalize sprint value (ensure it starts with 's' if not already)
      const normalizedSprint =
        sprint.startsWith('s') || sprint.startsWith('S')
          ? sprint.toLowerCase()
          : `s${sprint}`;

      let repoName: string;
      if (corePlugins) {
        // For core-plugins mode, detect repo name from Backstage repository path
        // Use the backstageRepoPath that was already determined earlier
        if (backstageRepoPath) {
          repoName = detectRepoName(backstageRepoPath);
        } else {
          // Fallback to "backstage" if path not available (shouldn't happen as we check earlier)
          repoName = 'backstage';
        }
      } else {
        // For RHDH mode, detect repo name from current directory
        repoName = detectRepoName();
      }

      filename = `${repoName.toLowerCase()}-${normalizedSprint}`;
    }

    // For core-plugins mode, output to the backstage repo's i18n directory
    let finalOutputDir: string;
    if (corePlugins && backstageRepoPath) {
      // Use the backstage repo's i18n directory
      finalOutputDir = path.join(backstageRepoPath, 'i18n');
      // Ensure the directory exists
      await fs.ensureDir(finalOutputDir);
    } else {
      // For RHDH mode, use the configured outputDir (relative to current working directory)
      finalOutputDir = String(outputDir || 'i18n');
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
