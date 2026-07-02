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
  DEFAULT_NUMBER_THRESHOLDS,
  type AggregatedMetricResult,
  type ScalarAggregationResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { ScalarAggregationFn } from '../../../database/types';
import { AggregatedMetricMapper } from '../../mappers';
import type { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import type { AggregationOptions } from '../types';
import { isScalarAggregationRuntimeConfig } from '../utils/aggregationRuntimeConfig';
import type { AggregationStrategy } from './types';

export class ValueAggregationStrategy implements AggregationStrategy {
  constructor(
    private readonly loader: AggregatedMetricLoader,
    private readonly aggregationFn: ScalarAggregationFn,
  ) {}

  async aggregate(
    options: AggregationOptions,
  ): Promise<AggregatedMetricResult> {
    const { entityRefs, metric, aggregationConfig } = options;

    if (!isScalarAggregationRuntimeConfig(aggregationConfig)) {
      throw new Error(
        `Expected a validated scalar aggregation config but received type "${aggregationConfig.type}"`,
      );
    }

    const {
      value,
      total,
      entitiesConsidered,
      calculationErrorCount,
      timestamp,
    } = await this.loader.loadScalarMetricByEntityRefs(
      entityRefs,
      metric.id,
      this.aggregationFn,
    );

    const thresholds =
      aggregationConfig.options?.thresholds ?? DEFAULT_NUMBER_THRESHOLDS;

    const result: ScalarAggregationResult = {
      value,
      total,
      entitiesConsidered,
      calculationErrorCount,
      timestamp,
      thresholds,
    };

    return AggregatedMetricMapper.toAggregatedMetricResult(
      metric,
      result,
      aggregationConfig,
    );
  }
}
