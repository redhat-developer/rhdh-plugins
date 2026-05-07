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

import { NumberInterval } from './types';
import { getUnionInterval } from './getUnionInterval';
import { hasGapBetweenIntervals } from './hasGapBetweenIntervals';

export function mergeNumberIntervals(
  intervals: NumberInterval[],
): NumberInterval[] {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = [...intervals].sort(compareIntervalSort);

  const merged: NumberInterval[] = [{ ...sorted[0]! }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const previous = merged[merged.length - 1]!;

    if (hasGapBetweenIntervals(previous, current)) {
      merged.push({ ...current });
    } else {
      merged[merged.length - 1] = getUnionInterval(previous, current);
    }
  }

  return merged;
}

function compareIntervalSort(a: NumberInterval, b: NumberInterval): number {
  if (a.min !== b.min) {
    return a.min < b.min ? -1 : 1;
  }
  if (a.minClosed !== b.minClosed) {
    return a.minClosed ? -1 : 1;
  }
  if (a.max !== b.max) {
    return a.max > b.max ? -1 : 1;
  }
  if (a.maxClosed !== b.maxClosed) {
    return a.maxClosed ? -1 : 1;
  }
  return 0;
}
