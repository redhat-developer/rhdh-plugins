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
import { Command } from 'commander';
import { lazy } from '../lib/lazy';

export const registerCommands = (program: Command) => {
  program
    .command('init')
    .description('init')
    .action(lazy(() => import('./init'), 'default'));

  program
    .command('generate')
    .description(
      'Generate a Plugin entities for the extensions. By default, it will output entities to the standard output',
    )
    .option(
      '-p, --default-dynamic-plugins-config [path]',
      'Path to the default dynamic plugins file (usually dynamic-plugins.default.yaml in rhdh source code)',
    )
    .option(
      '-o, --output-dir [path]',
      'Path to the output directory. Each entity will be written to a separate file',
    )
    .option(
      '--namespace [namespace]',
      'metadata.namespace for the generated Package entities',
    )
    .option('--owner [owner]', 'spec.owner for the generated Package entities')
    .action(lazy(() => import('./generate'), 'default'));

  program
    .command('verify')
    .description(
      'Verify a set of extensions entities. By default, it will read entities from the standard input',
    )
    .action(lazy(() => import('./verify'), 'default'));

  program
    .command('export-csv')
    .description('Export a folder of extensions plugin YAMLs to a CSV file')
    .option(
      '-o, --output-file [path]',
      'Path to the output CSV file. By default, it will output to the standard output. When a file is specified, the "csv" file extension will be added automatically',
    )
    .option(
      '-p, --plugins-yaml-path [path]',
      'Path to the default plugins folder, containing extensions plugin YAML files. Multiple paths can be provided, separated by commas',
    )
    .option(
      '-r, --recursive',
      'Recursively search for YAML files in each directory provided in plugins-yaml-path',
    )
    .option(
      '-t, --type [type]',
      'The type of CSV to export. Can be one of: "plugin", "package", or "all". "all" will generate two files.',
      'all',
    )
    .action(lazy(() => import('./export-csv'), 'default'));
};
