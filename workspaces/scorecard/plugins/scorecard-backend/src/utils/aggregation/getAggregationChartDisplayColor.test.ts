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

import { ScorecardThresholdRuleColors } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdEvaluator } from '../../threshold/ThresholdEvaluator';
import { getRequiredAggregationChartDisplayColor } from './getAggregationChartDisplayColor';

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

describe('getRequiredAggregationChartDisplayColor', () => {
  const evaluator = new ThresholdEvaluator();

  it('should throw the given error when no color matches', () => {
    expect(() =>
      getRequiredAggregationChartDisplayColor(
        50,
        { rules: [{ key: 'success', expression: '<10', color: 'green' }] },
        evaluator,
        'color is not configured',
      ),
    ).toThrow('color is not configured');
  });

  it('should return the matching color', () => {
    expect(
      getRequiredAggregationChartDisplayColor(
        12,
        overlappingThresholds,
        evaluator,
        'color is not configured',
      ),
    ).toBe('yellow');
  });

  it('should return the standard default color when the matching rule omits color', () => {
    expect(
      getRequiredAggregationChartDisplayColor(
        5,
        { rules: [{ key: 'success', expression: '<10' }] },
        evaluator,
        'color is not configured',
      ),
    ).toBe(ScorecardThresholdRuleColors.SUCCESS);
  });
});
