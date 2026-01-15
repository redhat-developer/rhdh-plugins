#!/usr/bin/env node
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

import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import chalk from 'chalk';

interface TranslationData {
  [pluginName: string]: {
    en: {
      [key: string]: string;
    };
  };
}

interface PluginInfo {
  name: string;
  translationDir: string;
  refImportName: string;
  variableName: string;
}

/**
 * Find the correct import path for translation ref
 */
function findRefImportPath(translationDir: string): string {
  // Check common patterns in order of preference
  if (fs.existsSync(path.join(translationDir, 'ref.ts'))) {
    return './ref';
  }
  if (fs.existsSync(path.join(translationDir, 'translations.ts'))) {
    return './translations';
  }
  // Default fallback
  return './ref';
}

/**
 * Extract ref import name, import path, and variable name from existing translation file
 */
function extractRefInfo(filePath: string): {
  refImportName: string;
  refImportPath: string;
  variableName: string;
} | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract ref import: import { xxxTranslationRef } from './ref' or from '@backstage/...'
    // Match both local and external imports
    const refImportMatch = content.match(
      /import\s*{\s*(\w+TranslationRef)\s*}\s*from\s*['"]([^'"]+)['"]/,
    );
    if (!refImportMatch) {
      return null;
    }
    const refImportName = refImportMatch[1];
    let refImportPath = refImportMatch[2];

    // If it's a local import (starts with ./), verify the file exists
    // If not, try to find the correct path
    if (refImportPath.startsWith('./')) {
      const translationDir = path.dirname(filePath);
      const expectedFile = path.join(
        translationDir,
        `${refImportPath.replace('./', '')}.ts`,
      );
      if (!fs.existsSync(expectedFile)) {
        // Try to find the correct import path
        refImportPath = findRefImportPath(translationDir);
      }
    }

    // Extract variable name: const xxxTranslationIt = ... or const de = ...
    // Try full pattern first
    let variableMatch = content.match(
      /const\s+(\w+Translation(?:It|Ja|De|Fr|Es))\s*=/,
    );

    // If not found, try simple pattern (like const de = ...)
    if (!variableMatch) {
      variableMatch = content.match(
        /const\s+([a-z]+)\s*=\s*createTranslationMessages/,
      );
    }

    if (!variableMatch) {
      return null;
    }
    const variableName = variableMatch[1];

    return { refImportName, refImportPath, variableName };
  } catch {
    return null;
  }
}

/**
 * Map plugin names to their Backstage package imports (for rhdh repo)
 */
function getPluginPackageImport(pluginName: string): string | null {
  const pluginPackageMap: Record<string, string> = {
    search: '@backstage/plugin-search/alpha',
    'user-settings': '@backstage/plugin-user-settings/alpha',
    scaffolder: '@backstage/plugin-scaffolder/alpha',
    'core-components': '@backstage/core-components/alpha',
    'catalog-import': '@backstage/plugin-catalog-import/alpha',
    catalog: '@backstage/plugin-catalog-react/alpha',
  };

  return pluginPackageMap[pluginName] || null;
}

/**
 * Infer ref import name, import path, and variable name from plugin name
 */
function inferRefInfo(
  pluginName: string,
  lang: string,
  repoType: string,
  translationDir?: string,
): {
  refImportName: string;
  refImportPath: string;
  variableName: string;
} {
  // Convert plugin name to camelCase
  const camelCase = pluginName
    .split('-')
    .map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');

  const refImportName = `${camelCase}TranslationRef`;
  const langCapitalized = lang.charAt(0).toUpperCase() + lang.slice(1);
  const variableName = `${camelCase}Translation${langCapitalized}`;

  // Determine import path
  let refImportPath = './ref';

  // For rhdh repo, try to use external package imports
  if (repoType === 'rhdh') {
    const packageImport = getPluginPackageImport(pluginName);
    if (packageImport) {
      refImportPath = packageImport;
    }
  } else if (translationDir) {
    // For other repos, check what file exists
    refImportPath = findRefImportPath(translationDir);
  }

  return { refImportName, refImportPath, variableName };
}

/**
 * Detect repository type based on structure
 */
