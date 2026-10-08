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

import { DEFAULT_NUMBER_THRESHOLDS } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import {
  getMatchingThresholdKey,
  matchesThresholdExpression,
} from '../matchThresholdRule';

describe('matchesThresholdExpression', () => {
  it.each([
    ['<10', 9, true],
    ['<10', 10, false],
    ['<=10', 10, true],
    ['>50', 51, true],
    ['>50', 50, false],
    ['>=80', 80, true],
    ['==5', 5, true],
    ['==5', 6, false],
    ['!=5', 6, true],
    ['10-50', 10, true],
    ['10-50', 50, true],
    ['10-50', 9, false],
    ['10-50', 51, false],
  ])('evaluates %s against %s as %s', (expression, value, expected) => {
    expect(matchesThresholdExpression(value, expression)).toBe(expected);
  });

  it('returns false for invalid expressions', () => {
    expect(matchesThresholdExpression(10, 'not-a-rule')).toBe(false);
    expect(matchesThresholdExpression(10, '')).toBe(false);
  });

  it('returns false for non-finite values', () => {
    expect(matchesThresholdExpression(Number.NaN, '<10')).toBe(false);
  });
});

describe('getMatchingThresholdKey', () => {
  it('returns the first matching rule key', () => {
    expect(getMatchingThresholdKey(5, DEFAULT_NUMBER_THRESHOLDS)).toBe(
      'success',
    );
    expect(getMatchingThresholdKey(25, DEFAULT_NUMBER_THRESHOLDS)).toBe(
      'warning',
    );
    expect(getMatchingThresholdKey(80, DEFAULT_NUMBER_THRESHOLDS)).toBe(
      'error',
    );
  });

  it('returns undefined when no rule matches or thresholds are missing', () => {
    expect(
      getMatchingThresholdKey(10, {
        rules: [{ key: 'ok', expression: '>99' }],
      }),
    ).toBeUndefined();
    expect(getMatchingThresholdKey(10)).toBeUndefined();
    expect(getMatchingThresholdKey(10, { rules: [] })).toBeUndefined();
  });
});
