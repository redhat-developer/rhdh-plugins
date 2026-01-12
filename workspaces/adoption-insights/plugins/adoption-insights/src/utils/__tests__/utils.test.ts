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
import { utcToZonedTime } from 'date-fns-tz';
import {
  getDateRange,
  getXAxisTickValues,
  getXAxisformat,
  getLastUsedDay,
  getAverage,
  getTotal,
  generateEventsUrl,
  determineGrouping,
  getUniqueCatalogEntityKinds,
  formatRange,
  formatHourlyBucket,
  formatDateWithRange,
  formatWeeklyBucket,
  formatTooltipHeaderLabel,
  getGroupingLabel,
  safeDate,
} from '../utils';
import { format, subDays } from 'date-fns';

describe('safeDate', () => {
  it('should normalize +00 timezone format to Z', () => {
    const result = safeDate('2025-09-29T00:00:00+00');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2025-09-29T00:00:00.000Z');
  });

  it('should handle Z timezone format without changes', () => {
    const result = safeDate('2025-10-01T03:43:36.535Z');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2025-10-01T03:43:36.535Z');
  });

  it('should handle dates without timezone', () => {
    const result = safeDate('2025-09-29T00:00:00');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2025-09-29T00:00:00.000Z');
  });

  it('should handle invalid dates gracefully', () => {
    const result = safeDate('invalid-date');
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(true);
  });
});

describe('getDateRange', () => {
  it('should return correct range for today', () => {
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = utcToZonedTime(new Date(), timeZone);
    expect(getDateRange('today')).toEqual(formatRange(today, today));
  });

  it('should return correct range for last-week', () => {
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = utcToZonedTime(new Date(), timeZone);
    expect(getDateRange('last-week')).toEqual({
      startDate: `${format(subDays(today, 6), 'yyyy-MM-dd')}T00:00:00`,
      endDate: `${format(today, 'yyyy-MM-dd')}T23:59:59.999`,
    });
  });

  it('should return correct range for last-month', () => {
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = utcToZonedTime(new Date(), timeZone);
    expect(getDateRange('last-month')).toEqual({
      startDate: `${format(subDays(today, 29), 'yyyy-MM-dd')}T00:00:00`,
      endDate: `${format(today, 'yyyy-MM-dd')}T23:59:59.999`,
    });
  });

  it('should return correct range for last-year', () => {
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = utcToZonedTime(new Date(), timeZone);

    const finalDate = formatRange(subDays(today, 364), today);

    expect(getDateRange('last-year')).toEqual(finalDate);
  });

  it('should return null for an invalid range', () => {
    expect(getDateRange('invalid')).toEqual({ startDate: null, endDate: null });
  });
});

describe('getXAxisTickValues', () => {
  const testCases = [
    {
      description: 'empty data should return an empty array',
      data: [],
      grouping: 'daily',
      expected: [],
    },
    {
      description: 'should return correct tick values for hourly grouping',
      data: [
        { date: '2025-03-01 00:00' },
        { date: '2025-03-01 12:00' },
        { date: '2025-03-01 18:00' },
      ],
      grouping: 'hourly',
      expected: ['2025-03-01 00:00', '2025-03-01 12:00', '2025-03-01 18:00'],
    },
    {
      description: 'should return correct tick values for daily grouping',
      data: [
        { date: '2025-03-01' },
        { date: '2025-03-02' },
        { date: '2025-03-03' },
        { date: '2025-03-04' },
        { date: '2025-03-05' },
      ],
      grouping: 'daily',
      expected: ['2025-03-01', '2025-03-03', '2025-03-05'], // Assuming alternate values are picked
    },
    {
      description: 'should return correct tick values for weekly grouping',
      data: [
        { date: '2025-03-01' },
        { date: '2025-03-08' },
        { date: '2025-03-15' },
        { date: '2025-03-22' },
      ],
      grouping: 'weekly',
      expected: ['2025-03-01', '2025-03-08', '2025-03-15', '2025-03-22'],
    },
    {
      description: 'should return correct tick values for monthly grouping',
      data: [
        { date: '2025-01-01' },
        { date: '2025-02-01' },
        { date: '2025-03-01' },
        { date: '2025-04-01' },
      ],
      grouping: 'monthly',
      expected: ['2025-01-01', '2025-02-01', '2025-03-01', '2025-04-01'],
    },
  ];

  it.each(testCases)('$description', ({ data, grouping, expected }) => {
    expect(getXAxisTickValues(data, grouping)).toEqual(expected);
  });

  // Test case for the +00 timezone format fix
  it('should handle +00 timezone format correctly in tick values', () => {
    const data = [
      { date: '2025-09-29T00:00:00+00' },
      { date: '2025-09-30T00:00:00+00' },
      { date: '2025-10-01T00:00:00+00' },
    ];
    const result = getXAxisTickValues(data, 'daily');
    expect(result).toEqual([
      '2025-09-29T00:00:00+00',
      '2025-09-30T00:00:00+00',
      '2025-10-01T00:00:00+00',
    ]);
  });
});

