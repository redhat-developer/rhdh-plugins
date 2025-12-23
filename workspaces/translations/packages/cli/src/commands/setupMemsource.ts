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
import os from 'node:os';
import * as readline from 'node:readline';
import { stdin, stdout } from 'process';

import { OptionValues } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';

/**
 * Check if terminal is interactive
 */
function isInteractiveTerminal(): boolean {
  return stdin.isTTY && stdout.isTTY;
}

/**
 * Prompt for username
 */
async function promptUsername(rl: readline.Interface): Promise<string> {
  const question = (query: string): Promise<string> => {
    return new Promise(resolve => {
      rl.question(query, resolve);
    });
  };

  const username = await question(chalk.yellow('Enter Memsource username: '));
  if (!username || username.trim() === '') {
    rl.close();
    throw new Error('Username is required');
  }
  return username;
}

/**
 * Prompt for password with masking
 */
async function promptPassword(rl: readline.Interface): Promise<string> {
  const questionPassword = (query: string): Promise<string> => {
    return new Promise(resolve => {
      const wasRawMode = stdin.isRaw || false;

      if (stdin.isTTY) {
        stdin.setRawMode(true);
      }
      stdin.resume();
      stdin.setEncoding('utf8');

      stdout.write(query);

      let inputPassword = '';

      // eslint-disable-next-line prefer-const
      let cleanup: () => void;

      const onData = (char: string) => {
        if (char === '\r' || char === '\n') {
          cleanup();
          stdout.write('\n');
          resolve(inputPassword);
          return;
        }

        if (char === '\u0003') {
          cleanup();
          stdout.write('\n');
          process.exit(130);
          return;
        }

        if (char === '\u007f' || char === '\b' || char === '\u001b[3~') {
          if (inputPassword.length > 0) {
            inputPassword = inputPassword.slice(0, -1);
            stdout.write('\b \b');
          }
          return;
        }

        if (char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) {
          return;
        }

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

  const password = await questionPassword(
    chalk.yellow('Enter Memsource password: '),
  );
  if (!password || password.trim() === '') {
    rl.close();
    throw new Error('Password is required');
  }
  return password;
}

/**
 * Prompt for credentials interactively
 */
async function promptCredentials(): Promise<{
  username: string;
  password: string;
}> {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    const username = await promptUsername(rl);
    const password = await promptPassword(rl);
    return { username, password };
  } finally {
    rl.close();
  }
}

/**
 * Get credentials from options or prompt
 */
async function getCredentials(
  isInteractive: boolean,
  noInput: boolean,
  username?: string,
  password?: string,
): Promise<{ username: string; password: string }> {
  if (username && password) {
    return { username, password };
  }

  if (isInteractive && !noInput) {
    const prompted = await promptCredentials();
    return {
      username: username || prompted.username,
      password: password || prompted.password,
    };
  }

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

/**
 * Generate .memsourcerc file content
 */
function generateMemsourceRcContent(
  memsourceVenv: string,
  memsourceUrl: string,
  username: string,
  password: string,
): string {
  return `source ${memsourceVenv}

export MEMSOURCE_URL="${memsourceUrl}"

export MEMSOURCE_USERNAME=${username}

export MEMSOURCE_PASSWORD="${password}"

export MEMSOURCE_TOKEN=$(memsource auth login --user-name $MEMSOURCE_USERNAME --password "$"MEMSOURCE_PASSWORD -c token -f value)
`.replace('$"MEMSOURCE_PASSWORD', '${MEMSOURCE_PASSWORD}');
}

/**
 * Display setup instructions
 */
function displaySetupInstructions(memsourceRcPath: string): void {
  console.log(
    chalk.green(`✅ Created .memsourcerc file at ${memsourceRcPath}`),
  );
  console.log(chalk.yellow('\n⚠️  Security Note:'));
  console.log(chalk.gray('   This file contains your password in plain text.'));
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
}

/**
 * Check and warn about virtual environment path
 */
async function checkVirtualEnvironment(memsourceVenv: string): Promise<void> {
  const expandedVenvPath = memsourceVenv.replaceAll(
    /\$\{HOME\}/g,
    os.homedir(),
  );
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
}

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
    const isInteractive = isInteractiveTerminal();
    const noInput = opts.noInput === true;

    const { username: finalUsername, password: finalPassword } =
      await getCredentials(isInteractive, noInput, username, password);

    const memsourceRcContent = generateMemsourceRcContent(
      memsourceVenv,
      memsourceUrl,
      finalUsername,
      finalPassword,
    );

    const memsourceRcPath = path.join(os.homedir(), '.memsourcerc');
    await fs.writeFile(memsourceRcPath, memsourceRcContent, { mode: 0o600 });

    displaySetupInstructions(memsourceRcPath);
    await checkVirtualEnvironment(memsourceVenv);
  } catch (error) {
    console.error(chalk.red('❌ Error setting up .memsourcerc:'), error);
    throw error;
  }
}
