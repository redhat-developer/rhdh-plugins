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
  getDateRange,
  getXAxisTickValues,
  getXAxisformat,
  getLastUsedDay,
  getAverage,
  getTotal,
} from '../utils';
import {
  format,
  startOfToday,
  subDays,
  startOfYear,
  startOfWeek,
  startOfMonth,
} from 'date-fns';

describe('getDateRange', () => {
  it('should return correct range for today', () => {
    const today = format(startOfToday(), 'yyyy-MM-dd');
    expect(getDateRange('today')).toEqual({ startDate: today, endDate: today });
  });

  it('should return correct range for last-week', () => {
    const today = format(startOfToday(), 'yyyy-MM-dd');
    const lastWeek = format(startOfWeek(startOfToday()), 'yyyy-MM-dd');
    expect(getDateRange('last-week')).toEqual({
      startDate: lastWeek,
      endDate: today,
    });
  });

  it('should return correct range for last-month', () => {
    const today = format(startOfToday(), 'yyyy-MM-dd');
    const lastMonth = format(startOfMonth(startOfToday()), 'yyyy-MM-dd');
    expect(getDateRange('last-month')).toEqual({
      startDate: lastMonth,
      endDate: today,
    });
  });

  it('should return correct range for last-year', () => {
    const today = format(startOfToday(), 'yyyy-MM-dd');
    const lastYear = format(startOfYear(startOfToday()), 'yyyy-MM-dd');
    expect(getDateRange('last-year')).toEqual({
      startDate: lastYear,
      endDate: today,
    });
  });

  it('should return null for an invalid range', () => {
    expect(getDateRange('invalid')).toEqual({ startDate: null, endDate: null });
  });
});

describe('getXAxisTickValues', () => {
  it('should return empty array for undefined or empty data', () => {
    expect(getXAxisTickValues(undefined, 'daily')).toEqual([]);
    expect(getXAxisTickValues([], 'daily')).toEqual([]);
  });

  it('should return correct tick values for small datasets', () => {
    const data1 = [{ date: '2025-03-01' }];
    expect(getXAxisTickValues(data1, 'daily')).toEqual(['2025-03-01']);

    const data2 = [{ date: '2025-03-01' }, { date: '2025-03-02' }];
    expect(getXAxisTickValues(data2, 'daily')).toEqual([
      '2025-03-01',
      '2025-03-02',
    ]);
  });

  it('should return correct values for 4 dataset sizes for daily grouping', () => {
    const data = [
      { date: '2025-03-01' },
      { date: '2025-03-02' },
      { date: '2025-03-03' },
      { date: '2025-03-04' },
    ];
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-01');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-02');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-03');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-04');
  });

  it('should return correct values for 4 dataset sizes for weekly grouping', () => {
    const data = [
      { date: '2025-03-01' },
      { date: '2025-03-08' },
      { date: '2025-03-15' },
      { date: '2025-03-22' },
    ];
    expect(getXAxisTickValues(data, 'weekly')).toContain('2025-03-01');
    expect(getXAxisTickValues(data, 'weekly')).toContain('2025-03-08');
    expect(getXAxisTickValues(data, 'weekly')).toContain('2025-03-15');
    expect(getXAxisTickValues(data, 'weekly')).toContain('2025-03-22');
  });

  it('should return correct values for 5 dataset sizes for daily grouping', () => {
    const data = [
      { date: '2025-03-01' },
      { date: '2025-03-02' },
      { date: '2025-03-03' },
      { date: '2025-03-04' },
      { date: '2025-03-05' },
    ];
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-01');
    expect(getXAxisTickValues(data, 'daily')).not.toContain('2025-03-02');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-03');
    expect(getXAxisTickValues(data, 'daily')).not.toContain('2025-03-04');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-05');
  });

  it('should return correct values for 6 dataset sizes for daily grouping', () => {
    const data = [
      { date: '2025-03-01' },
      { date: '2025-03-02' },
      { date: '2025-03-03' },
      { date: '2025-03-04' },
      { date: '2025-03-05' },
      { date: '2025-03-06' },
    ];
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-01');
    expect(getXAxisTickValues(data, 'daily')).not.toContain('2025-03-02');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-03');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-04');
    expect(getXAxisTickValues(data, 'daily')).not.toContain('2025-03-05');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-06');
  });

  it('should return correct values for 9 dataset sizes for daily grouping', () => {
    const data = [
      { date: '2025-03-01' },
      { date: '2025-03-02' },
      { date: '2025-03-03' },
      { date: '2025-03-04' },
      { date: '2025-03-05' },
      { date: '2025-03-06' },
      { date: '2025-03-07' },
      { date: '2025-03-08' },
      { date: '2025-03-09' },
    ];
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-01');
    expect(getXAxisTickValues(data, 'daily')).not.toContain('2025-03-02');
    expect(getXAxisTickValues(data, 'daily')).not.toContain('2025-03-03');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-04');
    expect(getXAxisTickValues(data, 'daily')).not.toContain('2025-03-05');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-06');
    expect(getXAxisTickValues(data, 'daily')).not.toContain('2025-03-07');
    expect(getXAxisTickValues(data, 'daily')).not.toContain('2025-03-08');
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-09');
  });

  it('should return correct values for 4 dataset sizes for monthly grouping', () => {
    const data = [
      { date: '2025-01-01' },
      { date: '2025-02-01' },
      { date: '2025-03-01' },
      { date: '2025-04-01' },
    ];
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-01-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-02-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-03-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-04-01');
  });

  it('should return correct values for 6 dataset sizes for monthly grouping', () => {
    const data = [
      { date: '2025-01-01' },
      { date: '2025-02-01' },
      { date: '2025-03-01' },
      { date: '2025-04-01' },
      { date: '2025-05-01' },
      { date: '2025-06-01' },
    ];
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-01-01');
    expect(getXAxisTickValues(data, 'monthly')).not.toContain('2025-02-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-03-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-04-01');
    expect(getXAxisTickValues(data, 'monthly')).not.toContain('2025-05-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-06-01');
  });

  it('should return correct values for 9 dataset sizes for monthly grouping', () => {
    const data = [
      { date: '2025-01-01' },
      { date: '2025-02-01' },
      { date: '2025-03-01' },
      { date: '2025-04-01' },
      { date: '2025-05-01' },
      { date: '2025-06-01' },
      { date: '2025-07-01' },
      { date: '2025-08-01' },
      { date: '2025-09-01' },
    ];
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-01-01');
    expect(getXAxisTickValues(data, 'monthly')).not.toContain('2025-02-01');
    expect(getXAxisTickValues(data, 'monthly')).not.toContain('2025-03-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-04-01');
    expect(getXAxisTickValues(data, 'monthly')).not.toContain('2025-05-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-06-01');
    expect(getXAxisTickValues(data, 'monthly')).not.toContain('2025-07-01');
    expect(getXAxisTickValues(data, 'monthly')).not.toContain('2025-08-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-09-01');
  });

  it('should return correct values for 5 dataset sizes for monthly grouping', () => {
    const data = [
      { date: '2025-01-01' },
      { date: '2025-02-01' },
      { date: '2025-03-01' },
      { date: '2025-04-01' },
      { date: '2025-05-01' },
    ];
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-01-01');
    expect(getXAxisTickValues(data, 'monthly')).not.toContain('2025-02-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-03-01');
    expect(getXAxisTickValues(data, 'monthly')).not.toContain('2025-04-01');
    expect(getXAxisTickValues(data, 'monthly')).toContain('2025-05-01');
  });

  it('should return correct values for different dataset sizes', () => {
    const data = [
      { date: '2025-03-01' },
      { date: '2025-03-02' },
      { date: '2025-03-03' },
      { date: '2025-03-04' },
      { date: '2025-03-05' },
    ];
    expect(getXAxisTickValues(data, 'daily')).toContain('2025-03-03');
  });
});