function detectRepoType(
  repoRoot: string,
): 'rhdh-plugins' | 'community-plugins' | 'rhdh' | 'backstage' | 'unknown' {
  const workspacesDir = path.join(repoRoot, 'workspaces');
  const packagesDir = path.join(repoRoot, 'packages');
  const pluginsDir = path.join(repoRoot, 'plugins');

  if (fs.existsSync(workspacesDir)) {
    // Check if it's rhdh-plugins or community-plugins
    // Both have workspaces, but we can check the repo name or other indicators
    const repoName = path.basename(repoRoot);
    if (repoName === 'community-plugins') {
      return 'community-plugins';
    }
    // Default to rhdh-plugins if workspaces exist
    return 'rhdh-plugins';
  }

  if (fs.existsSync(packagesDir)) {
    // Check if it's rhdh repo (has packages/app structure)
    const appDir = path.join(packagesDir, 'app');
    if (fs.existsSync(appDir)) {
      return 'rhdh';
    }
  }

  // Check if it's backstage repo (has plugins/ directory at root)
  if (fs.existsSync(pluginsDir)) {
    const repoName = path.basename(repoRoot);
    if (repoName === 'backstage') {
      return 'backstage';
    }
  }

  return 'unknown';
}

/**
 * Find plugin translation directory in workspace-based repos (rhdh-plugins, community-plugins)
 */
function findPluginInWorkspaces(
  pluginName: string,
  repoRoot: string,
): string | null {
  const workspacesDir = path.join(repoRoot, 'workspaces');
  if (!fs.existsSync(workspacesDir)) {
    return null;
  }

  // Strip "plugin." prefix if present (e.g., "plugin.adoption-insights" -> "adoption-insights")
  const cleanPluginName = pluginName.replace(/^plugin\./, '');

  const workspaceDirs = fs.readdirSync(workspacesDir);
  for (const workspace of workspaceDirs) {
    const pluginsDir = path.join(
      workspacesDir,
      workspace,
      'plugins',
      cleanPluginName,
      'src',
      'translations',
    );

    if (fs.existsSync(pluginsDir)) {
      return pluginsDir;
    }
  }

  return null;
}

/**
 * Find plugin translation directory in rhdh repo structure
 */
function findPluginInRhdh(pluginName: string, repoRoot: string): string | null {
  // For rhdh repo, plugin overrides go to packages/app/src/translations/{plugin}/
  const pluginDir = path.join(
    repoRoot,
    'packages',
    'app',
    'src',
    'translations',
    pluginName,
  );

  // Create directory if it doesn't exist (for new plugin overrides)
  if (!fs.existsSync(pluginDir)) {
    const translationsDir = path.join(
      repoRoot,
      'packages',
      'app',
      'src',
      'translations',
    );

    // Only create if the parent translations directory exists
    if (fs.existsSync(translationsDir)) {
      fs.ensureDirSync(pluginDir);
      return pluginDir;
    }

    return null;
  }

  return pluginDir;
}

/**
 * Get the target repository root for deployment
 * For backstage and community-plugins, deploy to rhdh/translations
 * For other repos, deploy to their own structure
 */
function getTargetRepoRoot(repoRoot: string, repoType: string): string {
  // For backstage and community-plugins repos, deploy to rhdh/translations
  if (repoType === 'backstage' || repoType === 'community-plugins') {
    // Try to find rhdh repo - check common locations
    const possibleRhdhPaths = [
      path.join(path.dirname(repoRoot), 'rhdh'),
      // Fallback: Try environment variable or common development location
      process.env.RHDH_REPO_PATH || path.join(os.homedir(), 'redhat', 'rhdh'),
    ];

    for (const rhdhPath of possibleRhdhPaths) {
      if (fs.existsSync(rhdhPath)) {
        return rhdhPath;
      }
    }

    // If rhdh repo not found, warn but continue with current repo
    console.warn(
      chalk.yellow(
        `⚠️  RHDH repo not found. Deploying to translations directory in current location.`,
      ),
    );
  }

  return repoRoot;
}

/**
 * Find plugin translation directory (supports multiple repo structures)
 */
