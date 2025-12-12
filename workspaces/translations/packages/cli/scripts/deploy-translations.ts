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
import path from 'path';
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
      /import\s*{\s*([a-zA-Z0-9_]+TranslationRef)\s*}\s*from\s*['"]([^'"]+)['"]/,
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
      /const\s+([a-zA-Z0-9_]+Translation(?:It|Ja|De|Fr|Es))\s*=/,
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
 * Find plugin translation directory (supports multiple repo structures)
 */
function findPluginTranslationDir(
  pluginName: string,
  repoRoot: string,
): string | null {
  const repoType = detectRepoType(repoRoot);

  // Structure 1: workspaces/*/plugins/*/src/translations (rhdh-plugins, community-plugins)
  if (repoType === 'rhdh-plugins' || repoType === 'community-plugins') {
    const workspacesDir = path.join(repoRoot, 'workspaces');

    if (fs.existsSync(workspacesDir)) {
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
    }
  }

  // Structure 2: packages/app/src/translations/{plugin}/ (rhdh)
  if (repoType === 'rhdh') {
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

    if (fs.existsSync(translationsDir)) {
      // Check if there are files like {plugin}-{lang}.ts
      const files = fs.readdirSync(translationsDir);
      const hasPluginFiles = files.some(
        f => f.startsWith(`${pluginName}-`) && f.endsWith('.ts'),
      );

      if (hasPluginFiles) {
        return translationsDir;
      }
    }
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
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n');
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
 * Deploy translations from downloaded JSON files
 */
async function deployTranslations(
  downloadDir: string,
  repoRoot: string,
): Promise<void> {
  console.log(chalk.blue('🚀 Deploying translations...\n'));

  // Detect repository type
  const repoType = detectRepoType(repoRoot);
  console.log(chalk.cyan(`📦 Detected repository: ${repoType}\n`));

  if (repoType === 'unknown') {
    throw new Error(
      'Could not detect repository type. Expected: rhdh-plugins, community-plugins, or rhdh',
    );
  }

  // Auto-detect downloaded files for this repo
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

    for (const [pluginName, pluginData] of Object.entries(data)) {
      const translations = pluginData.en || {};

      if (Object.keys(translations).length === 0) {
        continue;
      }

      // Find plugin translation directory
      const translationDir = findPluginTranslationDir(pluginName, repoRoot);

      if (!translationDir) {
        console.warn(
          chalk.yellow(`    ⚠️  Plugin "${pluginName}" not found, skipping...`),
        );
        continue;
      }

      // For rhdh repo, files might be named {plugin}-{lang}.ts instead of {lang}.ts
      let targetFile: string;
      if (repoType === 'rhdh') {
        // Check if files use {plugin}-{lang}.ts format
        const pluginLangFile = path.join(
          translationDir,
          `${pluginName}-${lang}.ts`,
        );
        const langFile = path.join(translationDir, `${lang}.ts`);

        // Prefer existing file format, or default to {lang}.ts
        if (fs.existsSync(pluginLangFile)) {
          targetFile = pluginLangFile;
        } else if (fs.existsSync(langFile)) {
          targetFile = langFile;
        } else {
          // Default to {lang}.ts for new files
          targetFile = langFile;
        }
      } else {
        targetFile = path.join(translationDir, `${lang}.ts`);
      }

      const exists = fs.existsSync(targetFile);

      // Get ref info from existing file or infer
      // Strategy: Always check other existing files first to get correct import path,
      // then fall back to existing file or inference
      let refInfo: {
        refImportName: string;
        refImportPath: string;
        variableName: string;
      };

      // First, try to get from another language file in same directory (prioritize these)
      // For rhdh, check both naming conventions: {plugin}-{lang}.ts and {lang}.ts
      const otherLangFiles = ['it', 'ja', 'de', 'fr', 'es', 'en']
        .filter(l => l !== lang)
        .flatMap(l => {
          if (repoType === 'rhdh') {
            // Check both naming patterns
            const pluginLangFile = path.join(
              translationDir,
              `${pluginName}-${l}.ts`,
            );
            const langFile = path.join(translationDir, `${l}.ts`);
            const files = [];
            if (fs.existsSync(pluginLangFile)) files.push(pluginLangFile);
            if (fs.existsSync(langFile)) files.push(langFile);
            return files;
          }
          const langFile = path.join(translationDir, `${l}.ts`);
          return fs.existsSync(langFile) ? [langFile] : [];
        });

      // Try to extract from other language files first (they likely have correct imports)
      let foundRefInfo = false;
      for (const otherFile of otherLangFiles) {
        const otherRefInfo = extractRefInfo(otherFile);
        if (otherRefInfo) {
          // Verify the import path is valid (file exists)
          if (otherRefInfo.refImportPath.startsWith('./')) {
            const expectedFile = path.join(
              translationDir,
              `${otherRefInfo.refImportPath.replace('./', '')}.ts`,
            );
            if (!fs.existsSync(expectedFile)) {
              // Import path is invalid, try to find correct one
              otherRefInfo.refImportPath = findRefImportPath(translationDir);
            }
          }

          // Use this ref info (prioritize external package imports for rhdh)
          if (
            repoType === 'rhdh' &&
            !otherRefInfo.refImportPath.startsWith('./')
          ) {
            // Found a file with external package import - use it
            const langCapitalized =
              lang.charAt(0).toUpperCase() + lang.slice(1);
            // For variable name, try to match pattern or use simple lang code
            let variableName = otherRefInfo.variableName;
            if (variableName.match(/Translation(It|Ja|De|Fr|Es)$/)) {
              variableName = variableName.replace(
                /Translation(It|Ja|De|Fr|Es)$/,
                `Translation${langCapitalized}`,
              );
            } else {
              // Simple pattern like "const de = ..."
              variableName = lang;
            }
            refInfo = {
              refImportName: otherRefInfo.refImportName,
              refImportPath: otherRefInfo.refImportPath,
              variableName,
            };
            foundRefInfo = true;
            break;
          } else if (
            repoType !== 'rhdh' ||
            otherRefInfo.refImportPath.startsWith('./')
          ) {
            // For non-rhdh repos, or local imports, use it
            const langCapitalized =
              lang.charAt(0).toUpperCase() + lang.slice(1);
            let variableName = otherRefInfo.variableName;
            if (variableName.match(/Translation(It|Ja|De|Fr|Es)$/)) {
              variableName = variableName.replace(
                /Translation(It|Ja|De|Fr|Es)$/,
                `Translation${langCapitalized}`,
              );
            } else {
              variableName = lang;
            }
            refInfo = {
              refImportName: otherRefInfo.refImportName,
              refImportPath: otherRefInfo.refImportPath,
              variableName,
            };
            foundRefInfo = true;
            break;
          }
        }
      }

      if (!foundRefInfo) {
        // If no good import found in other files, try existing file or infer
        if (exists) {
          const existingRefInfo = extractRefInfo(targetFile);
          if (existingRefInfo) {
            refInfo = existingRefInfo;
            foundRefInfo = true;
          }
        }

        if (!foundRefInfo) {
          // Try any other language file (even with ./ref or ./translations)
          const anyOtherFile = otherLangFiles.find(f => fs.existsSync(f));
          if (anyOtherFile) {
            const otherRefInfo = extractRefInfo(anyOtherFile);
            if (otherRefInfo) {
              // Verify and fix import path if needed
              if (otherRefInfo.refImportPath.startsWith('./')) {
                const expectedFile = path.join(
                  translationDir,
                  `${otherRefInfo.refImportPath.replace('./', '')}.ts`,
                );
                if (!fs.existsSync(expectedFile)) {
                  otherRefInfo.refImportPath =
                    findRefImportPath(translationDir);
                }
              }

              const langCapitalized =
                lang.charAt(0).toUpperCase() + lang.slice(1);
              let variableName = otherRefInfo.variableName;
              if (variableName.match(/Translation(It|Ja|De|Fr|Es)$/)) {
                variableName = variableName.replace(
                  /Translation(It|Ja|De|Fr|Es)$/,
                  `Translation${langCapitalized}`,
                );
              } else {
                variableName = lang;
              }
              refInfo = {
                refImportName: otherRefInfo.refImportName,
                refImportPath: otherRefInfo.refImportPath,
                variableName,
              };
              foundRefInfo = true;
            }
          }
        }

        if (!foundRefInfo) {
          // Last resort: infer from plugin name
          refInfo = inferRefInfo(pluginName, lang, repoType, translationDir);
        }
      }

      // Generate file content
      const content = generateTranslationFile(
        pluginName,
        lang,
        translations,
        refInfo.refImportName,
        refInfo.refImportPath,
        refInfo.variableName,
      );

      // Write file
      fs.writeFileSync(targetFile, content, 'utf-8');

      const relativePath = path.relative(repoRoot, targetFile);
      if (exists) {
        console.log(
          chalk.green(
            `    ✅ Updated: ${relativePath} (${
              Object.keys(translations).length
            } keys)`,
          ),
        );
        totalUpdated++;
      } else {
        console.log(
          chalk.green(
            `    ✨ Created: ${relativePath} (${
              Object.keys(translations).length
            } keys)`,
          ),
        );
        totalCreated++;
      }
    }
  }

  console.log(chalk.blue(`\n\n📊 Summary:`));
  console.log(chalk.green(`  ✅ Updated: ${totalUpdated} files`));
  console.log(chalk.green(`  ✨ Created: ${totalCreated} files`));
  console.log(chalk.blue(`\n🎉 Deployment complete!`));
}

// Main execution
const downloadDir = process.argv[2] || 'workspaces/i18n/downloads';
const repoRoot = process.cwd();

deployTranslations(downloadDir, repoRoot).catch(error => {
  console.error(chalk.red('❌ Error:'), error);
  process.exit(1);
});
