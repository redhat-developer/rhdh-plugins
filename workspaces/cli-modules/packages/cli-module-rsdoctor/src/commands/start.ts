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
import { enableRsdoctor } from '../lib/enableRsdoctor';
import {
  partitionArgs,
  resolveRsdoctorOptions,
  rsdoctorFlags,
} from '../lib/options';
import { assertFrontendRole } from '../lib/packageRole';

export default async ({ args, info }: CliCommandContext) => {
  const { own, rest } = partitionArgs(args, rsdoctorFlags);
  const { flags } = cli(
    {
      name: info.usage,
      booleanFlagNegation: true,
      flags: rsdoctorFlags,
      help: {
        description:
          'Runs "backstage-cli package start" with the Rsdoctor Rspack plugin enabled. Other flags are forwarded to the start command.',
      },
    },
    undefined,
    own,
  );

  assertFrontendRole('rsdoctor start');
  enableRsdoctor(resolveRsdoctorOptions(flags));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const startCommand =
    require('@backstage/cli-module-build/dist/commands/package/start/command.cjs.js')
      .default as (context: CliCommandContext) => Promise<void>;
  await startCommand({
    args: rest,
    info: { usage: 'backstage-cli package start', name: 'package start' },
  });
};
