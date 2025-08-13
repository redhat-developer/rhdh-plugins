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
  Metric,
  MetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvidersRegistry } from './MetricProvidersRegistry';
import { ThresholdEvaluator } from './ThresholdEvaluator';

/**
 * Service for metric operations.
 * @public
 */
export class MetricService {
  private readonly thresholdEvaluator = new ThresholdEvaluator();

  constructor(private readonly registry: MetricProvidersRegistry) {}

  listMetrics(): Metric[] {
    return this.registry.listMetrics();
  }

  listMetricsByDatasource(datasourceId: string): Metric[] {
    return this.registry.listMetricsByDatasource(datasourceId);
  }

  /**
   * Calculate metric results with the metadata and threshold evaluation.
   *
   * @param providerIds - Optional array of provider IDs to calculate.
   *                      If not provided, calculates all available metrics.
   */
  async calculateMetricResult(providerIds?: string[]): Promise<MetricResult[]> {
    const providerIdsToCalculate =
      providerIds ?? this.registry.listMetrics().map(m => m.id);
    const rawResults = await this.registry.calculateMetrics(
      providerIdsToCalculate,
    );

    return rawResults.map(({ providerId, value, error }) => {
      const provider = this.registry.getProvider(providerId);
      const metric = provider.getMetric();
      const thresholds = provider.getMetricThresholds();

      return {
        id: metric.id,
        status: error ? 'error' : 'success',
        metadata: {
          title: metric.title,
          type: metric.type,
          history: metric.history,
        },
        ...(error || value === undefined
          ? { error: error ?? new Error(`Metric value is 'undefined'`) }
          : {
              result: {
                value,
                timestamp: new Date().toISOString(),
                thresholdResult: {
                  definition: thresholds,
                  evaluation: this.thresholdEvaluator.getFirstMatchingThreshold(
                    value!,
                    thresholds,
                  ),
                },
              },
            }),
      };
    });
  }
}
