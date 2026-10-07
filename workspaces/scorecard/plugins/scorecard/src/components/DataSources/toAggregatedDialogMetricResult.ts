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
import { getThresholdRuleColor, resolveMetricTranslation } from '../../utils';
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
 * Do not replace this with `getMatchingThresholdKey(aggregatedValue)` — KPI
 * thresholds (e.g. weighted score 0–100) are not the same as default number
 * metric rules (`>50` → error). The backend already classified the value and
 * sent `aggregationChartDisplayColor`; invert that color to the rule key.
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
