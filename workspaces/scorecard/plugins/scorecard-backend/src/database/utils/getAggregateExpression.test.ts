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

import { getAggregateExpression } from './getAggregateExpression';

describe('getAggregateExpression', () => {
  const numericValueExpr = 'CAST(value AS REAL)';

  it.each([
    ['sum', `SUM(${numericValueExpr})`],
    ['average', `AVG(${numericValueExpr})`],
    ['max', `MAX(${numericValueExpr})`],
    ['min', `MIN(${numericValueExpr})`],
    ['count', 'COUNT(*)'],
  ] as const)('should map %s to SQL expression', (aggregationFn, expected) => {
    expect(getAggregateExpression(aggregationFn, numericValueExpr)).toBe(
      expected,
    );
  });

  it('should throw for invalid aggregation function', () => {
    expect(() =>
      getAggregateExpression('invalid' as 'sum', numericValueExpr),
    ).toThrow('Invalid aggregation function: invalid');
  });
});
