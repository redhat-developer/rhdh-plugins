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

import { InputError } from '@backstage/errors';
import {
  aggregationTypes,
  scalarAggregationTypes,
  ScorecardThresholdRuleColors,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { parseValidatedAggregationConfig } from './parseValidatedAggregationConfig';
import {
  mockScalarAggregationConfig,
  mockStatusGroupedAggregationConfig,
  mockWeightedStatusScoreAggregationConfig,
} from '../../../__fixtures__/mockAggregationConfig';

describe('parseValidatedAggregationConfig', () => {
  it('should return validated statusGrouped config', () => {
    const config = mockStatusGroupedAggregationConfig({
      id: 'openPrsKpi',
      title: 'GitHub PRs',
      description: 'Open pull requests',
      metricId: 'github.open_prs',
    });

    expect(parseValidatedAggregationConfig(config)).toEqual(config);
  });

  it.each(scalarAggregationTypes)(
    'should return validated scalar %s config without options',
    type => {
      const config = mockScalarAggregationConfig(type, {
        id: 'scalarKpi',
        title: 'Scalar KPI',
        description: 'Scalar aggregation',
        metricId: 'github.open_prs',
        options: undefined,
      });

      expect(parseValidatedAggregationConfig(config)).toEqual(config);
    },
  );

  it('should return validated weightedStatusScore config', () => {
    const config = mockWeightedStatusScoreAggregationConfig({
      id: 'weightedKpi',
      metricId: 'github.open_prs',
    });

    expect(parseValidatedAggregationConfig(config)).toEqual(config);
  });

  it('should throw InputError when config fails schema validation', () => {
    const tooLongTitle = 'a'.repeat(256);

    expect(() =>
      parseValidatedAggregationConfig(
        mockStatusGroupedAggregationConfig({ title: tooLongTitle }),
      ),
    ).toThrow(InputError);
  });

  it('should throw when scalar KPI thresholds leave a gap on the real line', () => {
    expect(() =>
      parseValidatedAggregationConfig(
        mockScalarAggregationConfig(aggregationTypes.sum, {
          options: {
            thresholds: {
              rules: [
                {
                  key: 'success',
                  expression: '<10',
                  color: ScorecardThresholdRuleColors.SUCCESS,
                },
                {
                  key: 'error',
                  expression: '>20',
                  color: ScorecardThresholdRuleColors.ERROR,
                },
              ],
            },
          },
        }),
      ),
    ).toThrow(/do not cover the entire real line/);
  });

  it('should accept valid scalar KPI thresholds', () => {
    const config = mockScalarAggregationConfig(aggregationTypes.sum, {
      options: {
        thresholds: {
          rules: [
            {
              key: 'success',
              expression: '>=75',
              color: ScorecardThresholdRuleColors.SUCCESS,
            },
            {
              key: 'warning',
              expression: '10-75',
              color: ScorecardThresholdRuleColors.WARNING,
            },
            {
              key: 'error',
              expression: '<10',
              color: ScorecardThresholdRuleColors.ERROR,
            },
          ],
        },
      },
    });

    expect(parseValidatedAggregationConfig(config)).toEqual(config);
  });
});
