/*
 * Copyright 2025 The Backstage Authors
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
import chalk from 'chalk';
import { Command } from 'commander';

export function registerCommands(program: Command) {
  program
    .command('extract')
    .argument('<uri>', 'The URI to extract')
    .action(lazy(() => import('./extract').then(m => m.default)));

  program
    .command('verify')
    .description('Verifty a set of verify files')
    .argument('<files...>', 'The files to verify')
    // .option('-g, --glob', 'Enable glob pattern matching')
    .action(lazy(() => import('./verify').then(m => m.default)));
}

// Wraps an action function so that it always exits and handles errors
function lazy(
  getActionFunc: () => Promise<(...args: any[]) => Promise<void>>,
): (...args: any[]) => Promise<never> {
  return async (...args: any[]) => {
    try {
      const actionFunc = await getActionFunc();
      await actionFunc(...args);

      process.exit(0);
    } catch (error) {
      process.stderr.write(`\n${chalk.red(`${error}`)}\n\n`);
      process.exit(1);
    }
  };
}