describe('getXAxisformat', () => {
  it('should format daily dates correctly', () => {
    expect(getXAxisformat('2025-03-01', 'daily')).toMatch(
      /\d{1,2} March \d{2}/,
    );
  });

  it('should format weekly dates correctly', () => {
    expect(getXAxisformat('2025-03-02', 'daily')).toMatch(
      /\d{1,2} March \d{2}/,
    );
  });

  it('should format monthly dates correctly', () => {
    expect(getXAxisformat('2025-03-01', 'monthly')).toMatch(/Mar 2025/);
  });

  it('should return the same value for unknown grouping', () => {
    expect(getXAxisformat('2025-03-01', 'unknown')).toBe('2025-03-01');
  });
});

describe('getLastUsedDay', () => {
  it('should return "Today" for today', () => {
    expect(getLastUsedDay(new Date().toISOString())).toBe('Today');
  });

  it('should return "Yesterday" for yesterday', () => {
    expect(getLastUsedDay(subDays(new Date(), 1).toISOString())).toBe(
      'Yesterday',
    );
  });

  it('should return formatted date for older dates', () => {
    expect(getLastUsedDay('2024-02-15T00:00:00Z')).toMatch(/\d{2} Feb 2024/);
  });
});

describe('getAverage', () => {
  it('should return correct average', () => {
    const data = [{ value: 10 }, { value: 20 }, { value: 30 }];
    expect(getAverage(data, 'value')).toBe(20);
  });

  it('should return 0 for empty data', () => {
    expect(getAverage([], 'value')).toBe(0);
  });

  it('should handle missing keys gracefully', () => {
    const data = [{ value: 10 }, { someOtherKey: 20 }];
    expect(getAverage(data, 'value')).toBe(5);
  });
});

describe('getTotal', () => {
  it('should return correct sum', () => {
    const data = [{ value: 10 }, { value: 20 }, { value: 30 }];
    expect(getTotal(data, 'value')).toBe(60);
  });

  it('should return 0 for empty data', () => {
    expect(getTotal([], 'value')).toBe(0);
  });

  it('should handle missing keys gracefully', () => {
    const data = [{ value: 10 }, { someOtherKey: 20 }];
    expect(getTotal(data, 'value')).toBe(10);
  });
});
