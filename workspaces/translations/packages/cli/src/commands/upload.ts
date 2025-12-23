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

import fs from 'fs-extra';
import { OptionValues } from 'commander';
import chalk from 'chalk';

import { validateTranslationFile } from '../lib/i18n/validateFile';
import { loadI18nConfig, mergeConfigWithOptions } from '../lib/i18n/config';
import {
  hasFileChanged,
  saveUploadCache,
  getCachedUpload,
} from '../lib/i18n/uploadCache';
import { commandExists, safeExecSyncOrThrow } from '../lib/utils/exec';
import { countTranslationKeys } from '../lib/utils/translationUtils';

/**
 * Detect repository name from git or directory
 */
function detectRepoName(): string {
  try {
    // Try to get repo name from git
    const gitRepoUrl = safeExecSyncOrThrow('git', [
      'config',
      '--get',
      'remote.origin.url',
    ]);
    if (gitRepoUrl) {
      // Extract repo name from URL (handles both https and ssh formats)
      // Use a safer regex pattern to avoid ReDoS vulnerability
      // Remove .git suffix first, then extract the last path segment
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

  // Fallback: use current directory name
  return path.basename(process.cwd());
}

/**
 * Generate upload filename: {repo-name}-reference-{YYYY-MM-DD}.json
 */
function generateUploadFileName(
  sourceFile: string,
  customName?: string,
): string {
  if (customName) {
    // Use custom name if provided, ensure it has the right extension
    const ext = path.extname(sourceFile);
    return customName.endsWith(ext) ? customName : `${customName}${ext}`;
  }

  // Auto-generate: {repo-name}-reference-{date}.json
  const repoName = detectRepoName();
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const ext = path.extname(sourceFile);
  return `${repoName}-reference-${date}${ext}`;
}

/**
 * Create temporary file with custom name if needed
 */
async function prepareUploadFile(
  filePath: string,
  uploadFileName?: string,
): Promise<{ fileToUpload: string; tempFile: string | null }> {
  const absoluteFilePath = path.resolve(filePath);
  let fileToUpload = absoluteFilePath;
  let tempFile: string | null = null;

  if (uploadFileName && path.basename(absoluteFilePath) !== uploadFileName) {
    const tempDir = path.join(path.dirname(absoluteFilePath), '.i18n-temp');
    await fs.ensureDir(tempDir);
    tempFile = path.join(tempDir, uploadFileName);
    await fs.copy(absoluteFilePath, tempFile);
    fileToUpload = tempFile;
    console.log(
      chalk.gray(`   Created temporary file with name: ${uploadFileName}`),
    );
  }

  return { fileToUpload, tempFile };
}

/**
 * Validate memsource CLI prerequisites
 */
function validateMemsourcePrerequisites(): void {
  if (!commandExists('memsource')) {
    throw new Error(
      'memsource CLI not found. Please ensure memsource-cli is installed and ~/.memsourcerc is sourced.',
    );
  }
}

/**
 * Build memsource job create command arguments
 */
function buildUploadCommandArgs(
  projectId: string,
  targetLanguages: string[],
  fileToUpload: string,
): string[] {
  if (targetLanguages.length === 0) {
    throw new Error(
      'Target languages are required. Please specify --target-languages or configure them in .i18n.config.json',
    );
  }

  return [
    'job',
    'create',
    '--project-id',
    projectId,
    '--target-langs',
    ...targetLanguages,
    '--filenames',
    fileToUpload,
  ];
}

/**
 * Extract error message from command execution error
 */
function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unknown error';
  }

  let errorMessage = error.message;

  if (
    'stderr' in error &&
    typeof (error as { stderr?: Buffer }).stderr === 'object'
  ) {
    const stderr = (error as { stderr: Buffer }).stderr;
    if (stderr) {
      const stderrText = stderr.toString('utf-8');
      if (stderrText) {
        errorMessage = stderrText.trim();
      }
    }
  }

  return errorMessage;
}

/**
 * Count translation keys from file
 */
async function countKeysFromFile(filePath: string): Promise<number> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return countTranslationKeys(data);
  } catch {
    return 0;
  }
}

/**
 * Clean up temporary file and directory
 */
async function cleanupTempFile(tempFile: string): Promise<void> {
  try {
    if (await fs.pathExists(tempFile)) {
      await fs.remove(tempFile);
    }

    const tempDir = path.dirname(tempFile);
    if (await fs.pathExists(tempDir)) {
      const files = await fs.readdir(tempDir);
      if (files.length === 0) {
        await fs.remove(tempDir);
      }
    }
  } catch (cleanupError) {
    console.warn(
      chalk.yellow(
        `   Warning: Failed to clean up temporary file: ${cleanupError}`,
      ),
    );
  }
}

