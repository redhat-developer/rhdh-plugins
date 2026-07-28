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

import { formatCompactCount } from './formatCompactCount';

describe('formatCompactCount', () => {
  it('returns the count as-is below one thousand', () => {
    expect(formatCompactCount(0)).toBe('0');
    expect(formatCompactCount(11)).toBe('11');
    expect(formatCompactCount(453)).toBe('453');
    expect(formatCompactCount(999)).toBe('999');
  });

  it('formats thousands with one decimal place', () => {
    expect(formatCompactCount(1200)).toBe('1.2 k');
    expect(formatCompactCount(5300)).toBe('5.3 k');
  });

  it('rounds large thousands without a decimal', () => {
    expect(formatCompactCount(10000)).toBe('10 k');
    expect(formatCompactCount(15300)).toBe('15 k');
  });
});
