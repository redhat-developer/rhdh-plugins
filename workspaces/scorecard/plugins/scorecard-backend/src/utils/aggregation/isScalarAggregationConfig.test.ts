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
  scalarAggregationTypes,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  mockScalarAggregationConfig,
  mockStatusGroupedAggregationConfig,
  mockWeightedStatusScoreAggregationConfig,
} from '../../../__fixtures__/mockAggregationConfig';
import { isScalarAggregationConfig } from './isScalarAggregationConfig';

describe('isScalarAggregationConfig', () => {
  it.each(scalarAggregationTypes)(
    'should return true for scalar %s aggregation config',
    type => {
      expect(isScalarAggregationConfig(mockScalarAggregationConfig(type))).toBe(
        true,
      );
    },
  );

  it('should return false for statusGrouped aggregation config', () => {
    expect(
      isScalarAggregationConfig(mockStatusGroupedAggregationConfig()),
    ).toBe(false);
  });

  it('should return false for weightedStatusScore aggregation config', () => {
    expect(
      isScalarAggregationConfig(mockWeightedStatusScoreAggregationConfig()),
    ).toBe(false);
  });

  it('should return false when type is statusGrouped even if id looks scalar', () => {
    expect(
      isScalarAggregationConfig(
        mockStatusGroupedAggregationConfig({
          id: 'totalOpenPrs',
          type: aggregationTypes.statusGrouped,
        }),
      ),
    ).toBe(false);
  });
});
