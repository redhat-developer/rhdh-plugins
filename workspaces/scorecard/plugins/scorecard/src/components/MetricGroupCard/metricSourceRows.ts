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

import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { scorecardTranslationRef } from '../../translations';
import {
  extractPluginName,
  getLastUpdatedLabel,
  getStatusConfig,
  resolveMetricTranslation,
} from '../../utils';
import { formatMetricValue } from './DataSourcesDialogColumns';
import type { SourceRow } from './DataSourcesDialogColumns';
import {
  getMetricBucketKey,
  getMetricBucketLabel,
  hasMetricEvaluation,
  MISSING_EVALUATION_LABEL,
} from './thresholdBucketUtils';

type ScorecardTranslate = TranslationFunction<typeof scorecardTranslationRef.T>;

export const toMetricSourceRows = (
  metrics: MetricResult[],
  options: {
    t: ScorecardTranslate;
    locale: string;
  },
): SourceRow[] =>
  metrics.map((metric, index) => {
    const evaluationKey = getMetricBucketKey(metric);
    const evaluated = hasMetricEvaluation(metric);
    const thresholdRules =
      metric.result?.thresholdResult?.definition?.rules ?? [];

    const statusConfig = getStatusConfig({
      evaluation: evaluated ? evaluationKey : null,
      thresholdStatus: metric.result?.thresholdResult?.status,
      metricStatus: metric.status,
      thresholdRules,
    });

    const matchedRule = evaluated
      ? thresholdRules.find(r => r.key === evaluationKey)
      : undefined;

    return {
      id: String(index),
      plugin: extractPluginName(
        metric.id,
        options.t('dataSourcesDialog.unknownPlugin'),
      ),
      metricId: metric.id,
      metricDescription: resolveMetricTranslation(
        options.t,
        metric.id,
        'description',
        metric.metadata.description,
      ),
      value: formatMetricValue(metric.result),
      evaluationKey,
      statusLabel: getMetricBucketLabel(evaluationKey, options.t),
      statusIcon: evaluated ? statusConfig.icon ?? '' : '',
      statusColor: statusConfig.color,
      lastSynced: metric.result?.timestamp
        ? getLastUpdatedLabel(metric.result.timestamp, options.locale)
        : MISSING_EVALUATION_LABEL,
      thresholdExpression: matchedRule?.expression ?? null,
      unit: metric.metadata.unit,
    };
  });