describe('getXAxisformat', () => {
  it('should format hourly correctly', () => {
    expect(getXAxisformat('2025-03-01', 'hourly')).toMatch(
      /\d{1,2}:\d{2} [APM]{2}/,
    );
  });

  it('should format daily dates correctly', () => {
    expect(getXAxisformat('2025-03-01', 'daily')).toMatch(/Mar \d{1,2}, \d{4}/);
  });

  it('should format weekly dates correctly', () => {
    expect(getXAxisformat('2025-03-02', 'daily')).toMatch(/Mar \d{1,2}, \d{4}/);
  });

  it('should format monthly dates correctly', () => {
    expect(getXAxisformat('2025-03-01', 'monthly')).toMatch(/Mar 2025/);
  });

  it('should return the same value for unknown grouping', () => {
    expect(getXAxisformat('2025-03-01', 'unknown')).toBe('2025-03-01');
  });

  // Test cases for the +00 timezone format fix
  it('should handle +00 timezone format correctly for daily grouping', () => {
    const result = getXAxisformat('2025-09-29T00:00:00+00', 'daily');
    expect(result).toMatch(/Sep \d{1,2}, \d{4}/);
  });

  it('should handle +00 timezone format correctly for weekly grouping', () => {
    const result = getXAxisformat('2025-09-29T00:00:00+00', 'weekly');
    expect(result).toMatch(/Sep \d{1,2}, \d{4}/);
  });

  it('should handle +00 timezone format correctly for monthly grouping', () => {
    const result = getXAxisformat('2025-09-29T00:00:00+00', 'monthly');
    expect(result).toMatch(/Sep 2025/);
  });

  it('should handle +00 timezone format correctly for hourly grouping', () => {
    const result = getXAxisformat('2025-09-29T14:30:00+00', 'hourly');
    expect(result).toMatch(/\d{1,2}:\d{2} [APM]{2}/);
  });

  it('should handle Z timezone format (should still work)', () => {
    const result = getXAxisformat('2025-10-01T03:43:36.535Z', 'daily');
    expect(result).toMatch(/Oct \d{1,2}, \d{4}/);
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
    expect(getLastUsedDay('2025-02-15T00:00:00Z')).toMatch(
      /Feb \d{1,2}, \d{4}/,
    );
  });

  // Test cases for the +00 timezone format fix
  it('should handle +00 timezone format correctly for older dates', () => {
    const result = getLastUsedDay('2025-02-15T00:00:00+00');
    expect(result).toMatch(/Feb \d{1,2}, \d{4}/);
  });

  it('should handle +00 timezone format correctly for recent dates', () => {
    // Create a date that's definitely in the past but not yesterday
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    const pastDateString = pastDate.toISOString().replace('Z', '+00');

    const result = getLastUsedDay(pastDateString);
    expect(result).toMatch(/\w{3} \d{1,2}, \d{4}/);
  });

  it('should handle Z timezone format (should still work)', () => {
    // Use a date that's definitely in the past to avoid "Today" logic
    const result = getLastUsedDay('2025-02-15T03:43:36.535Z');
    expect(result).toMatch(/Feb \d{1,2}, \d{4}/);
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

describe('getUniqueCatalogEntityKinds', () => {
  test('should return unique kinds with first letter capitalized', () => {
    const data = [
      { kind: 'component' },
      { kind: 'service' },
      { kind: 'component' },
      { kind: 'resource' },
    ];
    expect(getUniqueCatalogEntityKinds(data)).toEqual([
      'Component',
      'Service',
      'Resource',
    ]);
  });

  test('should handle an empty array', () => {
    expect(getUniqueCatalogEntityKinds([])).toEqual([]);
  });

  test('should handle already capitalized kinds', () => {
    const data = [
      { kind: 'Component' },
      { kind: 'Service' },
      { kind: 'Resource' },
    ];
    expect(getUniqueCatalogEntityKinds(data)).toEqual([
      'Component',
      'Service',
      'Resource',
    ]);
  });

  test('should handle mixed-case kinds', () => {
    const data = [{ kind: 'component' }, { kind: 'Component' }];
    expect(getUniqueCatalogEntityKinds(data)).toEqual(['Component']);
  });

  test('should handle single item arrays', () => {
    const data = [{ kind: 'pipeline' }];
    expect(getUniqueCatalogEntityKinds(data)).toEqual(['Pipeline']);
  });
});

describe('generateEventsUrl', () => {
  it('should generate a correct URL with given parameters', () => {
    const baseUrl = 'https://api.example.com/events';
    const options = {
      type: 'active_users',
      start_date: '2025-03-10',
      end_date: '2025-03-15',
    };
    const result = generateEventsUrl(baseUrl, options);
    expect(result).toBe(
      'https://api.example.com/events?type=active_users&start_date=2025-03-10&end_date=2025-03-15',
    );
  });

  it('should exclude undefined or empty values', () => {
    const baseUrl = 'https://api.example.com/events';
    const options = { type: 'webinar', start_date: '', end_date: undefined };
    const result = generateEventsUrl(baseUrl, options);
    expect(result).toBe('https://api.example.com/events?type=webinar');
  });

  it('should return base URL when options are empty', () => {
    const baseUrl = 'https://api.example.com/events';
    const options = {};
    const result = generateEventsUrl(baseUrl, options);
    expect(result).toBe('https://api.example.com/events?');
  });
});

describe('determineGrouping', () => {
  it('should return hourly for 1-day difference', () => {
    const startDate = new Date('2025-03-10');
    const endDate = new Date('2025-03-11');
    expect(determineGrouping(startDate, endDate)).toBe('hourly');
  });

  it('should return daily for up to 7-day difference', () => {
    const startDate = new Date('2025-03-10');
    const endDate = new Date('2025-03-17');
    expect(determineGrouping(startDate, endDate)).toBe('daily');
  });

  it('should return weekly for up to 30-day difference', () => {
    const startDate = new Date('2025-03-01');
    const endDate = new Date('2025-03-30');
    expect(determineGrouping(startDate, endDate)).toBe('weekly');
  });

  it('should return monthly for more than 30 days', () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-03-05');
    expect(determineGrouping(startDate, endDate)).toBe('monthly');
  });

  it('should throw an error for invalid date formats', () => {
    expect(() =>
      determineGrouping(new Date('invalid'), new Date('2025-03-05')),
    ).toThrow('Invalid date format');
    expect(() =>
      determineGrouping(new Date('2025-03-05'), new Date('invalid')),
    ).toThrow('Invalid date format');
  });
});

describe('formatHourlyBucket', () => {
  it('formats hourly bucket with correct start and end hour in timezone', () => {
    const date = new Date('2025-07-01T10:00:00Z'); // 10am UTC
    const result = formatHourlyBucket(date);
    expect(result).toMatch(
      /July 1, 2025, \d{1,2}:\d{2} (AM|PM)–\d{1,2}:\d{2} (AM|PM)/,
    );
  });
});

describe('formatDateWithRange', () => {
  it('should include the date label and date range in proper format', () => {
    const date = new Date('2025-07-01T00:00:00Z');
    const result = formatDateWithRange(date);

    expect(result).toMatch(/July 1, 2025\n\s+\(.* – .*\)/);
  });

  it('should include last 365-day range in proper format', () => {
    const date = new Date('2025-07-01T00:00:00Z');
    const startDateRange = new Date('2024-07-02T00:00:00Z');
    const endDateRange = new Date('2025-07-01T00:00:00Z');
    const result = formatDateWithRange(date, startDateRange, endDateRange);

    // Safe regex - static pattern, no user input involved
    const match = result.match(/\((.*?)\)/); // NOSONAR
    expect(match).not.toBeNull();
    expect(match![1]).toBe('filtered by Jul 2, 2024 – Jul 1, 2025');
  });
});

describe('formatWeeklyBucket', () => {
  it('returns the week range Monday–Sunday for the given date', () => {
    const date = new Date('2025-07-03');
    const result = formatWeeklyBucket(date);

    expect(result).toMatch(/Jun 30 – Jul 6, 2025/);
  });
});

describe('formatTooltipHeaderLabel', () => {
  it('converts snake_case key to title case', () => {
    expect(formatTooltipHeaderLabel('returning_users')).toBe('Returning users');
    expect(formatTooltipHeaderLabel('number_of_clicks')).toBe(
      'Number of clicks',
    );
  });

  it('handles single word key', () => {
    expect(formatTooltipHeaderLabel('count')).toBe('Count');
  });
});

describe('getGroupingLabel', () => {
  const mockTranslation = (key: string) => {
    const translations: Record<string, string> = {
      'activeUsers.hour': 'hour',
      'activeUsers.day': 'day',
      'activeUsers.week': 'week',
      'activeUsers.month': 'month',
      'searches.hour': 'hour',
      'searches.day': 'day',
      'searches.week': 'week',
      'searches.month': 'month',
    };
    return translations[key] || key;
  };

  it('should return correct label for activeUsers section', () => {
    expect(
      getGroupingLabel('hourly', mockTranslation as any, 'activeUsers'),
    ).toBe('hour');
    expect(
      getGroupingLabel('daily', mockTranslation as any, 'activeUsers'),
    ).toBe('day');
    expect(
      getGroupingLabel('weekly', mockTranslation as any, 'activeUsers'),
    ).toBe('week');
    expect(
      getGroupingLabel('monthly', mockTranslation as any, 'activeUsers'),
    ).toBe('month');
  });

  it('should return correct label for searches section', () => {
    expect(getGroupingLabel('hourly', mockTranslation as any, 'searches')).toBe(
      'hour',
    );
    expect(getGroupingLabel('daily', mockTranslation as any, 'searches')).toBe(
      'day',
    );
    expect(getGroupingLabel('weekly', mockTranslation as any, 'searches')).toBe(
      'week',
    );
    expect(
      getGroupingLabel('monthly', mockTranslation as any, 'searches'),
    ).toBe('month');
  });

  it('should fallback to day for unknown grouping', () => {
    expect(
      getGroupingLabel('unknown', mockTranslation as any, 'activeUsers'),
    ).toBe('day');
    expect(
      getGroupingLabel('unknown', mockTranslation as any, 'searches'),
    ).toBe('day');
  });
});