/**
 * Execute memsource upload command
 */
async function executeMemsourceUpload(
  args: string[],
  fileToUpload: string,
): Promise<void> {
  const output = safeExecSyncOrThrow('memsource', args, {
    encoding: 'utf-8',
    stdio: 'pipe',
    env: { ...process.env },
  });

  const trimmed = output?.trim();
  if (trimmed) {
    console.log(chalk.gray(`   ${trimmed}`));
  }
}

/**
 * Upload file using memsource CLI (matching the team's script approach)
 */
async function uploadWithMemsourceCLI(
  filePath: string,
  projectId: string,
  targetLanguages: string[],
  uploadFileName?: string,
): Promise<{ fileName: string; keyCount: number }> {
  validateMemsourcePrerequisites();

  const absoluteFilePath = path.resolve(filePath);
  const { fileToUpload, tempFile } = await prepareUploadFile(
    filePath,
    uploadFileName,
  );

  const args = buildUploadCommandArgs(projectId, targetLanguages, fileToUpload);

  try {
    await executeMemsourceUpload(args, fileToUpload);

    const keyCount = await countKeysFromFile(fileToUpload);

    return {
      fileName: uploadFileName || path.basename(absoluteFilePath),
      keyCount,
    };
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`memsource CLI upload failed: ${errorMessage}`);
  } finally {
    if (tempFile) {
      await cleanupTempFile(tempFile);
    }
  }
}

/**
 * Extract and validate string values from merged options
 */
function extractStringOption(value: unknown): string | undefined {
  return value && typeof value === 'string' ? value : undefined;
}

/**
 * Validate TMS configuration and return validated values
 */
function validateTmsConfig(
  tmsUrl: unknown,
  tmsToken: unknown,
  projectId: unknown,
): {
  tmsUrl: string;
  tmsToken: string;
  projectId: string;
} | null {
  const tmsUrlStr = extractStringOption(tmsUrl);
  const tmsTokenStr = extractStringOption(tmsToken);
  const projectIdStr = extractStringOption(projectId);

  if (!tmsUrlStr || !tmsTokenStr || !projectIdStr) {
    return null;
  }

  return { tmsUrl: tmsUrlStr, tmsToken: tmsTokenStr, projectId: projectIdStr };
}

/**
 * Display error message for missing TMS configuration
 */
function displayMissingConfigError(
  tmsUrlStr?: string,
  tmsTokenStr?: string,
  projectIdStr?: string,
): void {
  console.error(chalk.red('❌ Missing required TMS configuration:'));
  console.error('');

  const missingConfigs = [
    {
      value: tmsUrlStr,
      label: 'TMS URL',
      messages: [
        '     Set via: --tms-url <url> or I18N_TMS_URL or .i18n.config.json',
      ],
    },
    {
      value: tmsTokenStr,
      label: 'TMS Token',
      messages: [
        '     Primary: Source ~/.memsourcerc (sets MEMSOURCE_TOKEN)',
        '     Fallback: --tms-token <token> or I18N_TMS_TOKEN or ~/.i18n.auth.json',
      ],
    },
    {
      value: projectIdStr,
      label: 'Project ID',
      messages: [
        '     Set via: --project-id <id> or I18N_TMS_PROJECT_ID or .i18n.config.json',
      ],
    },
  ];

  missingConfigs
    .filter(item => !item.value)
    .forEach(item => {
      console.error(chalk.yellow(`   ✗ ${item.label}`));
      item.messages.forEach(message => {
        console.error(chalk.gray(message));
      });
    });

  console.error('');
  console.error(chalk.blue('📋 Quick Setup Guide:'));
  console.error(chalk.gray('   1. Run: translations-cli i18n init'));
  console.error(chalk.gray('      This creates .i18n.config.json'));
  console.error('');
  console.error(
    chalk.gray('   2. Edit .i18n.config.json in your project root:'),
  );
  console.error(
    chalk.gray(
      '      - Add your TMS URL (e.g., "https://cloud.memsource.com/web")',
    ),
  );
  console.error(chalk.gray('      - Add your Project ID'));
  console.error('');
  console.error(
    chalk.gray('   3. Set up Memsource authentication (recommended):'),
  );
  console.error(
    chalk.gray('      - Run: translations-cli i18n setup-memsource'),
  );
  console.error(
    chalk.gray(
      '      - Or manually create ~/.memsourcerc following localization team instructions',
    ),
  );
  console.error(chalk.gray('      - Then source it: source ~/.memsourcerc'));
  console.error('');
  console.error(
    chalk.gray(
      '   OR use ~/.i18n.auth.json as fallback (run init to create it)',
    ),
  );
  console.error('');
  console.error(
    chalk.gray('   See docs/i18n-commands.md for detailed instructions.'),
  );
}