function findPluginTranslationDir(
  pluginName: string,
  repoRoot: string,
  repoType: string,
): string | null {
  // For backstage and community-plugins, deploy to rhdh/translations/{plugin}/
  if (repoType === 'backstage' || repoType === 'community-plugins') {
    const targetRoot = getTargetRepoRoot(repoRoot, repoType);
    const translationsDir = path.join(targetRoot, 'translations');

    // Deploy to rhdh/translations/{plugin}/
    const pluginDir = path.join(translationsDir, pluginName);
    if (!fs.existsSync(pluginDir)) {
      // Create directory if it doesn't exist
      fs.ensureDirSync(pluginDir);
    }
    return pluginDir;
  }

  if (repoType === 'rhdh-plugins') {
    // Deploy to workspace-specific paths
    return findPluginInWorkspaces(pluginName, repoRoot);
  }

  if (repoType === 'rhdh') {
    // For rhdh repo, check if it's the "rhdh" plugin (RHDH-specific keys)
    // or a regular plugin override
    if (pluginName === 'rhdh') {
      // RHDH-specific keys go to packages/app/src/translations/rhdh/
      const rhdhDir = path.join(
        repoRoot,
        'packages',
        'app',
        'src',
        'translations',
        'rhdh',
      );
      if (!fs.existsSync(rhdhDir)) {
        fs.ensureDirSync(rhdhDir);
      }
      return rhdhDir;
    }
    // Regular plugin overrides go to packages/app/src/translations/{plugin}/
    return findPluginInRhdh(pluginName, repoRoot);
  }

  return null;
}

/**
 * Generate TypeScript translation file content
 */
