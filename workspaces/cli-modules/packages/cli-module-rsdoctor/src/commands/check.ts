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
import { diffSizes, evaluateBaseline, evaluateBudgets } from '../lib/budgets';
import { checkFlags, resolveChecks } from '../lib/checks';
import { readSizes } from '../lib/sizes';
import { formatDiff, formatSummary } from '../lib/summary';

export default async ({ args, info }: CliCommandContext) => {
  const { flags } = cli(
    {
      name: info.usage,
      booleanFlagNegation: true,
      flags: {
        sizes: {
          type: String,
          description:
            'sizes.json of the build to check (or a directory containing it), defaults to .rsdoctor/sizes.json in the current package',
        },
        ...checkFlags,
      },
      help: {
        description:
          'Checks the sizes.json of a previous "rsdoctor build" against the size budgets and an optional baseline, without rebuilding. Exits with an error when a budget is exceeded.',
      },
    },
    undefined,
    args,
  );

  const sizesTarget = path.resolve(targetPaths.dir, flags.sizes ?? '.rsdoctor');
  const report = readSizes(sizesTarget);
  const checks = resolveChecks(flags, targetPaths.dir, { summary: true });

  const output: string[] = [];
  const violations: string[] = [];
  if (checks.summary) {
    output.push(formatSummary(report));
  }
  if (checks.budgets) {
    output.push(`Budgets: ${checks.budgetFile}`);
    const result = evaluateBudgets(report, checks.budgets);
    output.push('Budget checks:', ...result.notes.map(n => `  ${n}`));
    violations.push(...result.violations);
  } else {
    output.push(
      'No budgets checked (no rsdoctor.budgets.json found, pass --budget-file to use one)',
    );
  }
  if (checks.baseline) {
    const { report: baseline, label } = checks.baseline;
    output.push(
      `Baseline: ${label}`,
      formatDiff(baseline, report, diffSizes(baseline, report)),
    );
    if (checks.budgets?.baseline) {
      const result = evaluateBaseline(
        baseline,
        report,
        checks.budgets.baseline,
      );
      output.push('Baseline checks:', ...result.notes.map(n => `  ${n}`));
      violations.push(...result.violations);
    }
  }
  console.log(output.join('\n'));

  if (violations.length > 0) {
    throw new Error(
      `Bundle size budget exceeded:\n${violations
        .map(v => `  - ${v}`)
        .join('\n')}`,
    );
  }
  console.log('\nAll size checks passed.');
};