/**
 * Validate source file exists and has valid format
 */
async function validateSourceFile(sourceFile: string): Promise<void> {
  if (!(await fs.pathExists(sourceFile))) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }

  console.log(chalk.yellow(`🔍 Validating ${sourceFile}...`));
  const isValid = await validateTranslationFile(sourceFile);
  if (!isValid) {
    throw new Error(`Invalid translation file format: ${sourceFile}`);
  }

  console.log(chalk.green(`✅ Translation file is valid`));
}

/**
 * Check file change status and display appropriate warnings
 */
async function checkFileChangeAndWarn(
  sourceFile: string,
  projectId: string,
  tmsUrl: string,
  finalUploadFileName: string,
  force: boolean,
  cachedEntry:
    | { uploadedAt: string; uploadFileName?: string }
    | null
    | undefined,
): Promise<boolean> {
  if (force) {
    console.log(
      chalk.yellow(`⚠️  Force upload enabled - skipping cache check`),
    );
    return true;
  }

  const fileChanged = await hasFileChanged(sourceFile, projectId, tmsUrl);
  const sameFilename = cachedEntry?.uploadFileName === finalUploadFileName;

  if (!fileChanged && cachedEntry && sameFilename) {
    console.log(
      chalk.yellow(
        `ℹ️  File has not changed since last upload (${new Date(
          cachedEntry.uploadedAt,
        ).toLocaleString()})`,
      ),
    );
    console.log(chalk.gray(`   Upload filename: ${finalUploadFileName}`));
    console.log(chalk.gray(`   Skipping upload to avoid duplicate.`));
    console.log(
      chalk.gray(
        `   Use --force to upload anyway, or delete .i18n-cache to clear cache.`,
      ),
    );
    return false;
  }

  if (!fileChanged && cachedEntry && !sameFilename) {
    console.log(
      chalk.yellow(
        `⚠️  File content unchanged, but upload filename differs from last upload:`,
      ),
    );
    console.log(
      chalk.gray(`   Last upload: ${cachedEntry.uploadFileName || 'unknown'}`),
    );
    console.log(chalk.gray(`   This upload: ${finalUploadFileName}`));
    console.log(chalk.gray(`   This will create a new job in Memsource.`));
  }

  return true;
}

export async function uploadCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('📤 Uploading translation reference files to TMS...'));

  const config = await loadI18nConfig();
  const mergedOpts = await mergeConfigWithOptions(config, opts);

  const {
    tmsUrl,
    tmsToken,
    projectId,
    sourceFile,
    targetLanguages,
    uploadFileName,
    dryRun = false,
    force = false,
  } = mergedOpts as {
    tmsUrl?: string;
    tmsToken?: string;
    projectId?: string;
    sourceFile?: string;
    targetLanguages?: string;
    uploadFileName?: string;
    dryRun?: boolean;
    force?: boolean;
  };

  const tmsConfig = validateTmsConfig(tmsUrl, tmsToken, projectId);
  if (!tmsConfig) {
    const tmsUrlStr = extractStringOption(tmsUrl);
    const tmsTokenStr = extractStringOption(tmsToken);
    const projectIdStr = extractStringOption(projectId);
    displayMissingConfigError(tmsUrlStr, tmsTokenStr, projectIdStr);
    process.exit(1);
  }

  const sourceFileStr = extractStringOption(sourceFile);
  if (!sourceFileStr) {
    console.error(chalk.red('❌ Missing required option: --source-file'));
    process.exit(1);
  }

  try {
    await validateSourceFile(sourceFileStr);

    const finalUploadFileName =
      uploadFileName && typeof uploadFileName === 'string'
        ? generateUploadFileName(sourceFileStr, uploadFileName)
        : generateUploadFileName(sourceFileStr);

    const cachedEntry = await getCachedUpload(
      sourceFileStr,
      tmsConfig.projectId,
      tmsConfig.tmsUrl,
    );

    const shouldProceed = await checkFileChangeAndWarn(
      sourceFileStr,
      tmsConfig.projectId,
      tmsConfig.tmsUrl,
      finalUploadFileName,
      force,
      cachedEntry,
    );

    if (!shouldProceed) {
      return;
    }

    if (dryRun) {
      simulateUpload(
        tmsConfig.tmsUrl,
        tmsConfig.projectId,
        sourceFileStr,
        finalUploadFileName,
        targetLanguages,
        cachedEntry,
      );
      return;
    }

    await performUpload(
      tmsConfig.tmsUrl,
      tmsConfig.tmsToken,
      tmsConfig.projectId,
      sourceFileStr,
      finalUploadFileName,
      targetLanguages,
      force,
    );
  } catch (error) {
    console.error(chalk.red('❌ Error uploading translation file:'), error);
    throw error;
  }
}

