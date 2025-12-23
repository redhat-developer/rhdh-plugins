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
 * Find all English reference files
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
      const keys = extractTranslationKeys(content, filePath);

      const pluginName = detectPluginName(filePath);

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
        if (
          pluginGroups[pluginName][key] &&
          pluginGroups[pluginName][key] !== value
        ) {
          overwrittenKeys.push(key);
        }
        pluginGroups[pluginName][key] = value;
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
  console.log(chalk.blue('🌍 Generating translation reference files...'));

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

    const translationKeys:
      | Record<string, string>
      | Record<string, { en: Record<string, string> }> = {};

    if (extractKeys) {
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

      const structuredData = await extractAndGroupKeys(sourceFiles);

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
    const outputPath = path.join(
      String(outputDir || 'i18n'),
      `reference.${formatStr}`,
    );

    await generateOrMergeFiles(
      translationKeys,
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
