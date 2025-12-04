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

import path from 'path';

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

export async function generateCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('🌍 Generating translation reference files...'));

  // Load config and merge with options
  const config = await loadI18nConfig();
  // mergeConfigWithOptions is async (may generate token), so we await it
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
    // Ensure output directory exists
    await fs.ensureDir(outputDir);

    // Can be either flat structure (legacy) or nested structure (new)
    const translationKeys:
      | Record<string, string>
      | Record<string, { en: Record<string, string> }> = {};

    if (extractKeys) {
      console.log(
        chalk.yellow(`📁 Scanning ${sourceDir} for translation keys...`),
      );

      // Find all source files matching the pattern
      const allSourceFiles = glob.sync(
        String(includePattern || '**/*.{ts,tsx,js,jsx}'),
        {
          cwd: String(sourceDir || 'src'),
          ignore: String(excludePattern || '**/node_modules/**'),
          absolute: true,
        },
      );

      // Filter to only English reference files:
      // 1. Files with createTranslationRef (defines new translation keys)
      // 2. Files with createTranslationMessages that are English (overrides/extends existing keys)
      // 3. Files with createTranslationResource (sets up translation resources - may contain keys)
      //    - Exclude language files (de.ts, es.ts, fr.ts, it.ts, etc.)
      const sourceFiles: string[] = [];
      const languageCodes = [
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
      ];

      for (const filePath of allSourceFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const fileName = path.basename(filePath, path.extname(filePath));

          // Check if it's a language file:
          // 1. Filename is exactly a language code (e.g., "es.ts", "fr.ts")
          // 2. Filename ends with language code (e.g., "something-es.ts", "something-fr.ts")
          // 3. Filename contains language code with separators (e.g., "something.de.ts")
          // Exclude if it's explicitly English (e.g., "something-en.ts", "en.ts")
          const isLanguageFile =
            languageCodes.some(code => {
              if (fileName === code) return true; // Exact match: "es.ts"
              if (fileName.endsWith(`-${code}`)) return true; // Ends with: "something-es.ts"
              if (
                fileName.includes(`.${code}.`) ||
                fileName.includes(`-${code}-`)
              )
                return true; // Contains: "something.de.ts"
              return false;
            }) &&
            !fileName.includes('-en') &&
            fileName !== 'en';

          // Check if file contains createTranslationRef import (defines new translation keys)
          const hasCreateTranslationRef =
            content.includes('createTranslationRef') &&
            (content.includes("from '@backstage/core-plugin-api/alpha'") ||
              content.includes("from '@backstage/frontend-plugin-api'"));

          // Check if file contains createTranslationMessages (overrides/extends existing keys)
          // Only include if it's an English file (not a language file)
          const hasCreateTranslationMessages =
            content.includes('createTranslationMessages') &&
            (content.includes("from '@backstage/core-plugin-api/alpha'") ||
              content.includes("from '@backstage/frontend-plugin-api'")) &&
            !isLanguageFile;

          // Check if file contains createTranslationResource (sets up translation resources)
          // Only include if it's an English file (not a language file)
          const hasCreateTranslationResource =
            content.includes('createTranslationResource') &&
            (content.includes("from '@backstage/core-plugin-api/alpha'") ||
              content.includes("from '@backstage/frontend-plugin-api'")) &&
            !isLanguageFile;

          if (
            hasCreateTranslationRef ||
            hasCreateTranslationMessages ||
            hasCreateTranslationResource
          ) {
            sourceFiles.push(filePath);
          }
        } catch {
          // Skip files that can't be read
          continue;
        }
      }

      console.log(
        chalk.gray(
          `Found ${allSourceFiles.length} files, ${sourceFiles.length} are English reference files`,
        ),
      );

      // Structure: { pluginName: { en: { key: value } } }
      const pluginGroups: Record<string, Record<string, string>> = {};

      // Extract translation keys from each reference file and group by plugin
      for (const filePath of sourceFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const keys = extractTranslationKeys(content, filePath);

          // Detect plugin name from file path
          let pluginName: string | null = null;

          // Pattern 1: workspaces/{workspace}/plugins/{plugin}/...
          const workspaceMatch = filePath.match(
            /workspaces\/([^/]+)\/plugins\/([^/]+)/,
          );
          if (workspaceMatch) {
            // Use plugin name (not workspace.plugin)
            pluginName = workspaceMatch[2];
          } else {
            // Pattern 2: .../translations/{plugin}/ref.ts or .../translations/{plugin}/translation.ts
            // Look for a folder named "translations" and use the next folder as plugin name
            const translationsMatch = filePath.match(/translations\/([^/]+)\//);
            if (translationsMatch) {
              pluginName = translationsMatch[1];
            } else {
              // Pattern 3: Fallback - use parent directory name if file is in a translations folder
              const dirName = path.dirname(filePath);
              const parentDir = path.basename(dirName);
              if (
                parentDir === 'translations' ||
                parentDir.includes('translation')
              ) {
                const grandParentDir = path.basename(path.dirname(dirName));
                pluginName = grandParentDir;
              } else {
                // Last resort: use the directory containing the file
                pluginName = parentDir;
              }
            }
          }

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

          // Filter out invalid plugin names (common directory names that shouldn't be plugins)
          const invalidPluginNames = [
            'dist',
            'build',
            'node_modules',
            'packages',
            'src',
            'lib',
            'components',
            'utils',
          ];
          if (invalidPluginNames.includes(pluginName.toLowerCase())) {
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

          // Initialize plugin group if it doesn't exist
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
            chalk.yellow(
              `⚠️  Warning: Could not process ${filePath}: ${error}`,
            ),
          );
        }
      }

      // Convert plugin groups to the final structure: { plugin: { en: { keys } } }
      const structuredData: Record<string, { en: Record<string, string> }> = {};
      for (const [pluginName, keys] of Object.entries(pluginGroups)) {
        structuredData[pluginName] = { en: keys };
      }

      const totalKeys = Object.values(pluginGroups).reduce(
        (sum, keys) => sum + Object.keys(keys).length,
        0,
      );
      console.log(
        chalk.green(
          `✅ Extracted ${totalKeys} translation keys from ${
            Object.keys(pluginGroups).length
          } plugins`,
        ),
      );

      // Store structured data in translationKeys (will be passed to generateTranslationFiles)
      Object.assign(translationKeys, structuredData);
    }

    // Generate translation files
    const formatStr = String(format || 'json');
    const outputPath = path.join(
      String(outputDir || 'i18n'),
      `reference.${formatStr}`,
    );

    if (mergeExisting && (await fs.pathExists(outputPath))) {
      console.log(chalk.yellow(`🔄 Merging with existing ${outputPath}...`));
      // mergeTranslationFiles now accepts both structures
      await mergeTranslationFiles(
        translationKeys as
          | Record<string, string>
          | Record<string, { en: Record<string, string> }>,
        outputPath,
        formatStr,
      );
    } else {
      console.log(chalk.yellow(`📝 Generating ${outputPath}...`));
      await generateTranslationFiles(translationKeys, outputPath, formatStr);
    }

    // Validate the generated file
    if (formatStr === 'json') {
      console.log(chalk.yellow(`🔍 Validating generated file...`));
      const { validateTranslationFile } = await import(
        '../lib/i18n/validateFile'
      );
      const isValid = await validateTranslationFile(outputPath);
      if (!isValid) {
        throw new Error(`Generated file failed validation: ${outputPath}`);
      }
      console.log(chalk.green(`✅ Generated file is valid`));
    }

    // Print summary of included plugins
    if (extractKeys && isNestedStructure(translationKeys)) {
      console.log(chalk.blue('\n📋 Included Plugins Summary:'));
      console.log(chalk.gray('─'.repeat(60)));

      const plugins = Object.entries(
        translationKeys as Record<string, { en: Record<string, string> }>,
      )
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