/**
 * Simulate upload (show what would be uploaded)
 */
function simulateUpload(
  tmsUrl: string,
  projectId: string,
  sourceFile: string,
  uploadFileName: string,
  targetLanguages?: string,
  cachedEntry?: { uploadedAt: string; uploadFileName?: string } | null,
): void {
  console.log(
    chalk.yellow('🔍 Dry run mode - showing what would be uploaded:'),
  );
  console.log(chalk.gray(`   TMS URL: ${tmsUrl}`));
  console.log(chalk.gray(`   Project ID: ${projectId}`));
  console.log(chalk.gray(`   Source file: ${sourceFile}`));
  console.log(chalk.gray(`   Upload filename: ${uploadFileName}`));
  console.log(
    chalk.gray(
      `   Target languages: ${targetLanguages || 'All configured languages'}`,
    ),
  );
  if (cachedEntry) {
    console.log(
      chalk.gray(
        `   Last uploaded: ${new Date(
          cachedEntry.uploadedAt,
        ).toLocaleString()}`,
      ),
    );
  }
}

/**
 * Perform actual upload
 */
async function performUpload(
  tmsUrl: string,
  tmsToken: string | undefined,
  projectId: string,
  sourceFile: string,
  uploadFileName: string,
  targetLanguages: string | undefined,
  force: boolean,
): Promise<void> {
  // Check if MEMSOURCE_TOKEN is available (should be set from ~/.memsourcerc)
  if (!process.env.MEMSOURCE_TOKEN && !tmsToken) {
    console.error(chalk.red('❌ MEMSOURCE_TOKEN not found in environment'));
    console.error(chalk.yellow('   Please source ~/.memsourcerc first:'));
    console.error(chalk.gray('     source ~/.memsourcerc'));
    console.error(chalk.gray('   Or set MEMSOURCE_TOKEN environment variable'));
    process.exit(1);
  }

  // Load config for language fallback
  const config = await loadI18nConfig();

  // Use memsource CLI for upload (matching team's script approach)
  console.log(
    chalk.yellow(`🔗 Using memsource CLI to upload to project ${projectId}...`),
  );

  // Parse target languages - check config first if not provided via CLI
  let languages: string[] = [];
  if (targetLanguages && typeof targetLanguages === 'string') {
    languages = targetLanguages
      .split(',')
      .map((lang: string) => lang.trim())
      .filter(Boolean);
  } else if (
    config.languages &&
    Array.isArray(config.languages) &&
    config.languages.length > 0
  ) {
    // Fallback to config languages
    languages = config.languages;
    console.log(
      chalk.gray(
        `   Using target languages from config: ${languages.join(', ')}`,
      ),
    );
  }

  // Target languages are REQUIRED by memsource
  if (languages.length === 0) {
    console.error(chalk.red('❌ Target languages are required'));
    console.error(chalk.yellow('   Please specify one of:'));
    console.error(
      chalk.gray('     1. --target-languages it (or other language codes)'),
    );
    console.error(
      chalk.gray('     2. Add "languages": ["it"] to .i18n.config.json'),
    );
    process.exit(1);
  }

  // Upload using memsource CLI
  console.log(chalk.yellow(`📤 Uploading ${sourceFile}...`));
  console.log(chalk.gray(`   Upload filename: ${uploadFileName}`));
  if (languages.length > 0) {
    console.log(chalk.gray(`   Target languages: ${languages.join(', ')}`));
  }

  const uploadResult = await uploadWithMemsourceCLI(
    sourceFile,
    projectId,
    languages,
    uploadFileName,
  );

  // Calculate key count for cache
  const fileContent = await fs.readFile(sourceFile, 'utf-8');
  let keyCount = uploadResult.keyCount;
  if (keyCount === 0) {
    // Fallback: count keys from file
    try {
      const data = JSON.parse(fileContent);
      keyCount = countTranslationKeys(data);
    } catch {
      // If parsing fails, use 0
      keyCount = 0;
    }
  }

  // Save upload cache (include upload filename to prevent duplicates with different names)
  await saveUploadCache(
    sourceFile,
    projectId,
    tmsUrl,
    keyCount,
    uploadFileName,
  );

  console.log(chalk.green(`✅ Upload completed successfully!`));
  console.log(chalk.gray(`   File: ${uploadResult.fileName}`));
  console.log(chalk.gray(`   Keys: ${keyCount}`));
  if (languages.length > 0) {
    console.log(chalk.gray(`   Target languages: ${languages.join(', ')}`));
  }
}
