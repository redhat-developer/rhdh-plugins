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

import { calculateRatio } from './calculateRatio';

describe('calculateRatio', () => {
  it('should return 100 when no pipelines exist', () => {
    expect(calculateRatio(0, 0)).toBe(100);
  });

  it('should calculate correct ratio', () => {
    expect(calculateRatio(80, 20)).toBe(80);
    expect(calculateRatio(9, 1)).toBe(90);
    expect(calculateRatio(0, 10)).toBe(0);
    expect(calculateRatio(10, 0)).toBe(100);
  });

  it('should round to nearest integer', () => {
    expect(calculateRatio(1, 2)).toBe(33);
    expect(calculateRatio(2, 1)).toBe(67);
  });
});
