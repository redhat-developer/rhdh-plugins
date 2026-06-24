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

import { scalarAggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  mockFallbackStatusGroupedAggregationConfig,
  mockScalarAggregationConfig,
  mockStatusGroupedAggregationConfig,
  mockWeightedStatusScoreAggregationConfig,
} from '../../../../__fixtures__/mockAggregationConfig';
import {
  isScalarAggregationRuntimeConfig,
  isValidatedAggregationConfig,
} from './aggregationRuntimeConfig';

describe('aggregationRuntimeConfig', () => {
  describe('isValidatedAggregationConfig', () => {
    it('should return true for validated aggregation configs', () => {
      expect(
        isValidatedAggregationConfig(mockStatusGroupedAggregationConfig()),
      ).toBe(true);
      expect(isValidatedAggregationConfig(mockScalarAggregationConfig())).toBe(
        true,
      );
      expect(
        isValidatedAggregationConfig(
          mockWeightedStatusScoreAggregationConfig(),
        ),
      ).toBe(true);
    });

    it('should return false for fallback statusGrouped configs', () => {
      expect(
        isValidatedAggregationConfig(
          mockFallbackStatusGroupedAggregationConfig(),
        ),
      ).toBe(false);
    });
  });

  describe('isScalarAggregationRuntimeConfig', () => {
    it.each(scalarAggregationTypes)(
      'should return true for validated scalar type %s',
      type => {
        expect(
          isScalarAggregationRuntimeConfig(mockScalarAggregationConfig(type)),
        ).toBe(true);
      },
    );

    it('should return false for statusGrouped configs', () => {
      expect(
        isScalarAggregationRuntimeConfig(mockStatusGroupedAggregationConfig()),
      ).toBe(false);
    });

    it('should return false for weightedStatusScore configs', () => {
      expect(
        isScalarAggregationRuntimeConfig(
          mockWeightedStatusScoreAggregationConfig(),
        ),
      ).toBe(false);
    });

    it('should return false for fallback statusGrouped configs', () => {
      expect(
        isScalarAggregationRuntimeConfig(
          mockFallbackStatusGroupedAggregationConfig(),
        ),
      ).toBe(false);
    });
  });
});
