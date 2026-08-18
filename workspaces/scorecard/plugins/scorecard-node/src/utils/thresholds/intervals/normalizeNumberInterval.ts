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

import { ComparisonSign } from '../..';
import { NumberInterval } from './types';
import { ThresholdConfigFormatError } from '../../../errors';

export function normalizeNumberInterval(
  value: number,
  operator: ComparisonSign,
): NumberInterval[] {
  switch (operator) {
    case '>=':
      return [{ min: value, max: Infinity, minClosed: true, maxClosed: true }];
    case '>':
      return [{ min: value, max: Infinity, minClosed: false, maxClosed: true }];
    case '<=':
      return [{ min: -Infinity, max: value, minClosed: true, maxClosed: true }];
    case '<':
      return [
        { min: -Infinity, max: value, minClosed: true, maxClosed: false },
      ];
    case '==':
      return [{ min: value, max: value, minClosed: true, maxClosed: true }];
    case '!=':
      return [
        { min: -Infinity, max: value, minClosed: true, maxClosed: false },
        { min: value, max: Infinity, minClosed: false, maxClosed: true },
      ];
    default: {
      throw new ThresholdConfigFormatError(`Invalid operator: ${operator}`);
    }
  }
}
