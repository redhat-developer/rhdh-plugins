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
import path from 'node:path';

import { loadI18nConfig, mergeConfigWithOptions } from '../lib/i18n/config';
import { commandExists, safeExecSyncOrThrow } from '../lib/utils/exec';

/**
 * Build memsource job download command arguments
 */
function buildDownloadJobArgs(
  projectId: string,
  jobId: string,
  outputDir: string,
): string[] {
  return [
    'job',
    'download',
    '--project-id',
    projectId,
    '--job-id',
    jobId,
    '--type',
    'target',
    '--output-dir',
    outputDir,
  ];
}

/**
 * Build memsource job list command arguments
 */
function buildListJobsArgs(projectId: string): string[] {
  return ['job', 'list', '--project-id', projectId, '--format', 'json'];
}

/**
 * Find the actual downloaded file in the output directory
 * Memsource CLI may download with a different name than job.filename
 */
function findDownloadedFile(
  outputDir: string,
  targetLang: string,
): string | null {
  try {
    const files = fs.readdirSync(outputDir);
    // Look for files that match the target language
    // Common patterns: *-{lang}-C.json, *-{lang}.json, *-en-{lang}-C.json
    const langPattern = new RegExp(`-${targetLang}(?:-C)?\\.json$`, 'i');
    const matchingFiles = files.filter(f => langPattern.test(f));

    if (matchingFiles.length > 0) {
      // Return the most recently modified file (likely the one just downloaded)
      const fileStats = matchingFiles.map(f => ({
        name: f,
        mtime: fs.statSync(path.join(outputDir, f)).mtime.getTime(),
      }));
      fileStats.sort((a, b) => b.mtime - a.mtime);
      return fileStats[0].name;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Rename downloaded file to clean format: <repo-name>-<YYYY-MM-DD>-<locale>.json
 * Removes source language (-en) and completion suffix (-C)
 */
function renameDownloadedFile(
  outputDir: string,
  originalFilename: string,
  targetLang: string,
): string | null {
  try {
    const originalPath = path.join(outputDir, originalFilename);
    if (!fs.existsSync(originalPath)) {
      // Try to find the file if it doesn't exist at expected path
      const foundFile = findDownloadedFile(outputDir, targetLang);
      if (foundFile) {
        return renameDownloadedFile(outputDir, foundFile, targetLang);
      }
      return null;
    }

    // Parse filename patterns:
    // 1. {repo}-{date}-{sourceLang}-{targetLang}-C.json (e.g., backstage-2026-01-08-en-fr-C.json)
    // 2. {repo}-{date}-{sourceLang}-{targetLang}.json (e.g., backstage-2026-01-08-en-fr.json)
    // 3. {repo}-reference-{date}-{sourceLang}-{targetLang}-C.json (old format)

    let cleanFilename: string | null = null;

    // Try pattern: {repo}-{date}-{sourceLang}-{targetLang}(-C).json
    const pattern1 = originalFilename.match(
      /^([a-z-]+)-(\d{4}-\d{2}-\d{2})-([a-z]{2})-([a-z]{2})(?:-C)?\.json$/i,
    );
    if (pattern1) {
      const [, repo, date] = pattern1;
      cleanFilename = `${repo}-${date}-${targetLang}.json`;
    } else {
      // Try old reference pattern: {repo}-reference-{date}-{sourceLang}-{targetLang}(-C).json
      const pattern2 = originalFilename.match(
        /^([a-z-]+)-reference-(\d{4}-\d{2}-\d{2})-([a-z]{2})-([a-z]{2})(?:-C)?\.json$/i,
      );
      if (pattern2) {
        const [, repo, date] = pattern2;
        cleanFilename = `${repo}-${date}-${targetLang}.json`;
      }
    }

    if (!cleanFilename) {
      // If pattern doesn't match, return original filename
      return originalFilename;
    }

    const cleanPath = path.join(outputDir, cleanFilename);

    // Rename the file
    if (originalPath !== cleanPath) {
      fs.moveSync(originalPath, cleanPath, { overwrite: true });
    }

    return cleanFilename;
  } catch (error: any) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Could not rename file ${originalFilename}: ${error.message}`,
      ),
    );
    return originalFilename;
  }
}

/**
 * Download a single job and return its info
 */
async function downloadJob(
  projectId: string,
  jobId: string,
  outputDir: string,
): Promise<{ jobId: string; filename: string; lang: string } | null> {
  try {
    const cmdArgs = buildDownloadJobArgs(projectId, jobId, outputDir);
    safeExecSyncOrThrow('memsource', cmdArgs, {
      stdio: 'pipe',
      env: { ...process.env },
    });

    // Get job info to determine filename and language
    const jobInfoArgs = buildListJobsArgs(projectId);
    const jobListOutput = safeExecSyncOrThrow('memsource', jobInfoArgs, {
      encoding: 'utf-8',
      env: { ...process.env },
    });
    const jobs = JSON.parse(jobListOutput);
    const jobArray = Array.isArray(jobs) ? jobs : [jobs];
    const job = jobArray.find((j: any) => j.uid === jobId);

    if (job) {
      // Find the actual downloaded file (memsource CLI may name it differently)
      const originalFilename = job.filename;
      let actualFile = originalFilename;

      // Check if file exists with original name
      if (!fs.existsSync(path.join(outputDir, originalFilename))) {
        // Try to find the file by looking for files matching the target language
        const foundFile = findDownloadedFile(outputDir, job.target_lang);
        if (foundFile) {
          actualFile = foundFile;
        }
      }

      // Rename the downloaded file to clean format
      const cleanFilename = renameDownloadedFile(
        outputDir,
        actualFile,
        job.target_lang,
      );

      return {
        jobId,
        filename: cleanFilename || actualFile,
        lang: job.target_lang,
      };
    }
    return null;
  } catch (error: any) {
    console.warn(
      chalk.yellow(
        `⚠️  Warning: Could not download job ${jobId}: ${error.message}`,
      ),
    );
    return null;
  }
}

/**
 * Validate prerequisites for Memsource CLI download
 */
function validateMemsourcePrerequisites(): void {
  if (!commandExists('memsource')) {
    throw new Error(
      'memsource CLI not found. Please ensure memsource-cli is installed and ~/.memsourcerc is sourced.',
    );
  }

  if (!process.env.MEMSOURCE_TOKEN) {
    throw new Error(
      'MEMSOURCE_TOKEN not found. Please source ~/.memsourcerc first: source ~/.memsourcerc',
    );
  }
}

/**
 * Download specific jobs by their IDs
 */
async function downloadSpecificJobs(
  projectId: string,
  jobIds: string[],
  outputDir: string,
): Promise<Array<{ jobId: string; filename: string; lang: string }>> {
  console.log(
    chalk.yellow(`📥 Downloading ${jobIds.length} specific job(s)...`),
  );

  const downloadResults: Array<{
    jobId: string;
    filename: string;
    lang: string;
  }> = [];

  for (const jobId of jobIds) {
    const result = await downloadJob(projectId, jobId, outputDir);
    if (result) {
      downloadResults.push(result);
      console.log(
        chalk.green(
          `✅ Downloaded job ${result.jobId}: ${result.filename} (${result.lang})`,
        ),
      );
    }
  }

  return downloadResults;
}

/**
 * List and filter jobs by status and language
 */
function listJobs(
  projectId: string,
  languages?: string[],
  statusFilter?: string,
): Array<{
  uid: string;
  filename: string;
  target_lang: string;
  status: string;
}> {
  const listArgs = buildListJobsArgs(projectId);
  const listOutput = safeExecSyncOrThrow('memsource', listArgs, {
    encoding: 'utf-8',
    env: { ...process.env },
  });
  const jobs = JSON.parse(listOutput);
  const jobArray = Array.isArray(jobs) ? jobs : [jobs];

  let filteredJobs = jobArray;

  // Filter by status
  if (statusFilter && statusFilter !== 'ALL') {
    filteredJobs = filteredJobs.filter(
      (job: any) => job.status === statusFilter,
    );
  }

  // Filter by language
  if (languages && languages.length > 0) {
    const languageSet = new Set(languages);
    filteredJobs = filteredJobs.filter((job: any) =>
      languageSet.has(job.target_lang),
    );
  }

  return filteredJobs;
}

/**
 * Download jobs filtered by status and language
 */
async function downloadFilteredJobs(
  projectId: string,
  outputDir: string,
  languages?: string[],
  statusFilter?: string,
): Promise<Array<{ jobId: string; filename: string; lang: string }>> {
  console.log(chalk.yellow('📋 Listing available jobs...'));

  try {
    const jobsToDownload = listJobs(projectId, languages, statusFilter);

    const statusDisplay =
      statusFilter === 'ALL' ? 'all statuses' : statusFilter || 'COMPLETED';
    console.log(
      chalk.yellow(
        `📥 Found ${jobsToDownload.length} job(s) with status "${statusDisplay}" to download...`,
      ),
    );

    if (jobsToDownload.length === 0) {
      console.log(
        chalk.yellow(
          '💡 Tip: Use "i18n list" to see all available jobs and their UIDs.',
        ),
      );
      return [];
    }

    const downloadResults: Array<{
      jobId: string;
      filename: string;
      lang: string;
    }> = [];

    for (const job of jobsToDownload) {
      const result = await downloadJob(projectId, job.uid, outputDir);
      if (result) {
        downloadResults.push(result);
        const statusIcon = job.status === 'COMPLETED' ? '✅' : '⚠️';
        console.log(
          chalk.green(
            `${statusIcon} Downloaded: ${result.filename} (${result.lang}) [${job.status}]`,
          ),
        );
      }
    }

    return downloadResults;
  } catch (error: any) {
    throw new Error(`Failed to list jobs: ${error.message}`);
  }
}

/**
 * Download translations using Memsource CLI
 */
async function downloadWithMemsourceCLI(
  projectId: string,
  outputDir: string,
  jobIds?: string[],
  languages?: string[],
  statusFilter?: string,
): Promise<Array<{ jobId: string; filename: string; lang: string }>> {
  validateMemsourcePrerequisites();
  await fs.ensureDir(outputDir);

  if (jobIds && jobIds.length > 0) {
    return downloadSpecificJobs(projectId, jobIds, outputDir);
  }

  return downloadFilteredJobs(projectId, outputDir, languages, statusFilter);
}

export async function downloadCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('📥 Downloading translated strings from TMS...'));

  // Load config and merge with options
  const config = await loadI18nConfig();
  const mergedOpts = await mergeConfigWithOptions(config, opts);

  const {
    projectId,
    outputDir = 'i18n/downloads',
    languages,
    jobIds,
    status,
    includeIncomplete,
  } = mergedOpts as {
    projectId?: string;
    outputDir?: string;
    languages?: string;
    jobIds?: string;
    status?: string;
    includeIncomplete?: boolean;
  };

  // Determine status filter
  let statusFilter = status || 'COMPLETED';
  if (includeIncomplete || statusFilter === 'ALL') {
    statusFilter = 'ALL';
  }

  // Validate required options
  if (!projectId) {
    console.error(chalk.red('❌ Missing required TMS configuration:'));
    console.error('');
    console.error(chalk.yellow('   ✗ Project ID'));
    console.error(
      chalk.gray(
        '     Set via: --project-id <id> or I18N_TMS_PROJECT_ID or .i18n.config.json',
      ),
    );
    console.error('');
    console.error(chalk.blue('📋 Quick Setup Guide:'));
    console.error(chalk.gray('   1. Run: translations-cli i18n init'));
    console.error(chalk.gray('   2. Edit .i18n.config.json to add Project ID'));
    console.error(
      chalk.gray('   3. Source ~/.memsourcerc: source ~/.memsourcerc'),
    );
    process.exit(1);
  }

  // Check if MEMSOURCE_TOKEN is available
  if (!process.env.MEMSOURCE_TOKEN) {
    console.error(chalk.red('❌ MEMSOURCE_TOKEN not found'));
    console.error(chalk.yellow('   Please source ~/.memsourcerc first:'));
    console.error(chalk.gray('     source ~/.memsourcerc'));
    process.exit(1);
  }

  try {
    // Parse job IDs if provided (comma-separated)
    const jobIdArray =
      jobIds && typeof jobIds === 'string'
        ? jobIds.split(',').map((id: string) => id.trim())
        : undefined;

    // Parse languages if provided (comma-separated)
    const languageArray =
      languages && typeof languages === 'string'
        ? languages.split(',').map((lang: string) => lang.trim())
        : undefined;

    const downloadResults = await downloadWithMemsourceCLI(
      projectId,
      String(outputDir),
      jobIdArray,
      languageArray,
      statusFilter,
    );

    // Summary
    console.log(chalk.green(`✅ Download completed successfully!`));
    console.log(chalk.gray(`   Output directory: ${outputDir}`));
    console.log(chalk.gray(`   Files downloaded: ${downloadResults.length}`));

    if (downloadResults.length > 0) {
      console.log(chalk.blue('📁 Downloaded files:'));
      for (const result of downloadResults) {
        console.log(
          chalk.gray(
            `   ${result.filename} (${result.lang}) - Job ID: ${result.jobId}`,
          ),
        );
      }
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Error downloading from TMS:'), error.message);
    throw error;
  }
}
