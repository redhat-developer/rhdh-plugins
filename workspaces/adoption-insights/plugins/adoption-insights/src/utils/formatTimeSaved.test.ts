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
import {
  computeTotalTimeSaved,
  formatTimeSavedCompact,
  TranslateFunction,
} from './formatTimeSaved';

describe('computeTotalTimeSaved', () => {
  it('returns null when annotation is undefined', () => {
    expect(computeTotalTimeSaved(undefined, 5)).toBeNull();
  });

  it('returns null when annotation is empty string', () => {
    expect(computeTotalTimeSaved('', 5)).toBeNull();
  });

  it('returns null when annotation is non-numeric', () => {
    expect(computeTotalTimeSaved('abc', 5)).toBeNull();
  });

  it('returns null when annotation is zero', () => {
    expect(computeTotalTimeSaved('0', 5)).toBeNull();
  });

  it('returns null when annotation is negative', () => {
    expect(computeTotalTimeSaved('-10', 5)).toBeNull();
  });

  it('returns null when count is zero', () => {
    expect(computeTotalTimeSaved('180', 0)).toBeNull();
  });

  it('returns minutes only when total is under 60', () => {
    expect(computeTotalTimeSaved('10', 3)).toEqual({
      days: 0,
      hours: 0,
      minutes: 30,
    });
  });

  it('returns hours only when total is exact hours under 24', () => {
    expect(computeTotalTimeSaved('60', 2)).toEqual({
      days: 0,
      hours: 2,
      minutes: 0,
    });
  });

  it('returns hours and minutes', () => {
    expect(computeTotalTimeSaved('90', 1)).toEqual({
      days: 0,
      hours: 1,
      minutes: 30,
    });
  });

  it('returns days and hours when over 24 hours', () => {
    expect(computeTotalTimeSaved('60', 28)).toEqual({
      days: 1,
      hours: 4,
      minutes: 0,
    });
  });

  it('returns days hours and minutes', () => {
    expect(computeTotalTimeSaved('90', 17)).toEqual({
      days: 1,
      hours: 1,
      minutes: 30,
    });
  });

  it('returns only days when exact multiple of 24 hours', () => {
    expect(computeTotalTimeSaved('60', 48)).toEqual({
      days: 2,
      hours: 0,
      minutes: 0,
    });
  });
});

describe('formatTimeSavedCompact', () => {
  it('returns em dash for null result', () => {
    expect(formatTimeSavedCompact(null)).toBe('—');
  });

  it('returns em dash for all-zero result', () => {
    expect(formatTimeSavedCompact({ days: 0, hours: 0, minutes: 0 })).toBe('—');
  });

  it('formats minutes only', () => {
    expect(formatTimeSavedCompact({ days: 0, hours: 0, minutes: 30 })).toBe(
      '30m',
    );
  });

  it('formats hours only', () => {
    expect(formatTimeSavedCompact({ days: 0, hours: 3, minutes: 0 })).toBe(
      '3h',
    );
  });

  it('formats hours and minutes', () => {
    expect(formatTimeSavedCompact({ days: 0, hours: 1, minutes: 30 })).toBe(
      '1h 30m',
    );
  });

  it('formats days and hours', () => {
    expect(formatTimeSavedCompact({ days: 1, hours: 6, minutes: 0 })).toBe(
      '1d 6h',
    );
  });

  it('suppresses minutes when days are present', () => {
    expect(formatTimeSavedCompact({ days: 2, hours: 3, minutes: 15 })).toBe(
      '2d 3h',
    );
  });

  it('formats days only', () => {
    expect(formatTimeSavedCompact({ days: 5, hours: 0, minutes: 0 })).toBe(
      '5d',
    );
  });

  it('uses translation function when provided', () => {
    const t: TranslateFunction = (key, opts) => {
      const labels: Record<string, string> = {
        'units.days': `${opts.value} 日`,
        'units.hours': `${opts.value} 時間`,
        'units.minutes': `${opts.value} 分`,
      };
      return labels[key] ?? key;
    };

    expect(formatTimeSavedCompact({ days: 1, hours: 6, minutes: 0 }, t)).toBe(
      '1 日 6 時間',
    );
  });

  it('falls back to English when no translation function', () => {
    expect(
      formatTimeSavedCompact({ days: 1, hours: 6, minutes: 0 }, undefined),
    ).toBe('1d 6h');
  });
});
