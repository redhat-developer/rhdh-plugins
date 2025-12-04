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

import { loadTranslationFile } from '../lib/i18n/loadFile';
import { validateTranslationData } from '../lib/i18n/validateData';
import { deployTranslationFiles } from '../lib/i18n/deployFiles';
import { loadI18nConfig, mergeConfigWithOptions } from '../lib/i18n/config';

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

export async function deployCommand(opts: OptionValues): Promise<void> {
  console.log(
    chalk.blue(
      '🚀 Deploying translated strings to application language files...',
    ),
  );

  const config = await loadI18nConfig();
  const mergedOpts = await mergeConfigWithOptions(config, opts);

  const {
    sourceDir = 'i18n',
    targetDir = 'src/locales',
    languages,
    format = 'json',
    backup = true,
    validate = true,
  } = mergedOpts as {
    sourceDir?: string;
    targetDir?: string;
    languages?: string;
    format?: string;
    backup?: boolean;
    validate?: boolean;
  };

  try {
    const sourceDirStr = String(sourceDir || 'i18n');
    const targetDirStr = String(targetDir || 'src/locales');
    const formatStr = String(format || 'json');
    const languagesStr =
      languages && typeof languages === 'string' ? languages : undefined;

    if (!(await fs.pathExists(sourceDirStr))) {
      throw new Error(`Source directory not found: ${sourceDirStr}`);
    }

    await fs.ensureDir(targetDirStr);

    const filesToProcess = await findTranslationFiles(
      sourceDirStr,
      formatStr,
      languagesStr,
    );

    if (filesToProcess.length === 0) {
      console.log(
        chalk.yellow(`⚠️  No translation files found in ${sourceDirStr}`),
      );
      return;
    }

    console.log(
      chalk.yellow(
        `📁 Found ${filesToProcess.length} translation files to deploy`,
      ),
    );

    if (backup) {
      await createBackup(targetDirStr, formatStr);
    }

    const deployResults: DeployResult[] = [];

    for (const fileName of filesToProcess) {
      try {
        const result = await processTranslationFile(
          fileName,
          sourceDirStr,
          targetDirStr,
          formatStr,
          Boolean(validate),
        );
        deployResults.push(result);
      } catch (error) {
        const language = fileName.replace(`.${formatStr}`, '');
        console.error(chalk.red(`❌ Error processing ${language}:`), error);
        throw error;
      }
    }

    displaySummary(deployResults, targetDirStr, Boolean(backup));
  } catch (error) {
    console.error(chalk.red('❌ Error deploying translations:'), error);
    throw error;
  }
}
