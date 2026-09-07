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
  getAggregationChartDisplayColor,
  getRequiredAggregationChartDisplayColor,
} from './getAggregationChartDisplayColor';

const overlappingThresholds = {
  rules: [
    {
      key: 'error',
      expression: '>50',
      color: 'red',
    },
    {
      key: 'warning',
      expression: '12-50',
      color: 'yellow',
    },
    {
      key: 'success',
      expression: '<13',
      color: 'green',
    },
  ],
};

describe('getAggregationChartDisplayColor', () => {
  it('should return undefined when no rule matches', () => {
    expect(
      getAggregationChartDisplayColor(50, {
        rules: [{ key: 'success', expression: '<10', color: 'green' }],
      }),
    ).toBeUndefined();
  });

  it('should return undefined when the matching rule has no color', () => {
    expect(
      getAggregationChartDisplayColor(5, {
        rules: [{ key: 'success', expression: '<10' }],
      }),
    ).toBeUndefined();
  });

  it('should return the color of the first matching rule', () => {
    expect(getAggregationChartDisplayColor(12, overlappingThresholds)).toBe(
      'yellow',
    );
  });

  it('should follow rule order when multiple expressions match', () => {
    expect(
      getAggregationChartDisplayColor(12, {
        rules: [...overlappingThresholds.rules].reverse(),
      }),
    ).toBe('green');
  });
});

describe('getRequiredAggregationChartDisplayColor', () => {
  it('should throw the given error when no color matches', () => {
    expect(() =>
      getRequiredAggregationChartDisplayColor(
        50,
        { rules: [{ key: 'success', expression: '<10', color: 'green' }] },
        'color is not configured',
      ),
    ).toThrow('color is not configured');
  });

  it('should return the matching color', () => {
    expect(
      getRequiredAggregationChartDisplayColor(
        12,
        overlappingThresholds,
        'color is not configured',
      ),
    ).toBe('yellow');
  });
});
