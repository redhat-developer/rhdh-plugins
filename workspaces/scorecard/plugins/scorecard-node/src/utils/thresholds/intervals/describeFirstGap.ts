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

export function describeFirstGap(merged: NumberInterval[]): string {
  if (merged.length === 0) {
    return 'the entire real line (no rules)';
  }

  const first = merged[0]!;
  if (first.min > -Infinity) {
    const rightBound = formatReal(first.min);
    return first.minClosed ? `(-∞, ${rightBound})` : `(-∞, ${rightBound}]`;
  }

  for (let i = 0; i < merged.length - 1; i++) {
    const left = merged[i]!;
    const right = merged[i + 1]!;

    const gapLeft = left.max;
    const gapRight = right.min;

    const nonEmptyGap =
      gapLeft < gapRight ||
      (gapLeft === gapRight && !(left.maxClosed || right.minClosed));

    if (nonEmptyGap) {
      const l = left.maxClosed ? '(' : '[';
      const r = right.minClosed ? ')' : ']';
      return `${l}${formatReal(gapLeft)}, ${formatReal(gapRight)}${r}`;
    }
  }

  const last = merged[merged.length - 1]!;

  if (last.max < Infinity) {
    const l = last.maxClosed ? '(' : '[';
    return `${l}${formatReal(last.max)}, ∞)`;
  }

  return 'unknown gap';
}

function formatReal(x: number): string {
  if (x === -Infinity) {
    return '-∞';
  }
  if (x === Infinity) {
    return '∞';
  }

  return String(x);
}
