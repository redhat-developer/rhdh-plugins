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

import { ScalarAggregationFn } from '../types';

/**
 * Builds a SQL aggregate expression for a scalar function.
 *
 * @param aggregationFn - Scalar function (`sum`, `average`, `max`, `min`, `count`)
 * @param numericValueExpr - SQL expression for the numeric metric value
 * @param rowIncludedExpr - Optional SQL boolean; only matching rows are included
 */
export function getAggregateExpression(
  aggregationFn: ScalarAggregationFn,
  numericValueExpr: string,
  rowIncludedExpr?: string,
): string {
  const valueExpr = rowIncludedExpr
    ? `CASE WHEN ${rowIncludedExpr} THEN ${numericValueExpr} END`
    : numericValueExpr;

  switch (aggregationFn) {
    case 'count':
      return rowIncludedExpr
        ? `COUNT(CASE WHEN ${rowIncludedExpr} THEN 1 END)`
        : 'COUNT(*)';
    case 'sum':
      return `SUM(${valueExpr})`;
    case 'average':
      return `AVG(${valueExpr})`;
    case 'max':
      return `MAX(${valueExpr})`;
    case 'min':
      return `MIN(${valueExpr})`;
    default:
      throw new Error(`Invalid aggregation function: ${aggregationFn}`);
  }
}