function generateTranslationFile(
  pluginName: string,
  lang: string,
  messages: { [key: string]: string },
  refImportName: string,
  refImportPath: string,
  variableName: string,
): string {
  let langName: string;
  if (lang === 'it') {
    langName = 'Italian';
  } else if (lang === 'ja') {
    langName = 'Japanese';
  } else {
    langName = lang;
  }

  const messagesContent = Object.entries(messages)
    .map(([key, value]) => {
      // Escape single quotes and backslashes in values
      const escapedValue = value
        .replaceAll(/\\/g, '\\\\')
        .replaceAll(/'/g, "\\'")
        .replaceAll(/\n/g, '\\n');
      return `    '${key}': '${escapedValue}',`;
    })
    .join('\n');

  return `/*
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

import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { ${refImportName} } from '${refImportPath}';

/**
 * ${langName} translation for ${pluginName}.
 * @public
 */
const ${variableName} = createTranslationMessages({
  ref: ${refImportName},
  messages: {
${messagesContent}
  },
});

export default ${variableName};
`;
}

/**
 * Auto-detect downloaded translation files
 */
function detectDownloadedFiles(
  downloadDir: string,
  repoType: string,
): Record<string, string> {
  const files: Record<string, string> = {};

  if (!fs.existsSync(downloadDir)) {
    return files;
  }

  // List all JSON files in download directory
  const allFiles = fs.readdirSync(downloadDir).filter(f => f.endsWith('.json'));

  // Supported patterns:
  // 1. New sprint-based: {repo}-{sprint}-{lang}(-C).json (e.g., rhdh-s3285-it-C.json)
  // 2. Date-based: {repo}-{date}-{lang}(-C).json (e.g., backstage-2026-01-08-fr-C.json)
  // 3. Old reference pattern: {repo}-reference-{date}-{lang}(-C).json (backward compatibility)
  // The -C suffix is added by TMS and is optional in matching

  for (const file of allFiles) {
    // Language codes: it, ja, fr, de, es, and other common codes
    const langCodes = '(it|ja|fr|de|es|ko|zh|pt|ru|ar|hi|nl|pl|sv)';

    // Try new sprint-based pattern first: {repo}-{sprint}-{lang}(-C).json
    // Sprint format: s followed by numbers (e.g., s3285)
    // Examples: rhdh-s3285-it-C.json, rhdh-s3285-it.json
    let match = file.match(
      new RegExp(`^([a-z-]+)-(s\\d+)-${langCodes}(?:-C)?\\.json$`, 'i'),
    );

    // If no match, try date-based pattern: {repo}-{date}-{lang}(-C).json
    if (!match) {
      match = file.match(
        new RegExp(
          `^([a-z-]+)-(\\d{4}-\\d{2}-\\d{2})-${langCodes}(?:-C)?\\.json$`,
          'i',
        ),
      );
    }

    // If still no match, try old reference pattern: {repo}-reference-{date}-{lang}(-C).json
    // (for backward compatibility)
    if (!match) {
      match = file.match(
        new RegExp(
          `^([a-z-]+)-reference-(\\d{4}-\\d{2}-\\d{2})-${langCodes}(?:-C)?\\.json$`,
          'i',
        ),
      );
    }

    if (match) {
      const fileRepo = match[1];
      // For sprint pattern: match[2] is sprint (e.g., s3285), match[3] is lang
      // For date pattern: match[2] is date (e.g., 2026-01-08), match[3] is lang
      // For old reference pattern: match[2] is date, match[3] is lang
      // All patterns have lang at index 3
      const lang = match[3];

      // Only include files that match the current repo
      // Support both old repo names and new ones (e.g., "backstage" for backstage repo)
      // Note: backstage and community-plugins files are deployed to rhdh/translations
      if (
        (repoType === 'rhdh-plugins' && fileRepo === 'rhdh-plugins') ||
        (repoType === 'community-plugins' &&
          fileRepo === 'community-plugins') ||
        (repoType === 'rhdh' && fileRepo === 'rhdh') ||
        (repoType === 'backstage' && fileRepo === 'backstage')
      ) {
        // Store the original filename for reading, but use clean name for display
        // The clean name removes -C suffix and -reference for cleaner naming
        // Example: community-plugins-reference-2025-12-05-fr-C.json
        //   -> clean: community-plugins-2025-12-05-fr.json
        //   -> original: community-plugins-reference-2025-12-05-fr-C.json (for reading)
        files[lang] = file; // Store original filename for reading
      }
    }
  }

  return files;
}

/**
 * Determine target file path for translation file
 */
function determineTargetFile(
  pluginName: string,
  lang: string,
  repoType: string,
  translationDir: string,
): string {
  // For backstage and community-plugins deploying to rhdh/translations/{plugin}/
  // Use {lang}.ts format
  if (repoType === 'backstage' || repoType === 'community-plugins') {
    return path.join(translationDir, `${lang}.ts`);
  }

  // For rhdh repo
  if (repoType === 'rhdh') {
    // For "rhdh" plugin (RHDH-specific keys), use {lang}.ts
    if (pluginName === 'rhdh') {
      return path.join(translationDir, `${lang}.ts`);
    }

    // For plugin overrides, try {plugin}-{lang}.ts first, then {lang}.ts
    const pluginLangFile = path.join(
      translationDir,
      `${pluginName}-${lang}.ts`,
    );
    const langFile = path.join(translationDir, `${lang}.ts`);

    if (fs.existsSync(pluginLangFile)) {
      return pluginLangFile;
    }
    if (fs.existsSync(langFile)) {
      return langFile;
    }
    // Default to {plugin}-{lang}.ts for new plugin override files
    return pluginLangFile;
  }

  // For rhdh-plugins, use {lang}.ts in workspace plugin directories
  return path.join(translationDir, `${lang}.ts`);
}

/**
 * Get list of other language files in the translation directory
 */
function getOtherLanguageFiles(
  lang: string,
  repoType: string,
  pluginName: string,
  translationDir: string,
): string[] {
  const otherLangs = ['it', 'ja', 'de', 'fr', 'es', 'en'].filter(
    l => l !== lang,
  );

  if (repoType === 'rhdh') {
    return otherLangs.flatMap(l => {
      const pluginLangFile = path.join(translationDir, `${pluginName}-${l}.ts`);
      const langFile = path.join(translationDir, `${l}.ts`);
      const files: string[] = [];
      if (fs.existsSync(pluginLangFile)) files.push(pluginLangFile);
      if (fs.existsSync(langFile)) files.push(langFile);
      return files;
    });
  }

  return otherLangs
    .map(l => path.join(translationDir, `${l}.ts`))
    .filter(f => fs.existsSync(f));
}

/**
 * Transform variable name for target language
 */
function transformVariableName(variableName: string, lang: string): string {
  const langCapitalized = lang.charAt(0).toUpperCase() + lang.slice(1);

  if (variableName.match(/Translation(It|Ja|De|Fr|Es)$/)) {
    return variableName.replaceAll(
      /Translation(It|Ja|De|Fr|Es)$/g,
      `Translation${langCapitalized}`,
    );
  }

  return lang;
}

/**
 * Verify and fix import path if needed
 */
function verifyImportPath(
  refInfo: { refImportPath: string },
  translationDir: string,
): void {
  if (!refInfo.refImportPath.startsWith('./')) {
    return;
  }

  const expectedFile = path.join(
    translationDir,
    `${refInfo.refImportPath.replace('./', '')}.ts`,
  );

  if (!fs.existsSync(expectedFile)) {
    refInfo.refImportPath = findRefImportPath(translationDir);
  }
}

/**
 * Extract ref info from other language files
 */
function extractRefInfoFromOtherFiles(
  otherLangFiles: string[],
  repoType: string,
  lang: string,
  translationDir: string,
): {
  refImportName: string;
  refImportPath: string;
  variableName: string;
} | null {
  for (const otherFile of otherLangFiles) {
    const otherRefInfo = extractRefInfo(otherFile);
    if (!otherRefInfo) {
      continue;
    }

    verifyImportPath(otherRefInfo, translationDir);

    // Prioritize external package imports for rhdh
    const isExternalImport = !otherRefInfo.refImportPath.startsWith('./');
    const shouldUseForRhdh = repoType === 'rhdh' && isExternalImport;
    const shouldUseForOthers = repoType !== 'rhdh' || !isExternalImport;

    if (shouldUseForRhdh || shouldUseForOthers) {
      return {
        refImportName: otherRefInfo.refImportName,
        refImportPath: otherRefInfo.refImportPath,
        variableName: transformVariableName(otherRefInfo.variableName, lang),
      };
    }
  }

  return null;
}

/**
 * Get ref info for a plugin translation file
 */
function getRefInfoForPlugin(
  pluginName: string,
  lang: string,
  repoType: string,
  translationDir: string,
  targetFile: string,
  exists: boolean,
): {
  refImportName: string;
  refImportPath: string;
  variableName: string;
} {
  const otherLangFiles = getOtherLanguageFiles(
    lang,
    repoType,
    pluginName,
    translationDir,
  );

  // Try to extract from other language files first
  const refInfoFromOthers = extractRefInfoFromOtherFiles(
    otherLangFiles,
    repoType,
    lang,
    translationDir,
  );

  if (refInfoFromOthers) {
    return refInfoFromOthers;
  }

  // Try existing file
  if (exists) {
    const existingRefInfo = extractRefInfo(targetFile);
    if (existingRefInfo) {
      return existingRefInfo;
    }
  }

  // Try any other language file as fallback
  const anyOtherFile = otherLangFiles.find(f => fs.existsSync(f));
  if (anyOtherFile) {
    const otherRefInfo = extractRefInfo(anyOtherFile);
    if (otherRefInfo) {
      verifyImportPath(otherRefInfo, translationDir);
      return {
        refImportName: otherRefInfo.refImportName,
        refImportPath: otherRefInfo.refImportPath,
        variableName: transformVariableName(otherRefInfo.variableName, lang),
      };
    }
  }

  // Last resort: infer from plugin name
  return inferRefInfo(pluginName, lang, repoType, translationDir);
}

/**
 * Process translation for a single plugin
 */
function processPluginTranslation(
  pluginName: string,
  translations: { [key: string]: string },
  lang: string,
  repoType: string,
  repoRoot: string,
): { updated: boolean; created: boolean } | null {
  const translationDir = findPluginTranslationDir(
    pluginName,
    repoRoot,
    repoType,
  );

  if (!translationDir) {
    console.warn(
      chalk.yellow(`    ⚠️  Plugin "${pluginName}" not found, skipping...`),
    );
    return null;
  }

  console.log(chalk.gray(`    📦 Plugin: ${pluginName} → ${translationDir}`));

  const targetFile = determineTargetFile(
    pluginName,
    lang,
    repoType,
    translationDir,
  );
  const exists = fs.existsSync(targetFile);

  const refInfo = getRefInfoForPlugin(
    pluginName,
    lang,
    repoType,
    translationDir,
    targetFile,
    exists,
  );

  const content = generateTranslationFile(
    pluginName,
    lang,
    translations,
    refInfo.refImportName,
    refInfo.refImportPath,
    refInfo.variableName,
  );

  fs.writeFileSync(targetFile, content, 'utf-8');

  const relativePath = path.relative(repoRoot, targetFile);
  const keyCount = Object.keys(translations).length;

  if (exists) {
    console.log(
      chalk.green(`    ✅ Updated: ${relativePath} (${keyCount} keys)`),
    );
    return { updated: true, created: false };
  }

  console.log(
    chalk.green(`    ✨ Created: ${relativePath} (${keyCount} keys)`),
  );
  return { updated: false, created: true };
}

/**
 * Process all plugin translations for a language
 */
function processLanguageTranslations(
  data: TranslationData,
  lang: string,
  repoType: string,
  repoRoot: string,
): { updated: number; created: number } {
  let updated = 0;
  let created = 0;

  for (const [pluginName, pluginData] of Object.entries(data)) {
    // Use the language-specific translations (fr, it, ja, etc.)
    // The translation file structure is: { plugin: { lang: { key: value } } }
    const translations =
      (pluginData as Record<string, Record<string, string>>)[lang] || {};

    if (Object.keys(translations).length === 0) {
      continue;
    }

    const result = processPluginTranslation(
      pluginName,
      translations,
      lang,
      repoType,
      repoRoot,
    );

    if (result) {
      if (result.updated) updated++;
      if (result.created) created++;
    }
  }

  return { updated, created };
}

/**
 * Extract translation keys from a TypeScript translation file
 * Language files use flat dot notation: 'key.name': 'value'
 */
function extractKeysFromTranslationFile(filePath: string): Set<string> {
  const keys = new Set<string>();
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Find the messages object in createTranslationMessages
    const messagesMatch = content.match(/messages:\s*\{([\s\S]*?)\}\s*\}\)/);
    if (messagesMatch) {
      const messagesContent = messagesMatch[1];
      // Match keys in messages object: 'key.name': 'value',
      // Look for pattern: 'quoted.key': 'value' or "quoted.key": "value"
      const keyPattern = /['"]([^'"]+)['"]\s*:\s*['"]/g;
      let match = keyPattern.exec(messagesContent);
      while (match !== null) {
        keys.add(match[1]);
        match = keyPattern.exec(messagesContent);
      }
    }
  } catch (error) {
    // If file doesn't exist or can't be read, return empty set
  }
  return keys;
}

