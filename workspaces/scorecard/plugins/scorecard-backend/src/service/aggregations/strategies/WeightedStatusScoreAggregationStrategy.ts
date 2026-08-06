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

import {
  type AggregatedMetric,
  type WeightedStatusScoreAggregationResult,
  type AggregatedMetricResult,
  type ThresholdConfig,
  ThresholdRule,
  aggregationTypes,
  type StatusScoreAggregationOption,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DEFAULT_WEIGHTED_STATUS_SCORE_KPI_RESULT_THRESHOLDS } from '../../../constants/aggregationKPIs';
import { AggregatedMetricMapper } from '../../mappers';
import type { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import type { AggregationOptions } from '../types';
import type { AggregationStrategy } from './types';
import { LoggerService } from '@backstage/backend-plugin-api';
import { ThresholdEvaluator } from '../../../threshold/ThresholdEvaluator';

export class WeightedStatusScoreAggregationStrategy
  implements AggregationStrategy
{
  constructor(
    private readonly loader: AggregatedMetricLoader,
    private readonly logger: LoggerService,
  ) {}

  async aggregate({
    entityRefs,
    metric,
    thresholds,
    aggregationConfig,
  }: AggregationOptions): Promise<AggregatedMetricResult> {
    if (aggregationConfig.type !== aggregationTypes.weightedStatusScore) {
      throw new Error(
        `Expected aggregation type "${aggregationTypes.weightedStatusScore}" but received "${aggregationConfig.type}"`,
      );
    }

    const {
      statusScores,
      thresholds:
        headlineThresholds = DEFAULT_WEIGHTED_STATUS_SCORE_KPI_RESULT_THRESHOLDS,
    } = aggregationConfig.options;

    const aggregatedMetric =
      await this.loader.loadStatusGroupedMetricByEntityRefs(
        entityRefs,
        metric.id,
      );

    const weightedSum = this.calculateWeightedSum(
      aggregatedMetric.values,
      statusScores,
      metric.id,
    );

    const { weightedStatusScore, maxPossibleScore } =
      this.prepareWeightedStatusScoreValues(
        aggregatedMetric.total,
        statusScores,
        thresholds.rules,
        weightedSum,
      );

    const aggregationChartDisplayColor = this.getAggregationChartDisplayColor(
      weightedStatusScore,
      headlineThresholds,
    );

    if (!aggregationChartDisplayColor) {
      throw new Error(
        `The color for percentage '${weightedStatusScore}' metric '${metric.id}' is not configured. Check the 'scorecard.aggregationKPIs.${aggregationConfig.id}.options.thresholds' configuration.`,
      );
    }

    const result = {
      total: aggregatedMetric.total,
      timestamp: aggregatedMetric.timestamp,
      entitiesConsidered: aggregatedMetric.entitiesConsidered,
      calculationErrorCount: aggregatedMetric.calculationErrorCount,
      values: thresholds.rules.map(rule => ({
        name: rule.key,
        count: aggregatedMetric.values[rule.key] ?? 0,
        score: statusScores[rule.key] ?? 0,
      })),
      thresholds,
      weightedStatusScore,
      weightedStatusSum: weightedSum,
      weightedStatusMaxPossible: maxPossibleScore,
      aggregationChartDisplayColor,
    } as WeightedStatusScoreAggregationResult;

    return AggregatedMetricMapper.toAggregatedMetricResult(
      metric,
      result,
      aggregationConfig,
    );
  }

  private calculateWeightedSum(
    values: Pick<AggregatedMetric, 'values'>['values'],
    statusScores: StatusScoreAggregationOption,
    metricId: string,
  ): number {
    let weightedSum = 0;
    for (const [status, count] of Object.entries(values)) {
      const score = statusScores[status];

      if (score === undefined) {
        this.logger.warn(
          `The status "${status}" is not in the statusScores for weightedStatusScore aggregation of metric "${metricId}"`,
        );
      }
      weightedSum += count * (score ?? 0);
    }
    return weightedSum;
  }

  private getAggregationChartDisplayColor(
    scorePercent: number,
    thresholds: ThresholdConfig,
  ): string | undefined {
    const thresholdEvaluator = new ThresholdEvaluator();

    const matchedThresholdKey = thresholdEvaluator.getFirstMatchingThreshold(
      scorePercent,
      'number',
      thresholds,
    );

    return thresholds.rules.find(r => r.key === matchedThresholdKey)?.color;
  }

  private prepareWeightedStatusScoreValues(
    numberOfEntities: Pick<AggregatedMetric, 'total'>['total'],
    statusScores: StatusScoreAggregationOption,
    rules: ThresholdRule[],
    weightedSum: number,
  ): { weightedStatusScore: number; maxPossibleScore: number } {
    const statusScoresValues = rules.map(r => statusScores[r.key] ?? 0);

    const maxScore = Math.max(0, ...statusScoresValues);

    const maxPossibleScore = maxScore * numberOfEntities;

    const weightedStatusScore =
      numberOfEntities > 0 && maxPossibleScore > 0
        ? Math.round((weightedSum / maxPossibleScore) * 1000) / 10
        : 0;

    return { weightedStatusScore, maxPossibleScore };
  }
}
