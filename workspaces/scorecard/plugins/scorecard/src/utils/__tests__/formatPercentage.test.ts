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

import { formatPercentage } from '../formatPercentage';

describe('formatPercentage', () => {
  it('formats whole numbers without a decimal part', () => {
    expect(formatPercentage(100)).toBe('100');
    expect(formatPercentage(50)).toBe('50');
    expect(formatPercentage(0)).toBe('0');
  });

  it('keeps a single decimal place when needed', () => {
    expect(formatPercentage(33.3)).toBe('33.3');
    expect(formatPercentage(12.5)).toBe('12.5');
  });

  it('strips trailing .0 from one-decimal whole values', () => {
    expect(formatPercentage(10.0)).toBe('10');
  });
});
