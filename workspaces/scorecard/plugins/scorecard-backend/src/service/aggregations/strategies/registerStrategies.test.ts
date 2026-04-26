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
import { aggregationKinds } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { createAggregationStrategyRegistry } from './registerStrategies';
import { AverageAggregationStrategy } from './AverageAggregationStrategy';
import { StatusGroupedAggregationStrategy } from './StatusGroupedAggregationStrategy';

describe('createAggregationStrategyRegistry', () => {
  it('registers statusGrouped and average strategies', () => {
    const loader = {} as AggregatedMetricLoader;
    const logger = mockServices.logger.mock();

    const registry = createAggregationStrategyRegistry(loader, logger);

    expect(registry.get(aggregationKinds.statusGrouped)).toBeInstanceOf(
      StatusGroupedAggregationStrategy,
    );
    expect(registry.get(aggregationKinds.average)).toBeInstanceOf(
      AverageAggregationStrategy,
    );
    expect(registry.size).toBe(2);
  });
});
