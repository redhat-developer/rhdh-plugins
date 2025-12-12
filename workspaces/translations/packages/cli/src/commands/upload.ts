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
      const match = gitRepoUrl.match(/([^/]+?)(?:\.git)?$/);
      if (match) {
        return match[1];
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
 * Upload file using memsource CLI (matching the team's script approach)
 */
async function uploadWithMemsourceCLI(
  filePath: string,
  projectId: string,
  targetLanguages: string[],
  uploadFileName?: string,
): Promise<{ fileName: string; keyCount: number }> {
  // Ensure file path is absolute
  const absoluteFilePath = path.resolve(filePath);

  // If a custom upload filename is provided, create a temporary copy with that name
  let fileToUpload = absoluteFilePath;
  let tempFile: string | null = null;

  if (uploadFileName && path.basename(absoluteFilePath) !== uploadFileName) {
    // Create temporary directory and copy file with new name
    const tempDir = path.join(path.dirname(absoluteFilePath), '.i18n-temp');
    await fs.ensureDir(tempDir);
    tempFile = path.join(tempDir, uploadFileName);
    await fs.copy(absoluteFilePath, tempFile);
    fileToUpload = tempFile;
    console.log(
      chalk.gray(`   Created temporary file with name: ${uploadFileName}`),
    );
  }

  // Check if memsource CLI is available
  if (!commandExists('memsource')) {
    throw new Error(
      'memsource CLI not found. Please ensure memsource-cli is installed and ~/.memsourcerc is sourced.',
    );
  }

  // Build memsource job create command
  // Format: memsource job create --project-id <uid> --target-langs <lang1> <lang2> ... --filenames <file>
  // Note: targetLangs is REQUIRED by memsource API
  const args = ['job', 'create', '--project-id', projectId];

  // Target languages should already be provided by the caller
  // This function just uses them directly
  const finalTargetLanguages = targetLanguages;

  if (finalTargetLanguages.length === 0) {
    throw new Error(
      'Target languages are required. Please specify --target-languages or configure them in .i18n.config.json',
    );
  }

  args.push('--target-langs', ...finalTargetLanguages);
  args.push('--filenames', fileToUpload);

  // Execute memsource command
  // Note: MEMSOURCE_TOKEN should be set from ~/.memsourcerc
  try {
    const output = safeExecSyncOrThrow('memsource', args, {
      encoding: 'utf-8',
      stdio: 'pipe', // Capture both stdout and stderr
      env: {
        ...process.env,
        // Ensure MEMSOURCE_TOKEN is available (should be set from .memsourcerc)
      },
    });

    // Log output if any
    if (output && output.trim()) {
      console.log(chalk.gray(`   ${output.trim()}`));
    }

    // Parse output to get job info if available
    // For now, we'll estimate key count from the file
    const fileContent = await fs.readFile(fileToUpload, 'utf-8');
    let keyCount = 0;
    try {
      const data = JSON.parse(fileContent);
      keyCount = countTranslationKeys(data);
    } catch {
      // If parsing fails, use a default
      keyCount = 0;
    }

    const result = {
      fileName: uploadFileName || path.basename(absoluteFilePath),
      keyCount,
    };

    return result;
  } catch (error: unknown) {
    // Extract error message from command execution error
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      // execSync errors include stderr in the message sometimes
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
    }
    throw new Error(`memsource CLI upload failed: ${errorMessage}`);
  } finally {
    // Clean up temporary file if created (even on error)
    if (tempFile) {
      try {
        if (await fs.pathExists(tempFile)) {
          await fs.remove(tempFile);
        }
        // Also remove temp directory if empty
        const tempDir = path.dirname(tempFile);
        if (await fs.pathExists(tempDir)) {
          const files = await fs.readdir(tempDir);
          if (files.length === 0) {
            await fs.remove(tempDir);
          }
        }
      } catch (cleanupError) {
        // Log but don't fail on cleanup errors
        console.warn(
          chalk.yellow(
            `   Warning: Failed to clean up temporary file: ${cleanupError}`,
          ),
        );
      }
    }
  }
}

export async function uploadCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('📤 Uploading translation reference files to TMS...'));

  // Load config and merge with options
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

  // Validate required options
  const tmsUrlStr = tmsUrl && typeof tmsUrl === 'string' ? tmsUrl : undefined;
  const tmsTokenStr =
    tmsToken && typeof tmsToken === 'string' ? tmsToken : undefined;
  const projectIdStr =
    projectId && typeof projectId === 'string' ? projectId : undefined;
  const sourceFileStr =
    sourceFile && typeof sourceFile === 'string' ? sourceFile : undefined;

  if (!tmsUrlStr || !tmsTokenStr || !projectIdStr) {
    console.error(chalk.red('❌ Missing required TMS configuration:'));
    console.error('');

    const missingItems: string[] = [];
    if (!tmsUrlStr) {
      missingItems.push('TMS URL');
      console.error(chalk.yellow('   ✗ TMS URL'));
      console.error(
        chalk.gray(
          '     Set via: --tms-url <url> or I18N_TMS_URL or .i18n.config.json',
        ),
      );
    }
    if (!tmsTokenStr) {
      missingItems.push('TMS Token');
      console.error(chalk.yellow('   ✗ TMS Token'));
      console.error(
        chalk.gray(
          '     Primary: Source ~/.memsourcerc (sets MEMSOURCE_TOKEN)',
        ),
      );
      console.error(
        chalk.gray(
          '     Fallback: --tms-token <token> or I18N_TMS_TOKEN or ~/.i18n.auth.json',
        ),
      );
    }
    if (!projectIdStr) {
      missingItems.push('Project ID');
      console.error(chalk.yellow('   ✗ Project ID'));
      console.error(
        chalk.gray(
          '     Set via: --project-id <id> or I18N_TMS_PROJECT_ID or .i18n.config.json',
        ),
      );
    }

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
    process.exit(1);
  }

  if (!sourceFileStr) {
    console.error(chalk.red('❌ Missing required option: --source-file'));
    process.exit(1);
  }

  try {
    // Check if source file exists
    if (!(await fs.pathExists(sourceFileStr))) {
      throw new Error(`Source file not found: ${sourceFileStr}`);
    }

    // Validate translation file format
    console.log(chalk.yellow(`🔍 Validating ${sourceFileStr}...`));
    const isValid = await validateTranslationFile(sourceFileStr);
    if (!isValid) {
      throw new Error(`Invalid translation file format: ${sourceFileStr}`);
    }

    console.log(chalk.green(`✅ Translation file is valid`));

    // Generate upload filename
    const finalUploadFileName =
      uploadFileName && typeof uploadFileName === 'string'
        ? generateUploadFileName(sourceFileStr, uploadFileName)
        : generateUploadFileName(sourceFileStr);

    // Get cached entry for display purposes
    const cachedEntry = await getCachedUpload(
      sourceFileStr,
      projectIdStr,
      tmsUrlStr,
    );

    // Check if file has changed since last upload (unless --force is used)
    if (!force) {
      const fileChanged = await hasFileChanged(
        sourceFileStr,
        projectIdStr,
        tmsUrlStr,
      );

      // Also check if we're uploading with the same filename that was already uploaded
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
        return;
      } else if (!fileChanged && cachedEntry && !sameFilename) {
        // File content hasn't changed but upload filename is different - warn user
        console.log(
          chalk.yellow(
            `⚠️  File content unchanged, but upload filename differs from last upload:`,
          ),
        );
        console.log(
          chalk.gray(
            `   Last upload: ${cachedEntry.uploadFileName || 'unknown'}`,
          ),
        );
        console.log(chalk.gray(`   This upload: ${finalUploadFileName}`));
        console.log(chalk.gray(`   This will create a new job in Memsource.`));
      }
    } else {
      console.log(
        chalk.yellow(`⚠️  Force upload enabled - skipping cache check`),
      );
    }

    if (dryRun) {
      console.log(
        chalk.yellow('🔍 Dry run mode - showing what would be uploaded:'),
      );
      console.log(chalk.gray(`   TMS URL: ${tmsUrlStr}`));
      console.log(chalk.gray(`   Project ID: ${projectIdStr}`));
      console.log(chalk.gray(`   Source file: ${sourceFileStr}`));
      console.log(chalk.gray(`   Upload filename: ${finalUploadFileName}`));
      console.log(
        chalk.gray(
          `   Target languages: ${
            targetLanguages || 'All configured languages'
          }`,
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
      return;
    }

    // Check if MEMSOURCE_TOKEN is available (should be set from ~/.memsourcerc)
    if (!process.env.MEMSOURCE_TOKEN && !tmsTokenStr) {
      console.error(chalk.red('❌ MEMSOURCE_TOKEN not found in environment'));
      console.error(chalk.yellow('   Please source ~/.memsourcerc first:'));
      console.error(chalk.gray('     source ~/.memsourcerc'));
      console.error(
        chalk.gray('   Or set MEMSOURCE_TOKEN environment variable'),
      );
      process.exit(1);
    }

    // Use memsource CLI for upload (matching team's script approach)
    console.log(
      chalk.yellow(
        `🔗 Using memsource CLI to upload to project ${projectIdStr}...`,
      ),
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
    console.log(chalk.yellow(`📤 Uploading ${sourceFileStr}...`));
    console.log(chalk.gray(`   Upload filename: ${finalUploadFileName}`));
    if (languages.length > 0) {
      console.log(chalk.gray(`   Target languages: ${languages.join(', ')}`));
    }

    const uploadResult = await uploadWithMemsourceCLI(
      sourceFileStr,
      projectIdStr,
      languages,
      finalUploadFileName, // Pass the generated filename
    );

    // Calculate key count for cache
    const fileContent = await fs.readFile(sourceFileStr, 'utf-8');
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
      sourceFileStr,
      projectIdStr,
      tmsUrlStr,
      keyCount,
      finalUploadFileName,
    );

    console.log(chalk.green(`✅ Upload completed successfully!`));
    console.log(chalk.gray(`   File: ${uploadResult.fileName}`));
    console.log(chalk.gray(`   Keys: ${keyCount}`));
    if (languages.length > 0) {
      console.log(chalk.gray(`   Target languages: ${languages.join(', ')}`));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error uploading to TMS:'), error);
    throw error;
  }
}
