/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/LICENSE-2.0
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
import { commandExists, safeExecSyncOrThrow } from '../lib/utils/exec';

/**
 * Build memsource job list command arguments
 */
function buildListJobsArgs(projectId: string): string[] {
  return ['job', 'list', '--project-id', projectId, '--format', 'json'];
}

/**
 * List all jobs from Memsource project
 */
function listAllJobs(projectId: string): any[] {
  const listArgs = buildListJobsArgs(projectId);
  const listOutput = safeExecSyncOrThrow('memsource', listArgs, {
    encoding: 'utf-8',
    env: { ...process.env },
  });
  const jobs = JSON.parse(listOutput);
  return Array.isArray(jobs) ? jobs : [jobs];
}

/**
 * Validate prerequisites for Memsource CLI
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
 * Format job status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    COMPLETED: chalk.green('✓ COMPLETED'),
    ASSIGNED: chalk.yellow('○ ASSIGNED'),
    NEW: chalk.blue('○ NEW'),
    DECLINED: chalk.red('✗ DECLINED'),
    CANCELLED: chalk.gray('✗ CANCELLED'),
  };
  return statusMap[status] || status;
}

/**
 * Display jobs in a table format
 */
function displayJobsTable(
  jobs: any[],
  languages?: string[],
  statusFilter?: string,
): void {
  // Filter jobs
  let filteredJobs = jobs;

  if (languages && languages.length > 0) {
    const languageSet = new Set(languages);
    filteredJobs = filteredJobs.filter((job: any) =>
      languageSet.has(job.target_lang),
    );
  }

  if (statusFilter) {
    filteredJobs = filteredJobs.filter(
      (job: any) => job.status === statusFilter,
    );
  }

  if (filteredJobs.length === 0) {
    console.log(chalk.yellow('No jobs found matching the criteria.'));
    return;
  }

  // Group jobs by filename to show them together
  const jobsByFile = new Map<string, any[]>();
  for (const job of filteredJobs) {
    const filename = job.filename || 'unknown';
    if (!jobsByFile.has(filename)) {
      jobsByFile.set(filename, []);
    }
    jobsByFile.get(filename)!.push(job);
  }

  console.log(chalk.blue('\n📋 Available Translation Jobs\n'));
  console.log(
    chalk.gray(
      'Note: Display IDs (1, 2, 3...) shown in TMS UI are sequential and may not match the order here.\n',
    ),
  );

  // Display header
  console.log(
    chalk.bold(
      `${'Filename'.padEnd(50)} ${'Language'.padEnd(8)} ${'Status'.padEnd(
        15,
      )} ${'Real UID (for download)'.padEnd(30)}`,
    ),
  );
  console.log(chalk.gray('-'.repeat(120)));

  // Display jobs grouped by filename
  let displayIndex = 1;
  for (const [filename, fileJobs] of Array.from(jobsByFile.entries()).sort()) {
    // Sort jobs by language
    const sortedJobs = fileJobs.sort((a, b) =>
      (a.target_lang || '').localeCompare(b.target_lang || ''),
    );

    for (const job of sortedJobs) {
      const status = formatStatus(job.status || 'UNKNOWN');
      const lang = (job.target_lang || 'unknown').padEnd(8);
      const uid = (job.uid || 'unknown').padEnd(30);
      const fileDisplay =
        filename.length > 48 ? `${filename.slice(0, 45)}...` : filename;

      console.log(
        `${fileDisplay.padEnd(50)} ${lang} ${status.padEnd(15)} ${chalk.cyan(
          uid,
        )}`,
      );
    }
    displayIndex++;
  }

  console.log(chalk.gray('-'.repeat(120)));
  console.log(
    chalk.gray(
      `\nTotal: ${filteredJobs.length} job(s) | Use --languages or --status to filter`,
    ),
  );
  console.log(
    chalk.yellow(
      '\n💡 Tip: Use the Real UID (not display ID) with --job-ids to download specific jobs.',
    ),
  );
  console.log(
    chalk.yellow(
      '   Or use --languages "it,ja" to download all jobs for specific languages.',
    ),
  );
}

/**
 * Display jobs in JSON format
 */
function displayJobsJson(
  jobs: any[],
  languages?: string[],
  statusFilter?: string,
): void {
  let filteredJobs = jobs;

  if (languages && languages.length > 0) {
    const languageSet = new Set(languages);
    filteredJobs = filteredJobs.filter((job: any) =>
      languageSet.has(job.target_lang),
    );
  }

  if (statusFilter) {
    filteredJobs = filteredJobs.filter(
      (job: any) => job.status === statusFilter,
    );
  }

  console.log(JSON.stringify(filteredJobs, null, 2));
}

export async function listCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('📋 Listing translation jobs from TMS...'));

  // Load config and merge with options
  const config = await loadI18nConfig();
  const mergedOpts = await mergeConfigWithOptions(config, opts);

  const {
    projectId,
    languages,
    status,
    format = 'table',
  } = mergedOpts as {
    projectId?: string;
    languages?: string;
    status?: string;
    format?: string;
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
    validateMemsourcePrerequisites();

    // Parse languages if provided (comma-separated)
    const languageArray =
      languages && typeof languages === 'string'
        ? languages.split(',').map((lang: string) => lang.trim())
        : undefined;

    const jobs = listAllJobs(projectId);

    if (format === 'json') {
      displayJobsJson(jobs, languageArray, status);
    } else {
      displayJobsTable(jobs, languageArray, status);
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Error listing jobs:'), error.message);
    throw error;
  }
}
