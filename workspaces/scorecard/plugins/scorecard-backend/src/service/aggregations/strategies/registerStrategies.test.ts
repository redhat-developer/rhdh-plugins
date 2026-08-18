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
import {
  aggregationTypes,
  scalarAggregationTypes,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { createAggregationStrategyRegistry } from './registerStrategies';
import { StatusGroupedAggregationStrategy } from './StatusGroupedAggregationStrategy';
import { WeightedStatusScoreAggregationStrategy } from './WeightedStatusScoreAggregationStrategy';
import { ScalarAggregationStrategy } from './ScalarAggregationStrategy';

jest.mock('./StatusGroupedAggregationStrategy');
jest.mock('./WeightedStatusScoreAggregationStrategy');
jest.mock('./ScalarAggregationStrategy');

describe('createAggregationStrategyRegistry', () => {
  const loader = {} as AggregatedMetricLoader;
  const logger = mockServices.logger.mock();
  let registry: ReturnType<typeof createAggregationStrategyRegistry>;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = createAggregationStrategyRegistry(loader, logger);
  });

  it('should register status grouped aggregation strategy with loader', () => {
    expect(StatusGroupedAggregationStrategy).toHaveBeenCalledWith(loader);
    expect(registry.get(aggregationTypes.statusGrouped)).toBeInstanceOf(
      StatusGroupedAggregationStrategy,
    );
  });

  it('should register weighted status score aggregation strategy with loader and logger', () => {
    expect(WeightedStatusScoreAggregationStrategy).toHaveBeenCalledWith(
      loader,
      logger,
    );
    expect(registry.get(aggregationTypes.weightedStatusScore)).toBeInstanceOf(
      WeightedStatusScoreAggregationStrategy,
    );
  });

  it.each(scalarAggregationTypes)(
    'should register %s scalar aggregation strategy with loader and type',
    type => {
      expect(ScalarAggregationStrategy).toHaveBeenCalledWith(loader, type);
      expect(registry.get(type)).toBeInstanceOf(ScalarAggregationStrategy);
    },
  );

  it('should register all aggregation strategies', () => {
    expect(registry.size).toBe(7);
  });
});
