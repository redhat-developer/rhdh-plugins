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
 * Aggregates a set of metrics into threshold buckets.
 *
 * Only buckets where at least one metric evaluated into that threshold are
 * returned. Expressions are omitted because metrics in a group may define
 * different expressions for the same key (e.g. success: <1 vs success: <10).
 * Per-metric expressions are shown in the data sources dialog tooltip instead.
 */
export function buildThresholdBuckets(
  metrics: MetricResult[],
  t: TranslationFunction<typeof scorecardTranslationRef.T>,
): ThresholdBucket[] {
  const rules = collectThresholdRules(metrics);
  const buckets: ThresholdBucket[] = [];
  const seen = new Set<string>();

  for (const metric of metrics) {
    const evaluation = metric.result?.thresholdResult?.evaluation;
    if (evaluation && !seen.has(evaluation)) {
      seen.add(evaluation);
      buckets.push({
        key: evaluation,
        label: getTranslatedStatus(evaluation, t),
        count: 0,
        color: getThresholdRuleColor(rules, evaluation) ?? 'error.main',
      });
    }
  }

  for (const metric of metrics) {
    const evaluation = metric.result?.thresholdResult?.evaluation;
    if (evaluation) {
      const bucket = buckets.find(b => b.key === evaluation);
      if (bucket) bucket.count += 1;
    }
  }

  return buckets;
}
