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

import { loadI18nConfig, mergeConfigWithOptions } from '../lib/i18n/config';
import { safeExecSyncOrThrow } from '../lib/utils/exec';

import { generateCommand } from './generate';
import { uploadCommand } from './upload';
import { downloadCommand } from './download';
import { deployCommand } from './deploy';

interface SyncOptions {
  sourceDir: string;
  outputDir: string;
  localesDir: string;
  sprint?: string;
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
 * Execute a step (actually perform the action)
 */
async function executeStep(
  _stepName: string,
  action: () => Promise<void>,
): Promise<void> {
  await action();
}

/**
 * Simulate a step (show what would be done)
 */
function simulateStep(stepName: string): void {
  console.log(chalk.yellow(`🔍 Dry run: Would ${stepName}`));
}

/**
 * Step 1: Generate translation reference files
 */
async function stepGenerate(
  sourceDir: string,
  outputDir: string,
  sprint: string | undefined,
  dryRun: boolean,
): Promise<{ step: string; generatedFile?: string }> {
  console.log(
    chalk.blue('\n📝 Step 1: Generating translation reference files...'),
  );

  if (dryRun) {
    simulateStep('generate translation files');
    return { step: 'Generate' };
  }
  let generatedFile: string | undefined;
  await executeStep('generate translation files', async () => {
    if (!sprint) {
      throw new Error(
        '--sprint is required for generate command. Please provide --sprint option (e.g., --sprint s3285)',
      );
    }
    await generateCommand({
      sourceDir,
      outputDir,
      sprint,
      format: 'json',
      includePattern: '**/*.{ts,tsx,js,jsx}',
      excludePattern: '**/node_modules/**',
      extractKeys: true,
      mergeExisting: false,
    });

    // Try to determine the generated filename
    // Format: {repo}-{sprint}.json
    const repoName = detectRepoName();
    const normalizedSprint =
      sprint.startsWith('s') || sprint.startsWith('S')
        ? sprint.toLowerCase()
        : `s${sprint}`;
    generatedFile = `${repoName.toLowerCase()}-${normalizedSprint}.json`;
  });
  return { step: 'Generate', generatedFile };
}

/**
 * Detect repository name from git or directory
 */
function detectRepoName(repoPath?: string): string {
  const targetPath = repoPath || process.cwd();

  try {
    // Try to get repo name from git
    const gitRepoUrl = safeExecSyncOrThrow(
      'git',
      ['config', '--get', 'remote.origin.url'],
      {
        cwd: targetPath,
      },
    );
    if (gitRepoUrl) {
      // Extract repo name from URL (handles both https and ssh formats)
      let repoName = gitRepoUrl.replace(/\.git$/, '');
      const lastSlashIndex = repoName.lastIndexOf('/');
      if (lastSlashIndex >= 0) {
        repoName = repoName.substring(lastSlashIndex + 1);
      }
      if (repoName) {
        return repoName;
      }
    }
  } catch {
    // Git not available or not a git repo
  }

  // Fallback: use directory name
  return path.basename(targetPath);
}

/**
 * Step 2: Upload to TMS
 */
async function stepUpload(
  options: SyncOptions,
  generatedFile?: string,
): Promise<string | null> {
  if (options.skipUpload) {
    console.log(chalk.yellow('⏭️  Skipping upload: --skip-upload specified'));
    return null;
  }

  if (!hasTmsConfig(options.tmsUrl, options.tmsToken, options.projectId)) {
    console.log(chalk.yellow('⚠️  Skipping upload: Missing TMS configuration'));
    return null;
  }

  const tmsUrl = options.tmsUrl;
  const tmsToken = options.tmsToken;
  const projectId = options.projectId;

  console.log(chalk.blue('\n📤 Step 2: Uploading to TMS...'));

  // Determine source file path
  // Use generated file if available, otherwise try to construct from sprint
  let sourceFile: string;
  if (generatedFile) {
    sourceFile = `${options.outputDir}/${generatedFile}`;
  } else if (options.sprint) {
    // Fallback: construct filename from sprint
    const repoName = detectRepoName();
    const normalizedSprint =
      options.sprint.startsWith('s') || options.sprint.startsWith('S')
        ? options.sprint.toLowerCase()
        : `s${options.sprint}`;
    sourceFile = `${
      options.outputDir
    }/${repoName.toLowerCase()}-${normalizedSprint}.json`;
  } else {
    throw new Error(
      'Cannot determine source file for upload. Please provide --sprint option or ensure generate step completed successfully.',
    );
  }

  if (options.dryRun) {
    simulateStep('upload to TMS');
  } else {
    await executeStep('upload to TMS', async () => {
      await uploadCommand({
        tmsUrl,
        tmsToken,
        projectId,
        sourceFile,
        targetLanguages: options.languages,
        dryRun: false,
      });
    });
  }

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

  const tmsUrl = options.tmsUrl;
  const tmsToken = options.tmsToken;
  const projectId = options.projectId;

  console.log(chalk.blue('\n📥 Step 3: Downloading from TMS...'));

  if (options.dryRun) {
    simulateStep('download from TMS');
  } else {
    await executeStep('download from TMS', async () => {
      await downloadCommand({
        tmsUrl,
        tmsToken,
        projectId,
        outputDir: options.outputDir,
        languages: options.languages,
        format: 'json',
        includeCompleted: true,
        includeDraft: false,
      });
    });
  }

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

  if (options.dryRun) {
    simulateStep('deploy to application');
  } else {
    await executeStep('deploy to application', async () => {
      await deployCommand({
        sourceDir: options.outputDir,
        targetDir: options.localesDir,
        languages: options.languages,
        format: 'json',
        backup: true,
        validate: true,
      });
    });
  }

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
    sprint:
      mergedOpts.sprint && typeof mergedOpts.sprint === 'string'
        ? mergedOpts.sprint
        : undefined,
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
    const generateResult = await stepGenerate(
      options.sourceDir,
      options.outputDir,
      options.sprint,
      options.dryRun,
    );

    const allSteps = [
      generateResult.step,
      await stepUpload(options, generateResult.generatedFile),
      await stepDownload(options),
      await stepDeploy(options),
    ];

    const steps = allSteps.filter((step): step is string => Boolean(step));

    displaySummary(steps, options);
  } catch (error) {
    console.error(chalk.red('❌ Error in i18n workflow:'), error);
    throw error;
  }
}
