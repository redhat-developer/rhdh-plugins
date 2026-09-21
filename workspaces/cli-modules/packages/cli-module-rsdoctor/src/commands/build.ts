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
import { cli } from 'cleye';
import type { CliCommandContext } from '@backstage/cli-node';
import { targetPaths } from '@backstage/cli-common';
import { checkFlags, readPackageName, resolveChecks } from '../lib/checks';
import { enableRsdoctor } from '../lib/enableRsdoctor';
import {
  partitionArgs,
  resolveRsdoctorOptions,
  rsdoctorFlags,
} from '../lib/options';
import { assertFrontendRole } from '../lib/packageRole';

const flagDefinitions = {
  ...rsdoctorFlags,
  json: {
    type: Boolean,
    description:
      'Also write the report as JSON next to the HTML report (brief mode only)',
  },
  moduleFederation: {
    type: Boolean,
    description:
      'Build the package as a module federation remote. Defaults to true for plugin packages, because only Rspack builds can be analysed',
  },
  ...checkFlags,
};

export default async ({ args, info }: CliCommandContext) => {
  const { own, rest } = partitionArgs(args, flagDefinitions);
  const { flags } = cli(
    {
      name: info.usage,
      booleanFlagNegation: true,
      flags: flagDefinitions,
      help: {
        description:
          'Runs "backstage-cli package build" with the Rsdoctor Rspack plugin enabled, writes .rsdoctor/sizes.json and checks size budgets. Other flags are forwarded to the build command.',
      },
    },
    undefined,
    own,
  );

  const role = assertFrontendRole('rsdoctor build');
  const moduleFederation = flags.moduleFederation ?? role !== 'frontend';

  const options = resolveRsdoctorOptions(flags);
  if (flags.json && options.mode !== 'brief') {
    throw new Error('--json requires --mode brief');
  }
  const checks = resolveChecks(flags, targetPaths.dir);
  enableRsdoctor(
    { ...options, json: flags.json },
    {
      packageName: readPackageName(targetPaths.dir),
      summary: checks.summary,
      budgets: checks.budgets,
      baseline: checks.baseline,
    },
  );
  if (checks.budgetFile) {
    console.log(`Rsdoctor budgets loaded from ${checks.budgetFile}`);
  }

  const buildArgs = [
    ...(moduleFederation ? ['--module-federation'] : []),
    ...rest,
  ];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const buildCommand =
    require('@backstage/cli-module-build/dist/commands/package/build/command.cjs.js')
      .default as (context: CliCommandContext) => Promise<void>;
  await buildCommand({
    args: buildArgs,
    info: { usage: 'backstage-cli package build', name: 'package build' },
  });
};
