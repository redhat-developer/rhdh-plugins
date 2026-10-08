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
  formatNumericMetricValue,
  formatWithMetricUnit,
} from '../formatMetricUnit';

describe('formatNumericMetricValue', () => {
  it('rounds IEEE-754 noise to four decimal places', () => {
    expect(formatNumericMetricValue(0.46670000000000006)).toBe('0.4667');
  });

  it('keeps integers without trailing zeros', () => {
    expect(formatNumericMetricValue(5)).toBe('5');
  });

  it('keeps a zero value', () => {
    expect(formatNumericMetricValue(0)).toBe('0');
  });

  it('stringifies non-finite numbers', () => {
    expect(formatNumericMetricValue(Number.NaN)).toBe('NaN');
  });
});

describe('formatWithMetricUnit', () => {
  it('returns the value unchanged when unit is undefined', () => {
    expect(formatWithMetricUnit('<24')).toBe('<24');
  });

  it('adds a space before alphabetic units', () => {
    expect(formatWithMetricUnit('<24', 'h')).toBe('<24 h');
  });

  it('appends percent without a space', () => {
    expect(formatWithMetricUnit('<5', '%')).toBe('<5%');
  });

  it('appends slash units without a space', () => {
    expect(formatWithMetricUnit('>=7', '/week')).toBe('>=7/week');
  });
});
