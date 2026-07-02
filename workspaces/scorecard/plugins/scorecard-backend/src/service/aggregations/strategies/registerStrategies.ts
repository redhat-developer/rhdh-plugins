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
  aggregationTypes,
  type AggregationType,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import type { AggregationStrategy } from './types';
import { StatusGroupedAggregationStrategy } from './StatusGroupedAggregationStrategy';
import { WeightedStatusScoreAggregationStrategy } from './WeightedStatusScoreAggregationStrategy';
import { ValueAggregationStrategy } from './ValueAggregationStrategy';
import { LoggerService } from '@backstage/backend-plugin-api';

export function createAggregationStrategyRegistry(
  loader: AggregatedMetricLoader,
  logger: LoggerService,
): Map<AggregationType, AggregationStrategy> {
  return new Map<AggregationType, AggregationStrategy>([
    [
      aggregationTypes.statusGrouped,
      new StatusGroupedAggregationStrategy(loader),
    ],
    [
      aggregationTypes.weightedStatusScore,
      new WeightedStatusScoreAggregationStrategy(loader, logger),
    ],
    [
      aggregationTypes.sum,
      new ValueAggregationStrategy(loader, aggregationTypes.sum),
    ],
    [
      aggregationTypes.average,
      new ValueAggregationStrategy(loader, aggregationTypes.average),
    ],
    [
      aggregationTypes.max,
      new ValueAggregationStrategy(loader, aggregationTypes.max),
    ],
    [
      aggregationTypes.min,
      new ValueAggregationStrategy(loader, aggregationTypes.min),
    ],
    [
      aggregationTypes.count,
      new ValueAggregationStrategy(loader, aggregationTypes.count),
    ],
  ]);
}
