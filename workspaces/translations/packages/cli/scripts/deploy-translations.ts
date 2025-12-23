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
): 'rhdh-plugins' | 'community-plugins' | 'rhdh' | 'unknown' {
  const workspacesDir = path.join(repoRoot, 'workspaces');
  const packagesDir = path.join(repoRoot, 'packages');

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

  const workspaceDirs = fs.readdirSync(workspacesDir);
  for (const workspace of workspaceDirs) {
    const pluginsDir = path.join(
      workspacesDir,
      workspace,
      'plugins',
      pluginName,
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
  // Try: packages/app/src/translations/{plugin}/
  const pluginDir = path.join(
    repoRoot,
    'packages',
    'app',
    'src',
    'translations',
    pluginName,
  );

  if (fs.existsSync(pluginDir)) {
    return pluginDir;
  }

  // Try: packages/app/src/translations/ (flat structure with {plugin}-{lang}.ts files)
  const translationsDir = path.join(
    repoRoot,
    'packages',
    'app',
    'src',
    'translations',
  );

  if (!fs.existsSync(translationsDir)) {
    return null;
  }

  // Check if there are files like {plugin}-{lang}.ts
  const files = fs.readdirSync(translationsDir);
  const hasPluginFiles = files.some(
    f => f.startsWith(`${pluginName}-`) && f.endsWith('.ts'),
  );

  return hasPluginFiles ? translationsDir : null;
}

/**
 * Find plugin translation directory (supports multiple repo structures)
 */
function findPluginTranslationDir(
  pluginName: string,
  repoRoot: string,
): string | null {
  const repoType = detectRepoType(repoRoot);

  if (repoType === 'rhdh-plugins' || repoType === 'community-plugins') {
    return findPluginInWorkspaces(pluginName, repoRoot);
  }

  if (repoType === 'rhdh') {
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

  // Pattern: {repo}-reference-{date}-{lang}-C.json
  // Examples:
  // - rhdh-plugins-reference-2025-12-05-it-C.json
  // - community-plugins-reference-2025-12-05-ja-C.json
  // - rhdh-reference-2025-12-05-it-C.json

  for (const file of allFiles) {
    // Match pattern: {repo}-reference-*-{lang}-C.json
    const match = file.match(/^(.+)-reference-.+-(it|ja|fr|de|es)-C\.json$/);
    if (match) {
      const fileRepo = match[1];
      const lang = match[2];

      // Only include files that match the current repo
      if (
        (repoType === 'rhdh-plugins' && fileRepo === 'rhdh-plugins') ||
        (repoType === 'community-plugins' &&
          fileRepo === 'community-plugins') ||
        (repoType === 'rhdh' && fileRepo === 'rhdh')
      ) {
        files[lang] = file;
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
  if (repoType === 'rhdh') {
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
    return langFile; // Default to {lang}.ts for new files
  }

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
  const translationDir = findPluginTranslationDir(pluginName, repoRoot);

  if (!translationDir) {
    console.warn(
      chalk.yellow(`    ⚠️  Plugin "${pluginName}" not found, skipping...`),
    );
    return null;
  }

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
    const translations = pluginData.en || {};

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
      'Could not detect repository type. Expected: rhdh-plugins, community-plugins, or rhdh',
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
        `   Expected files like: ${repoType}-reference-*-{lang}-C.json`,
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

  for (const [lang, filename] of Object.entries(repoFiles)) {
    const filepath = path.join(downloadDir, filename);

    if (!fs.existsSync(filepath)) {
      console.warn(chalk.yellow(`  ⚠️  File not found: ${filename}`));
      continue;
    }

    const data: TranslationData = JSON.parse(
      fs.readFileSync(filepath, 'utf-8'),
    );

    console.log(chalk.cyan(`\n  🌍 Language: ${lang.toUpperCase()}`));

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
  console.log(chalk.blue(`\n🎉 Deployment complete!`));
}

// Main execution
const downloadDir = process.argv[2] || 'workspaces/i18n/downloads';
const repoRoot = process.cwd();

try {
  await deployTranslations(downloadDir, repoRoot);
} catch (error) {
  console.error(chalk.red('❌ Error:'), error);
  process.exit(1);
}
