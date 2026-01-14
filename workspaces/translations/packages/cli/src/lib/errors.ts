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

import chalk from 'chalk';

export class CustomError extends Error {
  get name(): string {
    return this.constructor.name;
  }
}

export class ExitCodeError extends CustomError {
  readonly code: number;

  constructor(code: number, command?: string) {
    super(
      command
        ? `Command '${command}' exited with code ${code}`
        : `Child exited with code ${code}`,
    );
    this.code = code;
  }
}

export function exitWithError(error: Error): never {
  const errorMessage =
    error instanceof ExitCodeError ? error.message : String(error);
  const exitCode = error instanceof ExitCodeError ? error.code : 1;

  process.stderr.write(`\n${chalk.red(errorMessage)}\n\n`);
  process.exit(exitCode);
}