/**
 * Extract keys from reference file by parsing the nested messages object
 * Ref files use nested structure: { page: { title: 'value' } }
 * We need to flatten to dot notation: 'page.title'
 */
function extractKeysFromRefFile(refFilePath: string): Set<string> {
  const keys = new Set<string>();
  try {
    const content = fs.readFileSync(refFilePath, 'utf-8');
    // Find the messages object: export const xxxMessages = { ... }
    const messagesMatch = content.match(
      /export\s+const\s+\w+Messages\s*=\s*\{([\s\S]*?)\};/,
    );
    if (!messagesMatch) {
      return keys;
    }

    const messagesContent = messagesMatch[1];

    // Recursively extract nested keys and flatten to dot notation
    const extractNestedKeys = (
      nestedContent: string,
      prefix = '',
      depth = 0,
      maxDepth = 10,
    ): void => {
      if (depth > maxDepth) {
        return; // Prevent infinite recursion
      }

      // Helper: Extract matches from a regex pattern
      // Includes safeguards to prevent ReDoS: iteration limit and timeout protection
      const extractMatches = (
        pattern: RegExp,
        textContent: string,
        processed: Set<number>,
      ): Array<{
        key: string;
        value: string;
        index: number;
        endIndex: number;
      }> => {
        const matches: Array<{
          key: string;
          value: string;
          index: number;
          endIndex: number;
        }> = [];

        // Limit iterations to prevent ReDoS (max 10000 matches per pattern)
        const MAX_ITERATIONS = 10000;
        let iterations = 0;
        let match = pattern.exec(textContent);

        while (match !== null && iterations < MAX_ITERATIONS) {
          iterations++;
          if (!processed.has(match.index)) {
            processed.add(match.index);
            matches.push({
              key: match[1],
              value: match[2].trim(),
              index: match.index,
              endIndex: match.index + match[0].length,
            });
          }
          match = pattern.exec(textContent);
        }

        if (iterations >= MAX_ITERATIONS) {
          console.warn(
            `Regex iteration limit reached (${MAX_ITERATIONS}), stopping extraction`,
          );
        }

        return matches;
      };

      // Helper: Find matching closing brace for nested object
      const findMatchingBrace = (
        textContent: string,
        startIndex: number,
      ): string | null => {
        const valueStart = textContent.indexOf('{', startIndex);
        if (valueStart === -1) {
          return null;
        }

        let braceCount = 0;
        for (let i = valueStart; i < textContent.length; i++) {
          if (textContent[i] === '{') braceCount++;
          if (textContent[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              return textContent.substring(valueStart, i + 1);
            }
          }
        }
        return null;
      };

      // Validate input length to prevent ReDoS attacks
      // Limit total content to 1MB to prevent memory exhaustion
      const MAX_CONTENT_LENGTH = 1024 * 1024; // 1MB
      if (nestedContent.length > MAX_CONTENT_LENGTH) {
        console.warn(
          `Content too large (${nestedContent.length} chars), skipping extraction`,
        );
        return;
      }

      // Pattern for identifier keys: word followed by colon and value
      // ReDoS protection: all quantifiers are bounded and pattern is deterministic
      // - Match word, colon, then value up to next delimiter
      // - Limit whitespace to 100 chars and value to 5000 chars to prevent DoS
      // - Use non-greedy bounded quantifier to minimize backtracking
      // - Simple lookahead (?=[,}\n]) checks for delimiter (deterministic, no backtracking)
      // - All quantifiers are bounded: no unbounded * or + operators
      const identifierKeyPattern =
        /(\w+)\s{0,100}:\s{0,100}([^,}\n]{0,5000}?)(?=[,}\n])/g;

      // Pattern for string literal keys: 'key' or "key" followed by colon and value
      // ReDoS protection: all quantifiers are bounded and pattern is deterministic
      // - Limit key to 500 chars, whitespace to 100 chars, and value to 5000 chars
      // - Use non-greedy bounded quantifier to minimize backtracking
      // - Simple lookahead (?=[,}\n]) checks for delimiter (deterministic, no backtracking)
      // - All quantifiers are bounded: no unbounded * or + operators
      const stringKeyPattern =
        /['"]([^'"]{1,500})['"]\s{0,100}:\s{0,100}([^,}\n]{0,5000}?)(?=[,}\n])/g;

      const processed = new Set<number>();
      const allMatches: Array<{
        key: string;
        value: string;
        index: number;
        endIndex: number;
      }> = [];

      // Collect matches from both patterns
      allMatches.push(
        ...extractMatches(identifierKeyPattern, nestedContent, processed),
      );
      stringKeyPattern.lastIndex = 0;
      allMatches.push(
        ...extractMatches(stringKeyPattern, nestedContent, processed),
      );

      // Sort by index to process in order
      allMatches.sort((a, b) => a.index - b.index);

      // Process each match
      for (const matchData of allMatches) {
        const fullKey = prefix ? `${prefix}.${matchData.key}` : matchData.key;

        if (matchData.value.startsWith('{')) {
          const nestedSubContent = findMatchingBrace(
            nestedContent,
            matchData.index,
          );
          if (nestedSubContent) {
            extractNestedKeys(nestedSubContent, fullKey, depth + 1, maxDepth);
          }
        } else if (matchData.value.match(/^['"]/)) {
          keys.add(fullKey);
        }
      }
    };

    extractNestedKeys(messagesContent);
  } catch (error) {
    // If file doesn't exist or can't be read, return empty set
  }
  return keys;
}

