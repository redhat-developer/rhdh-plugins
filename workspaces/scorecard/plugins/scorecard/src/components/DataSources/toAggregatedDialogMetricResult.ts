/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/License-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import type {
  MetricResult,
  MetricType,
  ThresholdConfig,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { scorecardTranslationRef } from '../../translations';
import {
  getMatchingThresholdKey,
  getThresholdRuleColor,
  resolveMetricTranslation,
} from '../../utils';
import { toDialogMetricResult } from './toDialogMetricResult';

type ScorecardTranslate = TranslationFunction<typeof scorecardTranslationRef.T>;

export function getMetricCheckDescription(
  t: ScorecardTranslate,
  metricId: string,
): string {
  return resolveMetricTranslation(t, metricId, 'description', '');
}

/**
 * Maps the aggregation chart color back to a threshold key.
 *
 * The backend already classified the value and sent
 * `aggregationChartDisplayColor`. Invert that color against
 * `result.thresholds` (aggregation KPI rules) to get the rule key.
 *
 * For weightedStatusScore, use {@link getWeightedStatusScoreEvaluation}
 * instead — matching the 0–100 score is more reliable when KPI colors are
 * custom hex/rgb values.
 */
export function getEvaluationKeyFromChartColor(
  displayColor: string | null | undefined,
  rules?: ThresholdRule[],
): string | null {
  if (!displayColor || !rules?.length) {
    return null;
  }

  return (
    rules.find(rule => getThresholdRuleColor(rules, rule.key) === displayColor)
      ?.key ?? null
  );
}

/**
 * Resolves View data sources status for a weightedStatusScore card.
 *
 * Match the 0–100 score against aggregation KPI thresholds so custom hex/rgb
 * colors still map to Success/Warning/Error. Fall back to chart-color
 * inversion. Empty aggregations (`total === 0`) have no status.
 */
export function getWeightedStatusScoreEvaluation({
  weightedStatusScore,
  total,
  thresholds,
  displayColor,
}: {
  weightedStatusScore: number;
  total: number;
  thresholds?: ThresholdConfig;
  displayColor?: string | null;
}): string | null {
  if (total <= 0) {
    return null;
  }

  return (
    getMatchingThresholdKey(weightedStatusScore, thresholds) ??
    getEvaluationKeyFromChartColor(displayColor, thresholds?.rules) ??
    null
  );
}

export function toAggregatedDialogMetricResult({
  t,
  metricId,
  cardTitle,
  type,
  unit,
  timestamp,
  thresholds,
  value,
  evaluation,
  status,
  includeValueAndStatus = true,
}: {
  t: ScorecardTranslate;
  metricId: string;
  cardTitle: string;
  type: MetricType;
  unit?: string;
  timestamp: string;
  thresholds?: ThresholdConfig;
  value?: MetricResult['result']['value'] | null;
  evaluation?: string | null;
  status?: MetricResult['status'];
  includeValueAndStatus?: boolean;
}): MetricResult {
  return toDialogMetricResult({
    id: metricId,
    title: cardTitle,
    description: getMetricCheckDescription(t, metricId),
    type,
    unit,
    value: includeValueAndStatus ? value ?? null : null,
    timestamp,
    evaluation: includeValueAndStatus ? evaluation ?? null : null,
    thresholds: includeValueAndStatus ? thresholds : undefined,
    status,
  });
}
