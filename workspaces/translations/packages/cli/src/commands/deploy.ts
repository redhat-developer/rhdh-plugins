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

import { OptionValues } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';

import { deployTranslations } from '../lib/i18n/deployTranslations';

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

    // Deploy translations using library function
    await deployTranslations(sourceDirStr, repoRoot);

    console.log(chalk.green(`✅ Deployment completed successfully!`));
  } catch (error: any) {
    console.error(chalk.red('❌ Error deploying translations:'), error.message);
    throw error;
  }
}
