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

import { loadI18nConfig, mergeConfigWithOptions } from '../lib/i18n/config';

import { generateCommand } from './generate';
import { uploadCommand } from './upload';
import { downloadCommand } from './download';
import { deployCommand } from './deploy';

interface SyncOptions {
  sourceDir: string;
  outputDir: string;
  localesDir: string;
  tmsUrl?: string;
  tmsToken?: string;
  projectId?: string;
  languages?: string;
  skipUpload: boolean;
  skipDownload: boolean;
  skipDeploy: boolean;
  dryRun: boolean;
}

/**
 * Check if TMS configuration is available
 */
function hasTmsConfig(
  tmsUrl?: string,
  tmsToken?: string,
  projectId?: string,
): boolean {
  return !!(tmsUrl && tmsToken && projectId);
}

/**
 * Execute step with dry run support
 */
async function executeStep(
  stepName: string,
  dryRun: boolean,
  action: () => Promise<void>,
): Promise<void> {
  if (dryRun) {
    console.log(chalk.yellow(`🔍 Dry run: Would ${stepName}`));
  } else {
    await action();
  }
}

/**
 * Step 1: Generate translation reference files
 */
async function stepGenerate(
  sourceDir: string,
  outputDir: string,
  dryRun: boolean,
): Promise<string> {
  console.log(
    chalk.blue('\n📝 Step 1: Generating translation reference files...'),
  );

  await executeStep('generate translation files', dryRun, async () => {
    await generateCommand({
      sourceDir,
      outputDir,
      format: 'json',
      includePattern: '**/*.{ts,tsx,js,jsx}',
      excludePattern: '**/node_modules/**',
      extractKeys: true,
      mergeExisting: false,
    });
  });

  return 'Generate';
}

/**
 * Step 2: Upload to TMS
 */
async function stepUpload(options: SyncOptions): Promise<string | null> {
  if (options.skipUpload) {
    console.log(chalk.yellow('⏭️  Skipping upload: --skip-upload specified'));
    return null;
  }

  if (!hasTmsConfig(options.tmsUrl, options.tmsToken, options.projectId)) {
    console.log(chalk.yellow('⚠️  Skipping upload: Missing TMS configuration'));
    return null;
  }

  console.log(chalk.blue('\n📤 Step 2: Uploading to TMS...'));

  await executeStep('upload to TMS', options.dryRun, async () => {
    await uploadCommand({
      tmsUrl: options.tmsUrl!,
      tmsToken: options.tmsToken!,
      projectId: options.projectId!,
      sourceFile: `${options.outputDir}/reference.json`,
      targetLanguages: options.languages,
      dryRun: false,
    });
  });

  return 'Upload';
}

/**
 * Step 3: Download from TMS
 */
async function stepDownload(options: SyncOptions): Promise<string | null> {
  if (options.skipDownload) {
    console.log(
      chalk.yellow('⏭️  Skipping download: --skip-download specified'),
    );
    return null;
  }

  if (!hasTmsConfig(options.tmsUrl, options.tmsToken, options.projectId)) {
    console.log(
      chalk.yellow('⚠️  Skipping download: Missing TMS configuration'),
    );
    return null;
  }

  console.log(chalk.blue('\n📥 Step 3: Downloading from TMS...'));

  await executeStep('download from TMS', options.dryRun, async () => {
    await downloadCommand({
      tmsUrl: options.tmsUrl!,
      tmsToken: options.tmsToken!,
      projectId: options.projectId!,
      outputDir: options.outputDir,
      languages: options.languages,
      format: 'json',
      includeCompleted: true,
      includeDraft: false,
    });
  });

  return 'Download';
}

/**
 * Step 4: Deploy to application
 */
async function stepDeploy(options: SyncOptions): Promise<string | null> {
  if (options.skipDeploy) {
    console.log(chalk.yellow('⏭️  Skipping deploy: --skip-deploy specified'));
    return null;
  }

  console.log(chalk.blue('\n🚀 Step 4: Deploying to application...'));

  await executeStep('deploy to application', options.dryRun, async () => {
    await deployCommand({
      sourceDir: options.outputDir,
      targetDir: options.localesDir,
      languages: options.languages,
      format: 'json',
      backup: true,
      validate: true,
    });
  });

  return 'Deploy';
}

/**
 * Display workflow summary
 */
function displaySummary(steps: string[], options: SyncOptions): void {
  console.log(chalk.green('\n✅ i18n workflow completed successfully!'));
  console.log(chalk.gray(`   Steps executed: ${steps.join(' → ')}`));

  if (options.dryRun) {
    console.log(
      chalk.blue('🔍 This was a dry run - no actual changes were made'),
    );
  } else {
    console.log(chalk.gray(`   Source directory: ${options.sourceDir}`));
    console.log(chalk.gray(`   Output directory: ${options.outputDir}`));
    console.log(chalk.gray(`   Locales directory: ${options.localesDir}`));
  }
}

export async function syncCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('🔄 Running complete i18n workflow...'));

  const config = await loadI18nConfig();
  const mergedOpts = await mergeConfigWithOptions(config, opts);

  const options: SyncOptions = {
    sourceDir: String(mergedOpts.sourceDir || 'src'),
    outputDir: String(mergedOpts.outputDir || 'i18n'),
    localesDir: String(mergedOpts.localesDir || 'src/locales'),
    tmsUrl:
      mergedOpts.tmsUrl && typeof mergedOpts.tmsUrl === 'string'
        ? mergedOpts.tmsUrl
        : undefined,
    tmsToken:
      mergedOpts.tmsToken && typeof mergedOpts.tmsToken === 'string'
        ? mergedOpts.tmsToken
        : undefined,
    projectId:
      mergedOpts.projectId && typeof mergedOpts.projectId === 'string'
        ? mergedOpts.projectId
        : undefined,
    languages:
      mergedOpts.languages && typeof mergedOpts.languages === 'string'
        ? mergedOpts.languages
        : undefined,
    skipUpload: Boolean(mergedOpts.skipUpload ?? false),
    skipDownload: Boolean(mergedOpts.skipDownload ?? false),
    skipDeploy: Boolean(mergedOpts.skipDeploy ?? false),
    dryRun: Boolean(mergedOpts.dryRun ?? false),
  };

  try {
    const steps: string[] = [];

    const generateStep = await stepGenerate(
      options.sourceDir,
      options.outputDir,
      options.dryRun,
    );
    steps.push(generateStep);

    const uploadStep = await stepUpload(options);
    if (uploadStep) {
      steps.push(uploadStep);
    }

    const downloadStep = await stepDownload(options);
    if (downloadStep) {
      steps.push(downloadStep);
    }

    const deployStep = await stepDeploy(options);
    if (deployStep) {
      steps.push(deployStep);
    }

    displaySummary(steps, options);
  } catch (error) {
    console.error(chalk.red('❌ Error in i18n workflow:'), error);
    throw error;
  }
}
