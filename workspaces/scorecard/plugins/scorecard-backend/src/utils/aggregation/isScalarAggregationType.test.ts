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
import { isScalarAggregationType } from './isScalarAggregationType';

describe('isScalarAggregationType', () => {
  it.each(scalarAggregationTypes)(
    'should return true for scalar aggregation type %s',
    type => {
      expect(isScalarAggregationType(type)).toBe(true);
    },
  );

  it.each([
    aggregationTypes.statusGrouped,
    aggregationTypes.weightedStatusScore,
  ])('should return false for non-scalar aggregation type %s', type => {
    expect(isScalarAggregationType(type)).toBe(false);
  });
});
