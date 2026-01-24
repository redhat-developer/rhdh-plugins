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

import { exitWithError } from '../lib/errors';

import { generateCommand } from './generate';
import { uploadCommand } from './upload';
import { downloadCommand } from './download';
import { deployCommand } from './deploy';
import { statusCommand } from './status';
import { cleanCommand } from './clean';
import { syncCommand } from './sync';
import { initCommand } from './init';
import { setupMemsourceCommand } from './setupMemsource';
import { listCommand } from './list';

export function registerCommands(program: Command) {
  const command = program
    .command('i18n [command]')
    .description(
      'Internationalization (i18n) management commands for translation workflows',
    );

  // Generate command - collect translation reference files
  command
    .command('generate')
    .description('Generate translation reference files from source code')
    .requiredOption(
      '--sprint <sprint>',
      'Sprint value for filename (e.g., s3285). Format: <repo-name>-reference-<sprint>.json',
    )
    .option(
      '--source-dir <path>',
      'Source directory to scan for translatable strings',
      'src',
    )
    .option(
      '--output-dir <path>',
      'Output directory for generated translation files',
      'i18n',
    )
    .option('--format <format>', 'Output format (json, po)', 'json')
    .option(
      '--include-pattern <pattern>',
      'File pattern to include (glob)',
      '**/*.{ts,tsx,js,jsx}',
    )
    .option(
      '--exclude-pattern <pattern>',
      'File pattern to exclude (glob)',
      '**/node_modules/**',
    )
    .option('--extract-keys', 'Extract translation keys from source code', true)
    .option('--merge-existing', 'Merge with existing translation files', false)
    .option(
      '--core-plugins',
      'Generate core-plugins reference (Backstage plugins only) instead of RHDH-specific reference',
    )
    .option(
      '--output-filename <name>',
      'Custom output filename (overrides sprint-based naming)',
    )
    .option(
      '--backstage-repo-path <path>',
      'Path to Backstage repository root (for core-plugins mode). Defaults to checking BACKSTAGE_REPO_PATH env var or config',
    )
    .action(wrapCommand(generateCommand));

  // Upload command - upload translation reference files to TMS
  command
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

  // List command - list available translation jobs
  command
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

  // Download command - download translated strings from TMS
  command
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

  // Deploy command - deploy translated strings back to language files
  command
    .command('deploy')
    .description(
      'Deploy downloaded translations to TypeScript translation files (it.ts, ja.ts, etc.)',
    )
    .option(
      '--source-dir <path>',
      'Source directory containing downloaded translations (from Memsource)',
      'i18n/downloads',
    )
    .action(wrapCommand(deployCommand));

  // Status command - show translation status
  command
    .command('status')
    .description('Show translation status and statistics')
    .option('--source-dir <path>', 'Source directory to analyze', 'src')
    .option('--i18n-dir <path>', 'i18n directory to analyze', 'i18n')
    .option(
      '--locales-dir <path>',
      'Locales directory to analyze',
      'src/locales',
    )
    .option('--format <format>', 'Output format (table, json)', 'table')
    .option('--include-stats', 'Include detailed statistics', true)
    .action(wrapCommand(statusCommand));

  // Clean command - clean up temporary files
  command
    .command('clean')
    .description('Clean up temporary i18n files and caches')
    .option('--i18n-dir <path>', 'i18n directory to clean', 'i18n')
    .option('--cache-dir <path>', 'Cache directory to clean', '.i18n-cache')
    .option('--backup-dir <path>', 'Backup directory to clean', '.i18n-backup')
    .option('--force', 'Force cleanup without confirmation', false)
    .action(wrapCommand(cleanCommand));

  // Sync command - all-in-one workflow
  command
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

  // Init command - initialize config file
  command
    .command('init')
    .description('Initialize i18n configuration files')
    .option(
      '--setup-memsource',
      'Also set up .memsourcerc file for Memsource CLI',
      false,
    )
    .option(
      '--memsource-venv <path>',
      'Path to Memsource CLI virtual environment (will auto-detect or prompt if not provided)',
    )
    .action(wrapCommand(initCommand));

  // Setup command - set up Memsource configuration
  command
    .command('setup-memsource')
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
