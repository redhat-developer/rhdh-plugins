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
import os from 'os';
import * as readline from 'readline';
import { stdin, stdout } from 'process';

import { OptionValues } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';

/**
 * Set up .memsourcerc file following localization team instructions
 */
export async function setupMemsourceCommand(opts: OptionValues): Promise<void> {
  console.log(
    chalk.blue('🔧 Setting up .memsourcerc file for Memsource CLI...'),
  );

  const {
    memsourceVenv = '${HOME}/git/memsource-cli-client/.memsource/bin/activate',
    memsourceUrl = 'https://cloud.memsource.com/web',
    username,
    password,
  } = opts;

  try {
    let finalUsername = username;
    let finalPassword = password;

    // Check if we're in an interactive terminal (TTY)
    const isInteractive = stdin.isTTY && stdout.isTTY;
    const noInput = opts.noInput === true;

    // Prompt for credentials if not provided and we're in an interactive terminal
    if ((!finalUsername || !finalPassword) && isInteractive && !noInput) {
      const rl = readline.createInterface({
        input: stdin,
        output: stdout,
      });

      const question = (query: string): Promise<string> => {
        return new Promise(resolve => {
          rl.question(query, resolve);
        });
      };

      // Helper to hide password input (masks with asterisks)
      const questionPassword = (query: string): Promise<string> => {
        return new Promise(resolve => {
          const wasRawMode = stdin.isRaw || false;

          // Set raw mode to capture individual characters
          if (stdin.isTTY) {
            stdin.setRawMode(true);
          }
          stdin.resume();
          stdin.setEncoding('utf8');

          stdout.write(query);

          let inputPassword = '';

          // Declare cleanup first so it can be referenced in onData
          // eslint-disable-next-line prefer-const
          let cleanup: () => void;

          const onData = (char: string) => {
            // Handle Enter/Return
            if (char === '\r' || char === '\n') {
              cleanup();
              stdout.write('\n');
              resolve(inputPassword);
              return;
            }

            // Handle Ctrl+C
            if (char === '\u0003') {
              cleanup();
              stdout.write('\n');
              process.exit(130);
              return;
            }

            // Handle backspace/delete
            if (char === '\u007f' || char === '\b' || char === '\u001b[3~') {
              if (inputPassword.length > 0) {
                inputPassword = inputPassword.slice(0, -1);
                stdout.write('\b \b');
              }
              return;
            }

            // Ignore control characters
            if (char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) {
              return;
            }

            // Add character and mask it
            inputPassword += char;
            stdout.write('*');
          };

          cleanup = () => {
            stdin.removeListener('data', onData);
            if (stdin.isTTY) {
              stdin.setRawMode(wasRawMode);
            }
            stdin.pause();
          };

          stdin.on('data', onData);
        });
      };

      if (!finalUsername) {
        finalUsername = await question(
          chalk.yellow('Enter Memsource username: '),
        );
        if (!finalUsername || finalUsername.trim() === '') {
          rl.close();
          throw new Error('Username is required');
        }
      }

      if (!finalPassword) {
        finalPassword = await questionPassword(
          chalk.yellow('Enter Memsource password: '),
        );
        if (!finalPassword || finalPassword.trim() === '') {
          rl.close();
          throw new Error('Password is required');
        }
      }

      rl.close();
    }

    // Validate required credentials
    if (!finalUsername || !finalPassword) {
      if (!isInteractive || noInput) {
        throw new Error(
          'Username and password are required. ' +
            'Provide them via --username and --password options, ' +
            'or use environment variables (MEMSOURCE_USERNAME, MEMSOURCE_PASSWORD), ' +
            'or run in an interactive terminal to be prompted.',
        );
      }
      throw new Error('Username and password are required');
    }

    // Keep ${HOME} in venv path (don't expand it - it should be expanded by the shell when sourced)
    // The path should remain as ${HOME}/git/memsource-cli-client/.memsource/bin/activate

    // Create .memsourcerc content following localization team format
    // Note: Using string concatenation to avoid template literal interpretation of ${MEMSOURCE_PASSWORD}
    const memsourceRcContent = `source ${memsourceVenv}

export MEMSOURCE_URL="${memsourceUrl}"

export MEMSOURCE_USERNAME=${finalUsername}

export MEMSOURCE_PASSWORD="${finalPassword}"

export MEMSOURCE_TOKEN=$(memsource auth login --user-name $MEMSOURCE_USERNAME --password "$"MEMSOURCE_PASSWORD -c token -f value)
`.replace('$"MEMSOURCE_PASSWORD', '${MEMSOURCE_PASSWORD}');

    // Write to ~/.memsourcerc
    const memsourceRcPath = path.join(os.homedir(), '.memsourcerc');
    await fs.writeFile(memsourceRcPath, memsourceRcContent, { mode: 0o600 }); // Read/write for owner only

    console.log(
      chalk.green(`✅ Created .memsourcerc file at ${memsourceRcPath}`),
    );
    console.log(chalk.yellow('\n⚠️  Security Note:'));
    console.log(
      chalk.gray('   This file contains your password in plain text.'),
    );
    console.log(
      chalk.gray('   File permissions are set to 600 (owner read/write only).'),
    );
    console.log(
      chalk.gray(
        '   Keep this file secure and never commit it to version control.',
      ),
    );

    console.log(chalk.yellow('\n📝 Next steps:'));
    console.log(chalk.gray('   1. Source the file in your shell:'));
    console.log(chalk.cyan(`      source ~/.memsourcerc`));
    console.log(
      chalk.gray(
        '   2. Or add it to your shell profile (~/.bashrc, ~/.zshrc, etc.):',
      ),
    );
    console.log(chalk.cyan(`      echo "source ~/.memsourcerc" >> ~/.zshrc`));
    console.log(chalk.gray('   3. Verify the setup:'));
    console.log(
      chalk.cyan(`      source ~/.memsourcerc && echo $MEMSOURCE_TOKEN`),
    );
    console.log(
      chalk.gray(
        '   4. After sourcing, you can use i18n commands without additional setup',
      ),
    );

    // Check if virtual environment path exists (expand ${HOME} for checking)
    const expandedVenvPath = memsourceVenv.replace(/\$\{HOME\}/g, os.homedir());
    if (!(await fs.pathExists(expandedVenvPath))) {
      console.log(
        chalk.yellow(
          `\n⚠️  Warning: Virtual environment not found at ${expandedVenvPath}`,
        ),
      );
      console.log(
        chalk.gray(
          '   Please update the path in ~/.memsourcerc if your venv is located elsewhere.',
        ),
      );
    }
  } catch (error) {
    console.error(chalk.red('❌ Error setting up .memsourcerc:'), error);
    throw error;
  }
}
