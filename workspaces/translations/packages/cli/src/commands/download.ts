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
      return {
        jobId,
        filename: job.filename,
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
 * List and filter completed jobs
 */
function listCompletedJobs(
  projectId: string,
  languages?: string[],
): Array<{ uid: string; filename: string; target_lang: string }> {
  const listArgs = buildListJobsArgs(projectId);
  const listOutput = safeExecSyncOrThrow('memsource', listArgs, {
    encoding: 'utf-8',
    env: { ...process.env },
  });
  const jobs = JSON.parse(listOutput);
  const jobArray = Array.isArray(jobs) ? jobs : [jobs];

  const completedJobs = jobArray.filter(
    (job: any) => job.status === 'COMPLETED',
  );

  if (!languages || languages.length === 0) {
    return completedJobs;
  }

  const languageSet = new Set(languages);
  return completedJobs.filter((job: any) => languageSet.has(job.target_lang));
}

/**
 * Download all completed jobs
 */
async function downloadAllCompletedJobs(
  projectId: string,
  outputDir: string,
  languages?: string[],
): Promise<Array<{ jobId: string; filename: string; lang: string }>> {
  console.log(chalk.yellow('📋 Listing available jobs...'));

  try {
    const jobsToDownload = listCompletedJobs(projectId, languages);

    console.log(
      chalk.yellow(
        `📥 Found ${jobsToDownload.length} completed job(s) to download...`,
      ),
    );

    const downloadResults: Array<{
      jobId: string;
      filename: string;
      lang: string;
    }> = [];

    for (const job of jobsToDownload) {
      const result = await downloadJob(projectId, job.uid, outputDir);
      if (result) {
        downloadResults.push(result);
        console.log(
          chalk.green(`✅ Downloaded: ${result.filename} (${result.lang})`),
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
): Promise<Array<{ jobId: string; filename: string; lang: string }>> {
  validateMemsourcePrerequisites();
  await fs.ensureDir(outputDir);

  if (jobIds && jobIds.length > 0) {
    return downloadSpecificJobs(projectId, jobIds, outputDir);
  }

  return downloadAllCompletedJobs(projectId, outputDir, languages);
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
  } = mergedOpts as {
    projectId?: string;
    outputDir?: string;
    languages?: string;
    jobIds?: string;
  };

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
