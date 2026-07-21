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

export function getAggregateExpression(
  aggregationFn: ScalarAggregationFn,
  numericValueExpr: string,
): string {
  switch (aggregationFn) {
    case 'count':
      return 'COUNT(*)';
    case 'sum':
      return `SUM(${numericValueExpr})`;
    case 'average':
      return `AVG(${numericValueExpr})`;
    case 'max':
      return `MAX(${numericValueExpr})`;
    case 'min':
      return `MIN(${numericValueExpr})`;
    default:
      throw new Error(`Invalid aggregation function: ${aggregationFn}`);
  }
}
