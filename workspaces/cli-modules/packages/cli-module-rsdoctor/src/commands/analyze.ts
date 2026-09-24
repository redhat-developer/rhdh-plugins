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
import { cli } from 'cleye';
import type { CliCommandContext } from '@backstage/cli-node';
import { targetPaths } from '@backstage/cli-common';
import { executeRsdoctorCli, waitForInterrupt } from '../lib/rsdoctorCli';

export default async ({ args, info }: CliCommandContext) => {
  const { flags } = cli(
    {
      name: info.usage,
      booleanFlagNegation: true,
      flags: {
        profile: {
          type: String,
          description:
            'Path to the manifest.json of a report, defaults to .rsdoctor/manifest.json in the current package',
        },
        open: {
          type: Boolean,
          description: 'Open the browser, use --no-open to disable',
          default: true,
        },
        port: {
          type: Number,
          description: 'Port of the Rsdoctor report server',
        },
      },
    },
    undefined,
    args,
  );

  const profile = path.resolve(
    targetPaths.dir,
    flags.profile ?? path.join('.rsdoctor', 'manifest.json'),
  );
  await executeRsdoctorCli('analyze', {
    profile,
    open: flags.open,
    port: flags.port,
  });

  // The report server lives in this process; keep it running until the user
  // interrupts, because the CLI exits once the command has finished.
  await waitForInterrupt();
};
