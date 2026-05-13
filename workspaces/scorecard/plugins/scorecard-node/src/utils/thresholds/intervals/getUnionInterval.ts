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

export function getUnionInterval(
  left: NumberInterval,
  right: NumberInterval,
): NumberInterval {
  const lowestInterval = getLowestInterval(left, right);
  const highestInterval = getHighestInterval(left, right);

  return { ...lowestInterval, ...highestInterval };
}

function getLowestInterval(left: NumberInterval, right: NumberInterval) {
  if (left.min < right.min) {
    return { min: left.min, minClosed: left.minClosed };
  }
  if (right.min < left.min) {
    return { min: right.min, minClosed: right.minClosed };
  }
  return { min: left.min, minClosed: left.minClosed || right.minClosed };
}

function getHighestInterval(left: NumberInterval, right: NumberInterval) {
  if (left.max > right.max) {
    return { max: left.max, maxClosed: left.maxClosed };
  }
  if (right.max > left.max) {
    return { max: right.max, maxClosed: right.maxClosed };
  }
  return { max: left.max, maxClosed: left.maxClosed || right.maxClosed };
}
