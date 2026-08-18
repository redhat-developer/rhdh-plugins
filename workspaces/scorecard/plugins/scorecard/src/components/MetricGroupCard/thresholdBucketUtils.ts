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
import { getTranslatedStatus, SCORECARD_ERROR_STATE_COLOR } from '../../utils';
import { getThresholdRuleColor } from '../../utils/thresholdUtils';
import type { ThresholdBucket } from './types';

/**
 * Bucket key used when a metric has no threshold evaluation (e.g. missing
 * value). Shown as a "—" tile, separate from Error.
 */
export const MISSING_EVALUATION_BUCKET_KEY = 'noEvaluation';

/** Display label for metrics with no threshold evaluation. */
export const MISSING_EVALUATION_LABEL = '—';

type ScorecardTranslate = TranslationFunction<typeof scorecardTranslationRef.T>;

/**
 * Keeps the first occurrence of each metric ID so duplicate config entries
 * are not shown or counted twice.
 */
export function dedupeMetricsById(metrics: MetricResult[]): MetricResult[] {
  const seenIds = new Set<string>();
  return metrics.filter(metric => {
    if (seenIds.has(metric.id)) {
      return false;
    }
    seenIds.add(metric.id);
    return true;
  });
}

/**
 * Whether the metric has a resolved threshold evaluation key.
 */
export function hasMetricEvaluation(metric: MetricResult): boolean {
  return Boolean(metric.result?.thresholdResult?.evaluation);
}

/**
 * Returns the threshold bucket key for a metric. Metrics without an evaluation
 * get {@link MISSING_EVALUATION_BUCKET_KEY} so they still appear in tiles.
 */
export function getMetricBucketKey(metric: MetricResult): string {
  return (
    metric.result?.thresholdResult?.evaluation ?? MISSING_EVALUATION_BUCKET_KEY
  );
}

/**
 * Display label for a bucket key ("—" for missing evaluation).
 */
export function getMetricBucketLabel(
  bucketKey: string,
  t: ScorecardTranslate,
): string {
  if (bucketKey === MISSING_EVALUATION_BUCKET_KEY) {
    return MISSING_EVALUATION_LABEL;
  }
  return getTranslatedStatus(bucketKey, t);
}

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

function getBucketSortOrder(
  key: string,
  ruleOrder: Map<string, number>,
): number {
  // Keep the "—" (no evaluation) bucket last.
  if (key === MISSING_EVALUATION_BUCKET_KEY) {
    return Number.MAX_SAFE_INTEGER;
  }
  return ruleOrder.get(key) ?? ruleOrder.size;
}

/**
 * Aggregates a set of metrics into threshold buckets.
 *
 * Only buckets where at least one metric belongs are returned. Expressions are
 * omitted because metrics in a group may define different expressions for the
 * same key (e.g. success: <1 vs success: <10). Per-metric expressions are shown
 * in the data sources dialog tooltip instead.
 * Duplicate metric IDs are counted once (first occurrence wins).
 * Metrics with no threshold evaluation are counted in a "—" bucket.
 */
export function buildThresholdBuckets(
  metrics: MetricResult[],
  t: ScorecardTranslate,
): ThresholdBucket[] {
  const uniqueMetrics = dedupeMetricsById(metrics);
  const rules = collectThresholdRules(uniqueMetrics);
  const bucketsByKey = new Map<string, ThresholdBucket>();

  for (const metric of uniqueMetrics) {
    const key = getMetricBucketKey(metric);
    const existing = bucketsByKey.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }

    bucketsByKey.set(key, {
      key,
      label: getMetricBucketLabel(key, t),
      count: 1,
      color: getThresholdRuleColor(rules, key) ?? SCORECARD_ERROR_STATE_COLOR,
    });
  }

  const ruleOrder = new Map(rules.map((rule, index) => [rule.key, index]));
  return [...bucketsByKey.values()].sort(
    (a, b) =>
      getBucketSortOrder(a.key, ruleOrder) -
      getBucketSortOrder(b.key, ruleOrder),
  );
}
