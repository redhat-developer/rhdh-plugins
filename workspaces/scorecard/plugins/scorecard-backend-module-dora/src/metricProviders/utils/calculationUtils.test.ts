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

import { calculateMedian } from './calculationUtils';

describe('calculateMedian', () => {
  it('returns median for odd number of values', () => {
    expect(calculateMedian([9, 3, 6])).toBe(6);
  });

  it('returns median for even number of values', () => {
    expect(calculateMedian([10, 2, 4, 8])).toBe(6);
  });

  it('returns the same value for single-element input', () => {
    expect(calculateMedian([7])).toBe(7);
  });

  it('throws on empty values', () => {
    expect(() => calculateMedian([])).toThrow(
      'Unable to calculate median from empty values',
    );
  });
});