/**
 * Validate that all translation files have matching keys with the reference file
 */
function validateTranslationKeys(
  repoType: string,
  repoRoot: string,
): { hasErrors: boolean; errors: string[] } {
  const errors: string[] = [];
  const supportedLangs = ['fr', 'it', 'ja', 'de', 'es'];

  // Find all plugin translation directories
  const workspacesDir = path.join(repoRoot, 'workspaces');
  if (!fs.existsSync(workspacesDir)) {
    return { hasErrors: false, errors: [] };
  }

  const workspaceDirs = fs.readdirSync(workspacesDir);

  for (const workspace of workspaceDirs) {
    const pluginsDir = path.join(workspacesDir, workspace, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      continue;
    }

    const pluginDirs = fs.readdirSync(pluginsDir);
    for (const plugin of pluginDirs) {
      const translationDir = path.join(
        pluginsDir,
        plugin,
        'src',
        'translations',
      );
      if (!fs.existsSync(translationDir)) {
        continue;
      }

      const refFile = path.join(translationDir, 'ref.ts');
      if (!fs.existsSync(refFile)) {
        continue;
      }

      // Extract keys from reference file
      const refKeys = extractKeysFromRefFile(refFile);
      if (refKeys.size === 0) {
        // Skip if we can't extract keys (might be using a different format)
        continue;
      }

      // Check each language file
      for (const lang of supportedLangs) {
        const langFile = path.join(translationDir, `${lang}.ts`);
        if (!fs.existsSync(langFile)) {
          continue;
        }

        const langKeys = extractKeysFromTranslationFile(langFile);

        // Find missing keys
        const missingKeys = Array.from(refKeys).filter(
          key => !langKeys.has(key),
        );
        if (missingKeys.length > 0) {
          errors.push(
            `❌ ${workspace}/plugins/${plugin}/src/translations/${lang}.ts is missing ${
              missingKeys.length
            } key(s): ${missingKeys.slice(0, 5).join(', ')}${
              missingKeys.length > 5 ? '...' : ''
            }`,
          );
        }

        // Find extra keys (keys in lang file but not in ref)
        const extraKeys = Array.from(langKeys).filter(key => !refKeys.has(key));
        if (extraKeys.length > 0) {
          errors.push(
            `⚠️  ${workspace}/plugins/${plugin}/src/translations/${lang}.ts has ${
              extraKeys.length
            } extra key(s) not in ref: ${extraKeys.slice(0, 5).join(', ')}${
              extraKeys.length > 5 ? '...' : ''
            }`,
          );
        }
      }
    }
  }

  return { hasErrors: errors.length > 0, errors };
}

