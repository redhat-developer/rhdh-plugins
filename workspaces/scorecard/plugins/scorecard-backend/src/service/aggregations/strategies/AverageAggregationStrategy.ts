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
  type AggregatedMetricAverageResult,
  type AggregatedMetricResult,
  type ThresholdConfig,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS } from '../../../constants/aggregationKPIs';
import { AggregatedMetricMapper } from '../../mappers';
import type { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import type { AggregationOptions } from '../types';
import type { AggregationStrategy } from './types';
import { LoggerService } from '@backstage/backend-plugin-api';
import { ThresholdEvaluator } from '../../../threshold/ThresholdEvaluator';
import { AverageOptions } from '../../../utils/buildAggregationConfig';

export class AverageAggregationStrategy implements AggregationStrategy {
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
    const { options } = aggregationConfig;

    if (!options?.statusScores) {
      throw new Error(
        `The "scorecard.aggregationKPIs.${aggregationConfig.id}.options.statusScores" is required for average aggregation`,
      );
    }

    const aggregationResultThresholds =
      options.aggregationResultThresholds ??
      DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS;

    if (!options.aggregationResultThresholds) {
      this.logger.info(
        `The "scorecard.aggregationKPIs.${aggregationConfig.id}.options.aggregationResultThresholds" is not configured for average aggregation; ` +
          'using the default 0–100% health scale (higher is better).',
      );
    }

    const aggregatedMetric =
      await this.loader.loadStatusGroupedMetricByEntityRefs(
        entityRefs,
        metric.id,
      );

    const weightedSum = this.calculateWeightedSum(
      aggregatedMetric.values,
      options.statusScores,
      metric.id,
    );

    const { averageScore, maxPossibleScore } = this.prepareScoreValues(
      aggregatedMetric.total,
      options.statusScores,
      thresholds.rules,
      weightedSum,
    );

    const scorePercent = averageScore * 100;

    const aggregationChartDisplayColor = this.getAggregationChartDisplayColor(
      scorePercent,
      aggregationResultThresholds,
    );

    if (!aggregationChartDisplayColor) {
      throw new Error(
        `The color for percentage '${scorePercent}' metric '${metric.id}' is not configured. Check the 'scorecard.aggregationKPIs.${aggregationConfig.id}.options.aggregationResultThresholds' configuration.`,
      );
    }

    const result = {
      total: aggregatedMetric.total,
      timestamp: aggregatedMetric.timestamp,
      values: thresholds.rules.map(rule => ({
        name: rule.key,
        count: aggregatedMetric.values[rule.key] ?? 0,
        score: options.statusScores[rule.key] ?? 0,
      })),
      thresholds,
      averageScore,
      averageWeightedSum: weightedSum,
      averageMaxPossible: maxPossibleScore,
      aggregationChartDisplayColor,
    } as AggregatedMetricAverageResult;

    return AggregatedMetricMapper.toAggregatedMetricResult(
      metric,
      result,
      aggregationConfig,
    );
  }

  private calculateWeightedSum(
    values: Pick<AggregatedMetric, 'values'>['values'],
    statusScores: AverageOptions['statusScores'],
    metricId: string,
  ): number {
    let weightedSum = 0;
    for (const [status, count] of Object.entries(values)) {
      const score = statusScores[status as string];

      if (score === undefined) {
        this.logger.warn(
          `The status "${status}" is not in the statusScores for average aggregation of metric "${metricId}"`,
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

  private prepareScoreValues(
    numberOfEntities: Pick<AggregatedMetric, 'total'>['total'],
    statusScores: AverageOptions['statusScores'],
    rules: ThresholdRule[],
    weightedSum: number,
  ): { averageScore: number; maxPossibleScore: number } {
    const statusScoresValues = rules.map(r => statusScores[r.key] ?? 0);

    const maxScore = Math.max(0, ...statusScoresValues);

    const maxPossibleScore = maxScore * numberOfEntities;

    const averageScore =
      numberOfEntities > 0 && maxPossibleScore > 0
        ? Math.round((weightedSum / maxPossibleScore) * 10) / 10
        : 0;

    return { averageScore, maxPossibleScore };
  }
}
