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

import { mockServices } from '@backstage/backend-test-utils';
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { createAggregationStrategyRegistry } from './registerStrategies';
import { WeightedStatusScoreAggregationStrategy } from './WeightedStatusScoreAggregationStrategy';
import { StatusGroupedAggregationStrategy } from './StatusGroupedAggregationStrategy';
import { ValueAggregationStrategy } from './ValueAggregationStrategy';

describe('createAggregationStrategyRegistry', () => {
  it('should register all aggregation strategies', () => {
    const loader = {} as AggregatedMetricLoader;
    const logger = mockServices.logger.mock();

    const registry = createAggregationStrategyRegistry(loader, logger);

    expect(registry.get(aggregationTypes.statusGrouped)).toBeInstanceOf(
      StatusGroupedAggregationStrategy,
    );
    expect(registry.get(aggregationTypes.weightedStatusScore)).toBeInstanceOf(
      WeightedStatusScoreAggregationStrategy,
    );
    expect(registry.get(aggregationTypes.sum)).toBeInstanceOf(
      ValueAggregationStrategy,
    );
    expect(registry.get(aggregationTypes.average)).toBeInstanceOf(
      ValueAggregationStrategy,
    );
    expect(registry.get(aggregationTypes.max)).toBeInstanceOf(
      ValueAggregationStrategy,
    );
    expect(registry.get(aggregationTypes.min)).toBeInstanceOf(
      ValueAggregationStrategy,
    );
    expect(registry.get(aggregationTypes.count)).toBeInstanceOf(
      ValueAggregationStrategy,
    );
    expect(registry.get(aggregationTypes.sum)).not.toBe(
      registry.get(aggregationTypes.average),
    );
    expect(registry.get(aggregationTypes.sum)).not.toBe(
      registry.get(aggregationTypes.max),
    );
    expect(registry.get(aggregationTypes.average)).not.toBe(
      registry.get(aggregationTypes.min),
    );
    expect(registry.size).toBe(7);
  });
});
