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
import { diffSizes, evaluateBaseline } from '../lib/budgets';
import { resolveChecks } from '../lib/checks';
import { executeRsdoctorCli, waitForInterrupt } from '../lib/rsdoctorCli';
import { readSizes, resolveReportFile } from '../lib/sizes';
import { formatDiff } from '../lib/summary';

export default async ({ args, info }: CliCommandContext) => {
  const { flags } = cli(
    {
      name: info.usage,
      booleanFlagNegation: true,
      flags: {
        baseline: {
          type: String,
          description:
            'Report of the baseline build: its .rsdoctor directory, or its sizes.json / manifest.json',
        },
        current: {
          type: String,
          description:
            'Report of the current build, defaults to .rsdoctor in the current package',
        },
        limit: {
          type: Number,
          description: 'Number of changed files to list',
          default: 15,
        },
        budget: {
          type: Boolean,
          description:
            'Fail when the growth exceeds the baseline limits of rsdoctor.budgets.json. Defaults to on when the file exists',
        },
        budgetFile: {
          type: String,
          description:
            'Budget file to use instead of <package>/rsdoctor.budgets.json',
        },
        html: {
          type: Boolean,
          description:
            "Also write Rsdoctor's bundle diff as a standalone HTML file (needs manifest.json of both builds)",
        },
        json: {
          type: Boolean,
          description: "Also write Rsdoctor's bundle diff as a JSON file",
        },
        output: {
          type: String,
          description:
            'Output path for --html / --json, defaults to rsdoctor-diff.html / rsdoctor-diff.json',
        },
        serve: {
          type: Boolean,
          description:
            "Open Rsdoctor's interactive bundle diff in the browser instead of writing a file",
        },
      },
      help: {
        description:
          'Compares the sizes of two "rsdoctor build" reports and prints the gzip size changes per file. Optionally generates the Rsdoctor bundle diff report.',
      },
    },
    undefined,
    args,
  );

  if (!flags.baseline) {
    throw new Error('--baseline is required');
  }
  const baselineTarget = path.resolve(targetPaths.dir, flags.baseline);
  const currentTarget = path.resolve(
    targetPaths.dir,
    flags.current ?? '.rsdoctor',
  );
  const baseline = readSizes(baselineTarget);
  const current = readSizes(currentTarget);

  console.log(
    `Baseline: ${baseline.package} (${baseline.createdAt})\nCurrent:  ${current.package} (${current.createdAt})\n`,
  );
  console.log(
    formatDiff(baseline, current, diffSizes(baseline, current), {
      limit: flags.limit,
    }),
  );

  const violations: string[] = [];
  const checks = resolveChecks(
    { budget: flags.budget, budgetFile: flags.budgetFile },
    targetPaths.dir,
  );
  if (checks.budgets?.baseline) {
    const result = evaluateBaseline(baseline, current, checks.budgets.baseline);
    console.log(
      ['Baseline checks:', ...result.notes.map(n => `  ${n}`)].join('\n'),
    );
    violations.push(...result.violations);
  }

  if (flags.html || flags.json || flags.serve) {
    if (flags.html && flags.json) {
      throw new Error('--html and --json cannot be combined');
    }
    const baselineManifest = resolveReportFile(baselineTarget, 'manifest.json');
    const currentManifest = resolveReportFile(currentTarget, 'manifest.json');
    await executeRsdoctorCli('bundle-diff', {
      baseline: baselineManifest,
      current: currentManifest,
      html: Boolean(flags.html),
      json: Boolean(flags.json),
      output: flags.output,
      open: Boolean(flags.serve),
    });
  }

  if (violations.length > 0) {
    throw new Error(
      `Bundle size budget exceeded:\n${violations
        .map(v => `  - ${v}`)
        .join('\n')}`,
    );
  }
  if (flags.serve) {
    await waitForInterrupt();
  }
};
