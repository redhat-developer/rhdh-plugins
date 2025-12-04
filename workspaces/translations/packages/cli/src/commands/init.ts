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

import os from 'os';
import path from 'path';

import { OptionValues } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';

import {
  createDefaultConfigFile,
  createDefaultAuthFile,
} from '../lib/i18n/config';

import { setupMemsourceCommand } from './setupMemsource';

export async function initCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('🔧 Initializing i18n configuration...'));

  try {
    // Create project config file (can be committed)
    await createDefaultConfigFile();

    // Check if .memsourcerc exists
    const memsourceRcPath = path.join(os.homedir(), '.memsourcerc');
    const hasMemsourceRc = await fs.pathExists(memsourceRcPath);

    // Only create .i18n.auth.json if .memsourcerc doesn't exist (as fallback)
    if (!hasMemsourceRc) {
      await createDefaultAuthFile();
    }

    console.log(chalk.green('\n✅ Configuration files created successfully!'));
    console.log(chalk.yellow('\n📝 Next steps:'));
    console.log('');
    console.log(
      chalk.cyan('   1. Edit .i18n.config.json in your project root:'),
    );
    console.log(
      chalk.gray(
        '      - Add your TMS URL (e.g., "https://cloud.memsource.com/web")',
      ),
    );
    console.log(chalk.gray('      - Add your TMS Project ID'));
    console.log(
      chalk.gray(
        '      - Adjust directories, languages, and patterns as needed',
      ),
    );
    console.log('');

    if (hasMemsourceRc) {
      console.log(
        chalk.green(
          '   ✓ ~/.memsourcerc found - authentication is already configured!',
        ),
      );
      console.log(
        chalk.gray('     Make sure to source it before running commands:'),
      );
      console.log(chalk.gray('     source ~/.memsourcerc'));
      console.log('');
    } else {
      console.log(
        chalk.cyan('   2. Set up Memsource authentication (recommended):'),
      );
      console.log(
        chalk.gray('      Run: translations-cli i18n setup-memsource'),
      );
      console.log(
        chalk.gray(
          "      This creates ~/.memsourcerc following the localization team's format",
        ),
      );
      console.log(chalk.gray('      Then source it: source ~/.memsourcerc'));
      console.log('');
      console.log(chalk.cyan('   OR use ~/.i18n.auth.json (fallback):'));
      console.log(chalk.gray('      - Add your TMS username and password'));
      console.log(
        chalk.gray(
          '      - Token can be left empty (will be generated or read from environment)',
        ),
      );
      console.log('');
    }

    console.log(chalk.cyan('   3. Security reminder:'));
    console.log(
      chalk.gray(
        '      - Never commit ~/.i18n.auth.json or ~/.memsourcerc to git',
      ),
    );
    console.log(
      chalk.gray('      - Add them to your global .gitignore if needed'),
    );
    console.log('');
    console.log(
      chalk.blue('💡 For detailed instructions, see: docs/i18n-commands.md'),
    );

    // Optionally set up .memsourcerc
    if (opts.setupMemsource) {
      console.log(chalk.blue('\n🔧 Setting up .memsourcerc file...'));
      await setupMemsourceCommand({
        memsourceVenv: opts.memsourceVenv,
      });
    } else if (!hasMemsourceRc) {
      console.log(
        chalk.yellow(
          '\n💡 Tip: Run "translations-cli i18n setup-memsource" to set up .memsourcerc file',
        ),
      );
      console.log(
        chalk.gray(
          "   This follows the localization team's instructions format.",
        ),
      );
    }
  } catch (error) {
    console.error(chalk.red('❌ Error creating config files:'), error);
    throw error;
  }
}