/**
 * Deploy translations from downloaded JSON files
 */
async function deployTranslations(
  downloadDir: string,
  repoRoot: string,
): Promise<void> {
  console.log(chalk.blue('🚀 Deploying translations...\n'));

  const repoType = detectRepoType(repoRoot);
  console.log(chalk.cyan(`📦 Detected repository: ${repoType}\n`));

  if (repoType === 'unknown') {
    throw new Error(
      'Could not detect repository type. Expected: rhdh-plugins, community-plugins, rhdh, or backstage',
    );
  }

  const repoFiles = detectDownloadedFiles(downloadDir, repoType);

  if (Object.keys(repoFiles).length === 0) {
    console.warn(
      chalk.yellow(
        `⚠️  No translation files found for ${repoType} in ${downloadDir}`,
      ),
    );
    console.warn(
      chalk.gray(
        `   Expected files like: ${repoType}-*-{lang}.json or ${repoType}-*-{lang}-C.json`,
      ),
    );
    return;
  }

  console.log(
    chalk.cyan(
      `📁 Found ${
        Object.keys(repoFiles).length
      } translation file(s) for ${repoType}`,
    ),
  );

  let totalUpdated = 0;
  let totalCreated = 0;

  for (const [lang, originalFilename] of Object.entries(repoFiles)) {
    // Use the original filename to read the file (it may have -C suffix and -reference)
    const filepath = path.join(downloadDir, originalFilename);

    if (!fs.existsSync(filepath)) {
      console.warn(chalk.yellow(`  ⚠️  File not found: ${originalFilename}`));
      continue;
    }

    // Generate clean filename for display (remove -C suffix and -reference)
    let displayFilename = originalFilename;
    displayFilename = displayFilename.replace(/-C\.json$/, '.json');
    displayFilename = displayFilename.replace(/-reference-/, '-');

    const data: TranslationData = JSON.parse(
      fs.readFileSync(filepath, 'utf-8'),
    );

    console.log(chalk.cyan(`\n  🌍 Language: ${lang.toUpperCase()}`));
    console.log(chalk.gray(`  📄 Processing: ${displayFilename}`));

    const { updated, created } = processLanguageTranslations(
      data,
      lang,
      repoType,
      repoRoot,
    );

    totalUpdated += updated;
    totalCreated += created;
  }

  console.log(chalk.blue(`\n\n📊 Summary:`));
  console.log(chalk.green(`  ✅ Updated: ${totalUpdated} files`));
  console.log(chalk.green(`  ✨ Created: ${totalCreated} files`));

  // Validate translation keys after deployment
  console.log(chalk.blue(`\n🔍 Validating translation keys...`));
  const validationResults = validateTranslationKeys(repoType, repoRoot);

  if (validationResults.hasErrors) {
    console.log(chalk.red(`\n❌ Validation found issues:`));
    validationResults.errors.forEach(error => {
      console.log(chalk.red(`  ${error}`));
    });
    console.log(
      chalk.yellow(
        `\n⚠️  Please review and fix the missing keys before committing.`,
      ),
    );
  } else {
    console.log(chalk.green(`\n✅ All translation files have matching keys!`));
  }

  console.log(chalk.blue(`\n🎉 Deployment complete!`));
}

// Main execution
(async () => {
  const downloadDir = process.argv[2] || 'workspaces/i18n/downloads';
  const repoRoot = process.cwd();

  try {
    await deployTranslations(downloadDir, repoRoot);
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error);
    process.exit(1);
  }
})();
