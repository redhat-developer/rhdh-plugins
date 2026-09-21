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
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { createBudgetRule, BUDGET_RULE_TITLE } from './budgetRule';
import {
  Budgets,
  diffSizes,
  evaluateBaseline,
  evaluateBudgets,
} from './budgets';
import { isCi, RsdoctorOptions } from './options';
import {
  collectSizes,
  SIZES_FILE_NAME,
  SizesReport,
  writeSizes,
} from './sizes';
import { formatDiff, formatSummary } from './summary';

/** Bundle checks run at the end of a `rsdoctor build`. */
export interface BundleChecks {
  packageName: string;
  /** Print the size summary and Rsdoctor findings to the console. */
  summary: boolean;
  /** Static size limits; the build fails when they are exceeded. */
  budgets?: Budgets;
  /** Sizes of a previous build to compare against. */
  baseline?: { report: SizesReport; label: string };
}

// Rsdoctor's rules plugin pushes its lint findings (e.g. E1001 duplicate
// packages, EXTEND for custom rules) into `compilation.warnings` from a `done`
// hook. This plugin taps
// `done` after it, records the findings for the summary and, on CI, removes
// them again because the Backstage CLI treats warnings as errors there. The
// findings stay in the report.
const RSDOCTOR_FINDING = /\[(E\d{4}|EXTEND):(Warn|Error|Info):/;

/** Extracts Rsdoctor findings from the compilation warnings. */
function takeRsdoctorFindings(warnings: any[], remove: boolean): string[] {
  const findings: string[] = [];
  for (let i = warnings.length - 1; i >= 0; i--) {
    const message = String(warnings[i]?.message ?? '');
    if (RSDOCTOR_FINDING.test(message)) {
      findings.unshift(message);
      if (remove) {
        warnings.splice(i, 1);
      }
    }
  }
  return findings;
}

class RsdoctorBundleChecksPlugin {
  constructor(
    private readonly sizesPath: string,
    private readonly checks: BundleChecks | undefined,
  ) {}

  apply(compiler: any) {
    compiler.hooks.done.tapPromise(
      'RsdoctorBundleChecksPlugin',
      async (stats: any) => {
        const findings = takeRsdoctorFindings(stats.compilation.warnings, isCi);
        if (!this.checks) {
          if (isCi && findings.length > 0) {
            console.log(
              `Rsdoctor: ${findings.length} lint finding(s) kept out of the build warnings on CI, see the report for details.`,
            );
          }
          return;
        }

        const { packageName, summary, budgets, baseline } = this.checks;
        const report = collectSizes(stats, packageName);
        writeSizes(this.sizesPath, report);

        const output: string[] = [];
        const violations: string[] = [];
        if (summary) {
          output.push(formatSummary(report, findings));
        }
        if (budgets) {
          const result = evaluateBudgets(report, budgets);
          output.push('Budget checks:', ...result.notes.map(n => `  ${n}`));
          violations.push(...result.violations);
        }
        if (baseline) {
          output.push(
            `Baseline: ${baseline.label}`,
            formatDiff(
              baseline.report,
              report,
              diffSizes(baseline.report, report),
            ),
          );
          if (budgets?.baseline) {
            const result = evaluateBaseline(
              baseline.report,
              report,
              budgets.baseline,
            );
            output.push('Baseline checks:', ...result.notes.map(n => `  ${n}`));
            violations.push(...result.violations);
          }
        }
        output.push(
          `Sizes written to ${path.relative(process.cwd(), this.sizesPath)}`,
        );
        console.log(`\n${output.join('\n')}\n`);

        if (violations.length > 0) {
          const message = `Bundle size budget exceeded:\n${violations
            .map(v => `  - ${v}`)
            .join('\n')}`;
          console.error(message);
          stats.compilation.errors.push(new Error(message));
        }
      },
    );
  }
}

/**
 * The Backstage CLI does not expose its Rspack configuration. This wraps the
 * internal `createConfig` of `@backstage/cli-module-build` so that every
 * frontend bundler config created afterwards (build and dev server) carries
 * the Rsdoctor plugin, plus the bundle checks when requested.
 */
export function enableRsdoctor(
  options: RsdoctorOptions,
  checks?: BundleChecks,
): void {
  const { mode, open, port } = options;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bundlerConfig = require('@backstage/cli-module-build/dist/lib/bundler/config.cjs.js');
  const originalCreateConfig = bundlerConfig.createConfig;
  if (typeof originalCreateConfig !== 'function') {
    throw new Error(
      'Unable to enable Rsdoctor: @backstage/cli-module-build does not export the expected bundler config module',
    );
  }

  bundlerConfig.createConfig = async function createConfigWithRsdoctor(
    this: unknown,
    paths: { targetPath: string; targetDist: string },
    configOptions: unknown,
  ) {
    const config = await originalCreateConfig.call(this, paths, configOptions);

    // Only instrument the main bundle; the optional public/auth bundle
    // (dist/public) would otherwise start a second Rsdoctor instance.
    if (path.basename(paths.targetDist) === 'public') {
      return config;
    }

    // Normal mode writes into `<reportDir>/.rsdoctor/`, brief mode writes
    // `<reportDir>/rsdoctor-report.html`. Default both to <package>/.rsdoctor.
    const reportDir =
      options.reportDir ??
      (mode === 'brief'
        ? path.resolve(paths.targetPath, '.rsdoctor')
        : paths.targetPath);
    const reportFolder =
      mode === 'brief' ? reportDir : path.join(reportDir, '.rsdoctor');
    const reportPath =
      mode === 'brief'
        ? path.join(reportDir, 'rsdoctor-report.html')
        : reportFolder;

    // Rsdoctor cannot read `eval` source maps (used by the dev server).
    if (typeof config.devtool === 'string' && config.devtool.includes('eval')) {
      config.devtool = 'cheap-module-source-map';
    }

    const budgets = checks?.budgets;
    config.plugins.push(
      new RsdoctorRspackPlugin({
        disableClientServer: !open,
        port,
        output: {
          mode,
          reportDir,
          ...(mode === 'brief' && options.json
            ? { options: { type: ['html', 'json'] } }
            : {}),
        } as any,
        ...(budgets && checks
          ? {
              linter: {
                extends: [createBudgetRule(budgets, checks.packageName)],
                rules: { [BUDGET_RULE_TITLE]: 'on' },
              } as any,
            }
          : {}),
      }),
    );
    config.plugins.push(
      new RsdoctorBundleChecksPlugin(
        path.join(reportFolder, SIZES_FILE_NAME),
        checks,
      ),
    );

    console.log(
      `Rsdoctor enabled (mode: ${mode}, report: ${path.relative(
        process.cwd(),
        reportPath,
      )}${open ? ', the report server opens after the build' : ''})`,
    );
    return config;
  };
}
