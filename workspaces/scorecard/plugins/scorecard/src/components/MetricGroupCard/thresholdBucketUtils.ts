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

import type {
  MetricResult,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import type { scorecardTranslationRef } from '../../translations';
import { getTranslatedStatus } from '../../utils';
import { getThresholdRuleColor } from '../../utils/thresholdUtils';
import type { ThresholdBucket } from './types';

/**
 * Collects the unique, ordered set of threshold rules across a group of metrics.
 */
function collectThresholdRules(metrics: MetricResult[]): ThresholdRule[] {
  const rules: ThresholdRule[] = [];
  const seen = new Set<string>();

  for (const metric of metrics) {
    for (const rule of metric.result?.thresholdResult?.definition?.rules ??
      []) {
      if (!seen.has(rule.key)) {
        seen.add(rule.key);
        rules.push(rule);
      }
    }
  }

  return rules;
}

/**
 * Counts metrics per threshold evaluation key.
 */
function countByEvaluation(metrics: MetricResult[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const metric of metrics) {
    const evaluation = metric.result?.thresholdResult?.evaluation;
    if (evaluation) {
      counts.set(evaluation, (counts.get(evaluation) ?? 0) + 1);
    }
  }

  return counts;
}

/**
 * Aggregates a set of metrics into threshold buckets.
 *
 * Each bucket represents a threshold rule (e.g. "success", "warning", "error")
 * and contains the count of metrics whose evaluation matched that rule.
 */
export function buildThresholdBuckets(
  metrics: MetricResult[],
  t: TranslationFunction<typeof scorecardTranslationRef.T>,
): ThresholdBucket[] {
  const rules = collectThresholdRules(metrics);
  const counts = countByEvaluation(metrics);

  return rules.map(rule => ({
    key: rule.key,
    label: getTranslatedStatus(rule.key, t),
    expression: rule.expression ?? '',
    count: counts.get(rule.key) ?? 0,
    color: getThresholdRuleColor(rules, rule.key) ?? 'error.main',
  }));
}
