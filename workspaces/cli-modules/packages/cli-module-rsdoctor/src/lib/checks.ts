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
import fs from 'node:fs';
import path from 'node:path';
import { Budgets, BUDGETS_FILE_NAME, loadBudgets } from './budgets';
import { isCi } from './options';
import { readSizes, SizesReport } from './sizes';

/** Flags shared by the commands that evaluate budgets. */
export const checkFlags = {
  summary: {
    type: Boolean,
    description:
      'Print a size summary with the Rsdoctor findings to the console. Defaults to on when CI is set',
  },
  budget: {
    type: Boolean,
    description:
      'Check size budgets. Defaults to on when rsdoctor.budgets.json exists in the package; --no-budget disables it',
  },
  budgetFile: {
    type: String,
    description:
      'Budget file to use instead of <package>/rsdoctor.budgets.json',
  },
  baseline: {
    type: String,
    description:
      'sizes.json (or a directory containing it) of a previous build to compare against',
  },
} as const;

export interface CheckFlagValues {
  summary?: boolean;
  budget?: boolean;
  budgetFile?: string;
  baseline?: string;
}

export interface ResolvedChecks {
  summary: boolean;
  budgets?: Budgets;
  budgetFile?: string;
  baseline?: { report: SizesReport; label: string };
}

/** Resolves budgets and baseline from flags, the budget file and CI defaults. */
export function resolveChecks(
  flags: CheckFlagValues,
  targetDir: string,
  defaults: { summary?: boolean } = {},
): ResolvedChecks {
  let budgets: Budgets | undefined;
  let budgetFile: string | undefined;
  if (flags.budget !== false) {
    const file = path.resolve(targetDir, flags.budgetFile ?? BUDGETS_FILE_NAME);
    if (flags.budgetFile || flags.budget || fs.existsSync(file)) {
      budgets = loadBudgets(file);
      budgetFile = file;
    }
  }

  let baseline: ResolvedChecks['baseline'];
  const baselinePath = flags.baseline ?? budgets?.baseline?.path;
  if (baselinePath) {
    const resolved = path.resolve(targetDir, baselinePath);
    baseline = {
      report: readSizes(resolved),
      label: path.relative(process.cwd(), resolved) || resolved,
    };
  }

  return {
    summary: flags.summary ?? defaults.summary ?? isCi,
    budgets,
    budgetFile,
    baseline,
  };
}

export function readPackageName(targetDir: string): string {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(targetDir, 'package.json'), 'utf8'),
  );
  return packageJson.name ?? path.basename(targetDir);
}
