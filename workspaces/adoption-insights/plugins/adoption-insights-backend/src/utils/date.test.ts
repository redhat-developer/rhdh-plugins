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
  calculateDateRange,
  convertToTargetTimezone,
  getDateGroupingType,
  isSameMonth,
  toEndOfDayUTC,
  toStartOfDayUTC,
} from './date';

describe('toStartOfDayUTC', () => {
  it('should return start of the day in UTC', () => {
    const startOfTheDay = toStartOfDayUTC('2025-03-02');
    expect(startOfTheDay).toBe('2025-03-02T00:00:00.000Z');
  });
});
describe('toEndOfDayUTC', () => {
  it('should return end of the day in UTC', () => {
    const startOfTheDay = toEndOfDayUTC('2025-03-02');
    expect(startOfTheDay).toBe('2025-03-02T23:59:59.999Z');
  });
});

describe('calculateDateRange', () => {
  it('should return the correct number of days between two dates', () => {
    expect(calculateDateRange('2024-03-01', '2024-03-10')).toBe(9);
    expect(calculateDateRange('2024-01-01', '2024-12-31')).toBe(365);
  });

  it('should return 0 if the dates are the same', () => {
    expect(calculateDateRange('2024-03-01', '2024-03-01')).toBe(0);
  });

  it('should return a negative value if start_date is after end_date', () => {
    expect(calculateDateRange('2024-03-10', '2024-03-01')).toBe(-9);
  });
});

describe('isSameMonth', () => {
  it('should return true if the dates are in the same month', () => {
    expect(isSameMonth('2024-03-01', '2024-03-31')).toBe(true);
  });

  it('should return false if the dates are in different months', () => {
    expect(isSameMonth('2024-03-01', '2024-04-01')).toBe(false);
  });

  it('should return true for the same date', () => {
    expect(isSameMonth('2024-03-15', '2024-03-15')).toBe(true);
  });
});

describe('getDateGroupingType', () => {
  it('should return "hourly" if dateDiff is 0', () => {
    expect(getDateGroupingType(0)).toBe('hourly');
  });

  it('should return "daily" if dateDiff is 7 or less', () => {
    expect(getDateGroupingType(3)).toBe('daily');
    expect(getDateGroupingType(7)).toBe('daily');
  });

  it('should return "weekly" if dateDiff is between 8 and 30, and in the same month', () => {
    expect(getDateGroupingType(14)).toBe('weekly');
    expect(getDateGroupingType(28)).toBe('weekly');
  });

  it('should return "monthly" if dateDiff is greater than 30 or in different months', () => {
    expect(getDateGroupingType(31)).toBe('monthly');
  });
});

describe('convertToTargetTimezone', () => {
  it('should return the date time converted to local timestamp', () => {
    jest
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({
        timeZone: 'Asia/Kolkata',
      } as Intl.ResolvedDateTimeFormatOptions);

    expect(convertToTargetTimezone('2025-03-02 23:30:00')).toBe(
      '2025-03-03T05:00:00.000+05:30',
    );
  });
  it('should return the UTC date converted to local timezone', () => {
    jest
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({
        timeZone: 'Asia/Kolkata',
      } as Intl.ResolvedDateTimeFormatOptions);

    expect(convertToTargetTimezone('2025-03-02T18:00:00.000Z')).toBe(
      '2025-03-02T23:30:00.000+05:30',
    );
  });
});
