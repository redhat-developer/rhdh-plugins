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

import { initCommand } from './init';
import { generateCommand } from './generate';
import { deployCommand } from './deploy';
import { statusCommand } from './status';
import { cleanCommand } from './clean';
import { registerMemsourceCommands } from './memsource/index';

export function registerCommands(program: Command) {
  // Init command - initialize config file
  program
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

  // Generate command - collect translation reference files
  program
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

  // Deploy command - deploy translated strings back to language files
  program
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
  program
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
  program
    .command('clean')
    .description('Clean up temporary i18n files and caches')
    .option('--i18n-dir <path>', 'i18n directory to clean', 'i18n')
    .option('--cache-dir <path>', 'Cache directory to clean', '.i18n-cache')
    .option('--backup-dir <path>', 'Backup directory to clean', '.i18n-backup')
    .option('--force', 'Force cleanup without confirmation', false)
    .action(wrapCommand(cleanCommand));

  registerMemsourceCommands(program);
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
