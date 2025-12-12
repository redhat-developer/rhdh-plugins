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
import { fileURLToPath } from 'url';

import { OptionValues } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import { execSync } from 'child_process';

// Get __dirname equivalent in ES modules
// eslint-disable-next-line no-restricted-syntax
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-restricted-syntax
const __dirname = path.dirname(__filename);

interface DeployResult {
  language: string;
  sourcePath: string;
  targetPath: string;
  keyCount: number;
}

/**
 * Find and filter translation files based on language requirements
 */
async function findTranslationFiles(
  sourceDir: string,
  format: string,
  languages?: string,
): Promise<string[]> {
  const translationFiles = await fs.readdir(sourceDir);
  const languageFiles = translationFiles.filter(
    file => file.endsWith(`.${format}`) && !file.startsWith('reference.'),
  );

  if (!languages) {
    return languageFiles;
  }

  const targetLanguages = languages
    .split(',')
    .map((lang: string) => lang.trim());
  return languageFiles.filter(file => {
    const language = file.replace(`.${format}`, '');
    return targetLanguages.includes(language);
  });
}

/**
 * Create backup of existing translation files
 */
async function createBackup(targetDir: string, format: string): Promise<void> {
  const backupDir = path.join(
    targetDir,
    '.backup',
    new Date().toISOString().replace(/[:.]/g, '-'),
  );
  await fs.ensureDir(backupDir);
  console.log(chalk.yellow(`💾 Creating backup in ${backupDir}...`));

  const existingFiles = await fs.readdir(targetDir).catch(() => []);
  for (const file of existingFiles) {
    if (file.endsWith(`.${format}`)) {
      await fs.copy(path.join(targetDir, file), path.join(backupDir, file));
    }
  }
}

/**
 * Validate translation data if validation is enabled
 */
async function validateTranslations(
  translationData: Record<string, string>,
  language: string,
  validate: boolean,
): Promise<void> {
  if (!validate) {
    return;
  }

  console.log(chalk.yellow(`🔍 Validating ${language} translations...`));
  const validationResult = await validateTranslationData(
    translationData,
    language,
  );

  if (!validationResult.isValid) {
    console.warn(chalk.yellow(`⚠️  Validation warnings for ${language}:`));
    for (const warning of validationResult.warnings) {
      console.warn(chalk.gray(`   ${warning}`));
    }
  }
}

/**
 * Process a single translation file
 */
async function processTranslationFile(
  fileName: string,
  sourceDir: string,
  targetDir: string,
  format: string,
  validate: boolean,
): Promise<DeployResult> {
  const language = fileName.replace(`.${format}`, '');
  const sourcePath = path.join(sourceDir, fileName);
  const targetPath = path.join(targetDir, fileName);

  console.log(chalk.yellow(`🔄 Processing ${language}...`));

  const translationData = await loadTranslationFile(sourcePath, format);

  if (!translationData || Object.keys(translationData).length === 0) {
    console.log(chalk.yellow(`⚠️  No translation data found in ${fileName}`));
    throw new Error(`No translation data in ${fileName}`);
  }

  await validateTranslations(translationData, language, validate);
  await deployTranslationFiles(translationData, targetPath, format);

  const keyCount = Object.keys(translationData).length;
  console.log(chalk.green(`✅ Deployed ${language}: ${keyCount} keys`));

  return {
    language,
    sourcePath,
    targetPath,
    keyCount,
  };
}

/**
 * Display deployment summary
 */
function displaySummary(
  deployResults: DeployResult[],
  targetDir: string,
  backup: boolean,
): void {
  console.log(chalk.green(`✅ Deployment completed successfully!`));
  console.log(chalk.gray(`   Target directory: ${targetDir}`));
  console.log(chalk.gray(`   Files deployed: ${deployResults.length}`));

  if (deployResults.length > 0) {
    console.log(chalk.blue('📁 Deployed files:'));
    for (const result of deployResults) {
      console.log(
        chalk.gray(
          `   ${result.language}: ${result.targetPath} (${result.keyCount} keys)`,
        ),
      );
    }
  }

  if (backup) {
    console.log(
      chalk.blue(`💾 Backup created: ${path.join(targetDir, '.backup')}`),
    );
  }
}

/**
 * Deploy translations using the TypeScript deployment script
 */
async function deployWithTypeScriptScript(
  sourceDir: string,
  repoRoot: string,
): Promise<void> {
  // Find the deployment script
  // Try multiple possible locations
  const possibleScriptPaths = [
    // From built location (dist/commands -> dist -> scripts)
    // eslint-disable-next-line no-restricted-syntax
    path.resolve(__dirname, '../../scripts/deploy-translations.ts'),
    // From source location (src/commands -> src -> scripts)
    // eslint-disable-next-line no-restricted-syntax
    path.resolve(__dirname, '../../../scripts/deploy-translations.ts'),
    // From repo root
    path.resolve(
      repoRoot,
      'workspaces/translations/packages/cli/scripts/deploy-translations.ts',
    ),
  ];

  let scriptPath: string | null = null;
  for (const possiblePath of possibleScriptPaths) {
    if (await fs.pathExists(possiblePath)) {
      scriptPath = possiblePath;
      break;
    }
  }

  if (!scriptPath) {
    throw new Error(
      `Deployment script not found. Tried: ${possibleScriptPaths.join(', ')}`,
    );
  }

  // Use tsx to run the TypeScript script
  try {
    execSync('which tsx', { stdio: 'pipe' });
  } catch {
    throw new Error(
      'tsx not found. Please install it: npm install -g tsx, or yarn add -D tsx',
    );
  }

  // Run the script with tsx
  execSync(`tsx ${scriptPath} ${sourceDir}`, {
    stdio: 'inherit',
    cwd: repoRoot,
    env: { ...process.env },
  });
}

export async function deployCommand(opts: OptionValues): Promise<void> {
  console.log(
    chalk.blue(
      '🚀 Deploying translated strings to application language files...',
    ),
  );

  const { sourceDir = 'i18n/downloads' } = opts as {
    sourceDir?: string;
  };

  try {
    const sourceDirStr = String(sourceDir || 'i18n/downloads');
    const repoRoot = process.cwd();

    if (!(await fs.pathExists(sourceDirStr))) {
      throw new Error(`Source directory not found: ${sourceDirStr}`);
    }

    // Check if there are any JSON files in the source directory
    const files = await fs.readdir(sourceDirStr);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.log(
        chalk.yellow(`⚠️  No translation JSON files found in ${sourceDirStr}`),
      );
      console.log(
        chalk.gray(
          '   Make sure you have downloaded translations first using:',
        ),
      );
      console.log(chalk.gray('   translations-cli i18n download'));
      return;
    }

    console.log(
      chalk.yellow(
        `📁 Found ${jsonFiles.length} translation file(s) to deploy`,
      ),
    );

    // Deploy using TypeScript script
    await deployWithTypeScriptScript(sourceDirStr, repoRoot);

    console.log(chalk.green(`✅ Deployment completed successfully!`));
  } catch (error: any) {
    console.error(chalk.red('❌ Error deploying translations:'), error.message);
    throw error;
  }
}
