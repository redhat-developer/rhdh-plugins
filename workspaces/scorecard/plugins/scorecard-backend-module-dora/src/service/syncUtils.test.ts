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

import { laterOf } from './syncUtils';

describe('laterOf', () => {
  const windowFrom = new Date('2026-06-01T00:00:00.000Z');

  it('returns windowFrom when watermark is undefined', () => {
    expect(laterOf(windowFrom, undefined)).toBe(windowFrom);
  });

  it('returns windowFrom when watermark is earlier', () => {
    const watermark = new Date('2026-05-01T00:00:00.000Z');
    expect(laterOf(windowFrom, watermark)).toBe(windowFrom);
  });

  it('returns watermark when it is later than windowFrom', () => {
    const watermark = new Date('2026-06-15T00:00:00.000Z');
    expect(laterOf(windowFrom, watermark)).toBe(watermark);
  });

  it('returns watermark when it equals windowFrom', () => {
    const watermark = new Date('2026-06-01T00:00:00.000Z');
    expect(laterOf(windowFrom, watermark)).toBe(watermark);
  });
});
