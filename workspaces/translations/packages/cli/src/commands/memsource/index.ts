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

import { Command, OptionValues } from 'commander';

import { setupMemsourceCommand } from './setup';
import { uploadCommand } from './upload';
import { downloadCommand } from './download';
import { listCommand } from './list';
import { syncCommand } from './sync';
import { exitWithError } from '../../lib/errors';

export function registerMemsourceCommands(parent: Command) {
  const memsource = parent
    .command('memsource [command]')
    .description(
      'Internationalization (i18n) management commands for translation workflows',
    );

  // Setup command - set up Memsource configuration
  memsource
    .command('setup')
    .description(
      'Set up .memsourcerc file for Memsource CLI (follows localization team instructions)',
    )
    .option(
      '--memsource-venv <path>',
      'Path to Memsource CLI virtual environment (will auto-detect or prompt if not provided)',
    )
    .option(
      '--memsource-url <url>',
      'Memsource URL',
      'https://cloud.memsource.com/web',
    )
    .option(
      '--username <username>',
      'Memsource username (will prompt if not provided and in interactive terminal)',
    )
    .option(
      '--password <password>',
      'Memsource password (will prompt if not provided and in interactive terminal)',
    )
    .option(
      '--no-input',
      'Disable interactive prompts (for automation/scripts)',
    )
    .action(wrapCommand(setupMemsourceCommand));

  // Upload command - upload translation reference files to TMS
  memsource
    .command('upload')
    .description(
      'Upload translation reference files to TMS (Translation Management System)',
    )
    .option('--tms-url <url>', 'TMS API URL')
    .option('--tms-token <token>', 'TMS API token')
    .option('--project-id <id>', 'TMS project ID')
    .option('--source-file <path>', 'Source translation file to upload')
    .option(
      '--upload-filename <name>',
      'Custom filename for TMS upload (default: {repo-name}-{sprint}.json, extracts sprint from source filename)',
    )
    .option(
      '--target-languages <languages>',
      'Comma-separated list of target languages',
    )
    .option(
      '--dry-run',
      'Show what would be uploaded without actually uploading',
      false,
    )
    .option('--force', 'Force upload even if file has not changed', false)
    .action(wrapCommand(uploadCommand));

  // Download command - download translated strings from TMS
  memsource
    .command('download')
    .description('Download translated strings from TMS using Memsource CLI')
    .option('--project-id <id>', 'TMS project ID')
    .option(
      '--output-dir <path>',
      'Output directory for downloaded translations',
      'i18n/downloads',
    )
    .option(
      '--languages <languages>',
      'Comma-separated list of languages to download (e.g., "it,ja,fr")',
    )
    .option(
      '--job-ids <ids>',
      'Comma-separated list of specific job UIDs to download (use "i18n list" to see UIDs)',
    )
    .option(
      '--status <status>',
      'Filter by status (default: "COMPLETED"). Use "ALL" to download all statuses, or specific status like "ASSIGNED"',
      'COMPLETED',
    )
    .option(
      '--include-incomplete',
      'Include incomplete jobs (same as --status ALL)',
      false,
    )
    .action(wrapCommand(downloadCommand));

  // List command - list available translation jobs
  memsource
    .command('list')
    .description('List available translation jobs from TMS')
    .option('--project-id <id>', 'TMS project ID')
    .option('--languages <languages>', 'Filter by languages (e.g., "it,ja,fr")')
    .option(
      '--status <status>',
      'Filter by status (e.g., "COMPLETED", "ASSIGNED", "NEW")',
    )
    .option('--format <format>', 'Output format (table, json)', 'table')
    .action(wrapCommand(listCommand));

  // Sync command - all-in-one workflow
  memsource
    .command('sync')
    .description(
      'Complete i18n workflow: generate → upload → download → deploy',
    )
    .requiredOption(
      '--sprint <sprint>',
      'Sprint value for filename (e.g., s3285). Required for generate step.',
    )
    .option('--source-dir <path>', 'Source directory to scan', 'src')
    .option('--output-dir <path>', 'Output directory for i18n files', 'i18n')
    .option('--locales-dir <path>', 'Target locales directory', 'src/locales')
    .option('--tms-url <url>', 'TMS API URL')
    .option('--tms-token <token>', 'TMS API token')
    .option('--project-id <id>', 'TMS project ID')
    .option(
      '--languages <languages>',
      'Comma-separated list of target languages',
    )
    .option('--skip-upload', 'Skip upload step', false)
    .option('--skip-download', 'Skip download step', false)
    .option('--skip-deploy', 'Skip deploy step', false)
    .option('--dry-run', 'Show what would be done without executing', false)
    .action(wrapCommand(syncCommand));
}

// Wraps an action function so that it always exits and handles errors
function wrapCommand(
  actionFunc: (opts: OptionValues) => Promise<void>,
): (opts: OptionValues) => Promise<never> {
  return async (opts: OptionValues) => {
    try {
      await actionFunc(opts);
      process.exit(0);
    } catch (error) {
      exitWithError(error as Error);
    }
  };
}
