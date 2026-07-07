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
import { formatTotalTimeSaved } from './formatTimeSaved';

describe('formatTotalTimeSaved', () => {
  it('returns dash when annotation is undefined', () => {
    expect(formatTotalTimeSaved(undefined, 5)).toBe('—');
  });

  it('returns dash when annotation is empty string', () => {
    expect(formatTotalTimeSaved('', 5)).toBe('—');
  });

  it('returns dash when annotation is non-numeric', () => {
    expect(formatTotalTimeSaved('abc', 5)).toBe('—');
  });

  it('returns dash when annotation is zero', () => {
    expect(formatTotalTimeSaved('0', 5)).toBe('—');
  });

  it('returns dash when annotation is negative', () => {
    expect(formatTotalTimeSaved('-10', 5)).toBe('—');
  });

  it('returns minutes when total is under 60', () => {
    expect(formatTotalTimeSaved('10', 3)).toBe('30min');
  });

  it('returns whole hours', () => {
    expect(formatTotalTimeSaved('60', 2)).toBe('2hrs');
    expect(formatTotalTimeSaved('180', 1)).toBe('3hrs');
  });

  it('returns fractional hours', () => {
    expect(formatTotalTimeSaved('30', 3)).toBe('1.5hrs');
    expect(formatTotalTimeSaved('90', 3)).toBe('4.5hrs');
  });

  it('handles count of zero', () => {
    expect(formatTotalTimeSaved('180', 0)).toBe('—');
  });

  it('handles large values', () => {
    expect(formatTotalTimeSaved('60', 100)).toBe('100hrs');
  });
});
