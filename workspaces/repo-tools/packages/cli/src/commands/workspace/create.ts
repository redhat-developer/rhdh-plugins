/*
 * Copyright The Backstage Authors
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
import inquirer from 'inquirer';
import chalk from 'chalk';

import { OptionValues } from 'commander';
import { createWorkspace } from '../../lib/workspaces/createWorkspace';

const NAME_PATTERN = /^[a-z0-9\-]+$/;
const OWNER_PATTERN = /@[a-zA-Z0-9_-]+/;

const validateName = (value: string) =>
  !!value.match(NAME_PATTERN) ||
  'Invalid input. Please enter lowercase letters, numbers, and dashes only.';

const validateOwner = (value: string) =>
  !!value.match(OWNER_PATTERN) ||
  "Invalid input. Please enter a valid GitHub handle or group preceded by '@'.";

export default async (opts: OptionValues) => {
  let name = opts.name as string | undefined;

  if (name) {
    const nameError = validateName(name);
    if (nameError !== true) {
      throw new Error(nameError);
    }
  }

  if (opts.owner) {
    const ownerError = validateOwner(opts.owner);
    if (ownerError !== true) {
      throw new Error(ownerError);
    }
  }

  if (!name || !opts.owner) {
    const answers = await inquirer.prompt([
      ...(name
        ? []
        : [
            {
              type: 'input' as const,
              name: 'name',
              message: chalk.blue('Name of the new workspace'),
              validate: validateName,
            },
          ]),
      ...(opts.owner
        ? []
        : [
            {
              type: 'input' as const,
              name: 'owners',
              message: chalk.blue('Name of the owner(s) of the workspace'),
              validate: validateOwner,
            },
          ]),
    ]);
    name = name ?? answers.name;
  }

  await createWorkspace({ name: name! });
};
