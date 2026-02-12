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

import chalk from 'chalk';
import { OptionValues } from 'commander';
import fs from 'fs-extra';

interface CleanupTask {
  name: string;
  path: string;
  files: string[];
}

/**
 * Find temporary files in i18n directory
 */
async function findI18nTempFiles(i18nDir: string): Promise<string[]> {
  if (!(await fs.pathExists(i18nDir))) {
    return [];
  }

  const files = await fs.readdir(i18nDir);
  return files.filter(
    file =>
      file.startsWith('.') || file.endsWith('.tmp') || file.endsWith('.cache'),
  );
}

/**
 * Collect all cleanup tasks from specified directories
 */
async function collectCleanupTasks(
  i18nDir: string,
  cacheDir: string,
  backupDir: string,
): Promise<CleanupTask[]> {
  const [i18nTempFiles, cacheExists, backupExists] = await Promise.all([
    findI18nTempFiles(i18nDir),
    fs.pathExists(cacheDir),
    fs.pathExists(backupDir),
  ]);

  const taskPromises: Promise<CleanupTask | null>[] = [
    Promise.resolve(
      i18nTempFiles.length > 0
        ? {
            name: 'i18n directory',
            path: i18nDir,
            files: i18nTempFiles,
          }
        : null,
    ),
    cacheExists
      ? fs.readdir(cacheDir).then(files => ({
          name: 'cache directory',
          path: cacheDir,
          files,
        }))
      : Promise.resolve(null),
    backupExists
      ? fs.readdir(backupDir).then(files => ({
          name: 'backup directory',
          path: backupDir,
          files,
        }))
      : Promise.resolve(null),
  ];

  const tasks = await Promise.all(taskPromises);
  return tasks.filter((task): task is CleanupTask => task !== null);
}

/**
 * Display what will be cleaned
 */
function displayCleanupPreview(cleanupTasks: CleanupTask[]): void {
  console.log(chalk.yellow('📋 Files to be cleaned:'));
  for (const task of cleanupTasks) {
    console.log(chalk.gray(`   ${task.name}: ${task.files.length} files`));
    for (const file of task.files) {
      console.log(chalk.gray(`     - ${file}`));
    }
  }
}

/**
 * Perform the actual cleanup of files
 */
async function performCleanup(cleanupTasks: CleanupTask[]): Promise<number> {
  let totalCleaned = 0;

  for (const task of cleanupTasks) {
    console.log(chalk.yellow(`🧹 Cleaning ${task.name}...`));

    for (const file of task.files) {
      const filePath = path.join(task.path, file);
      try {
        await fs.remove(filePath);
        totalCleaned++;
      } catch (error) {
        console.warn(
          chalk.yellow(`⚠️  Could not remove ${filePath}: ${error}`),
        );
      }
    }
  }

  return totalCleaned;
}

/**
 * Remove empty directories after cleanup
 */
async function removeEmptyDirectories(
  cleanupTasks: CleanupTask[],
): Promise<void> {
  for (const task of cleanupTasks) {
    const remainingFiles = await fs.readdir(task.path).catch(() => []);
    if (remainingFiles.length === 0) {
      try {
        await fs.remove(task.path);
        console.log(chalk.gray(`   Removed empty directory: ${task.path}`));
      } catch {
        // Directory might not be empty or might have subdirectories - ignore silently
        // This is expected behavior when directory removal fails
      }
    }
  }
}

/**
 * Display cleanup summary
 */
function displaySummary(
  totalCleaned: number,
  directoriesProcessed: number,
): void {
  console.log(chalk.green(`✅ Cleanup completed successfully!`));
  console.log(chalk.gray(`   Files cleaned: ${totalCleaned}`));
  console.log(chalk.gray(`   Directories processed: ${directoriesProcessed}`));
}

export async function cleanCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('🧹 Cleaning up temporary i18n files and caches...'));

  const {
    i18nDir = 'i18n',
    cacheDir = '.i18n-cache',
    backupDir = '.i18n-backup',
    force = false,
  } = opts;

  try {
    const cleanupTasks = await collectCleanupTasks(
      i18nDir,
      cacheDir,
      backupDir,
    );

    if (cleanupTasks.length === 0) {
      console.log(chalk.yellow('✨ No temporary files found to clean'));
      return;
    }

    displayCleanupPreview(cleanupTasks);

    if (force) {
      const totalCleaned = await performCleanup(cleanupTasks);
      await removeEmptyDirectories(cleanupTasks);
      displaySummary(totalCleaned, cleanupTasks.length);
    } else {
      console.log(
        chalk.yellow('⚠️  This will permanently delete the above files.'),
      );
      console.log(chalk.yellow('   Use --force to skip this confirmation.'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error during cleanup:'), error);
    throw error;
  }
}
