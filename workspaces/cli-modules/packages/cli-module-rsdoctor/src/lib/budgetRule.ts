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
import { defineRule } from '@rsdoctor/core/rules';
import { Budgets, evaluateBudgets } from './budgets';
import type { Linter } from '@rsdoctor/types';
import {
  assetType,
  buildSizesReport,
  SizeEntry,
  stableAssetKey,
} from './sizes';

export const BUDGET_RULE_TITLE = 'bundle-size-budget';

/**
 * A custom Rsdoctor rule that mirrors the static budget checks, so budget
 * violations also show up in the report UI (Overall > Bundle Alerts). The
 * hard failure of the build comes from the bundle checks plugin, not from
 * this rule.
 */
export function createBudgetRule(
  budgets: Budgets,
  packageName: string,
): Linter.ExtendRuleData<Record<string, never>, typeof BUDGET_RULE_TITLE> {
  return defineRule(() => ({
    meta: {
      code: 'E9001',
      title: BUDGET_RULE_TITLE,
      category: 'bundle',
      severity: 'Warn',
      defaultConfig: {} as Record<string, never>,
    },
    check({ chunkGraph, report }) {
      const entries: SizeEntry[] = [];
      for (const asset of chunkGraph.getAssets()) {
        const type = assetType(asset.path);
        if (!type) {
          continue;
        }
        const names = [
          ...new Set(asset.chunks.map(c => c.name).filter(Boolean)),
        ];
        entries.push({
          key: stableAssetKey(asset.path),
          file: asset.path,
          chunk: names.length ? names.join(',') : undefined,
          initial: asset.chunks.some(c => c.initial),
          type,
          size: asset.size,
          gzip: asset.gzipSize ?? asset.size,
        });
      }
      const { violations } = evaluateBudgets(
        buildSizesReport(entries, packageName),
        budgets,
      );
      for (const violation of violations) {
        report({
          message: `Bundle size budget exceeded: ${violation}`,
          detail: { type: BUDGET_RULE_TITLE },
        });
      }
    },
  }));
}
