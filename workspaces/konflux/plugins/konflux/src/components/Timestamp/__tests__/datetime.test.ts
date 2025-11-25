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
  getDuration,
  fromNow,
  isValid,
  formatPrometheusDuration,
  parsePrometheusDuration,
  toISODateString,
  twentyFourHourTime,
} from '../datetime';

describe('datetime', () => {
  describe('getDuration', () => {
    it('should convert milliseconds to days, hours, minutes, seconds', () => {
      const result = getDuration(90061000); // 1 day, 1 hour, 1 minute, 1 second
      expect(result.days).toBe(1);
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(1);
      expect(result.seconds).toBe(1);
    });

    it('should handle zero milliseconds', () => {
      const result = getDuration(0);
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should handle negative milliseconds', () => {
      const result = getDuration(-1000);
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should handle minutes only', () => {
      const result = getDuration(300000); // 5 minutes
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(5);
      expect(result.seconds).toBe(0);
    });
  });

  describe('fromNow', () => {
    it('should return "-" for null or undefined', () => {
      expect(fromNow(null as any)).toBe('-');
      expect(fromNow(undefined as any)).toBe('-');
    });

    it('should return "-" for future dates', () => {
      const future = new Date(Date.now() + 1000000);
      expect(fromNow(future)).toBe('-');
    });

    it('should return "Just now" for very recent dates', () => {
      const recent = new Date(Date.now() - 30000); // 30 seconds ago
      const result = fromNow(recent);
      expect(result).toBe('Just now');
    });

    it('should return relative time for past dates', () => {
      const past = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      const result = fromNow(past);
      expect(result).toContain('minute');
    });

    it('should return duration without suffix when omitSuffix is true', () => {
      const past = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      const result = fromNow(past, undefined, { omitSuffix: true });
      expect(result).toBe('2 minutes');
    });

    it('should handle Date object', () => {
      const date = new Date('2020-01-01T00:00:00Z');
      const now = new Date('2020-01-01T00:05:00Z');
      const result = fromNow(date, now);
      expect(result).toContain('minute');
    });

    it('should handle date string', () => {
      const dateStr = '2020-01-01T00:00:00Z';
      const now = new Date('2020-01-01T00:05:00Z');
      const result = fromNow(dateStr, now);
      expect(result).toContain('minute');
    });
  });

  describe('isValid', () => {
    it('should return true for valid Date', () => {
      expect(isValid(new Date())).toBe(true);
      expect(isValid(new Date('2020-01-01'))).toBe(true);
    });

    it('should return false for invalid Date', () => {
      expect(isValid(new Date('invalid'))).toBe(false);
      expect(isValid(new Date(Number.NaN))).toBe(false);
    });

    it('should return false for non-Date values', () => {
      expect(isValid(null as any)).toBe(false);
      expect(isValid(undefined as any)).toBe(false);
      expect(isValid('2020-01-01' as any)).toBe(false);
    });
  });

  describe('formatPrometheusDuration', () => {
    it('should format duration correctly', () => {
      expect(formatPrometheusDuration(3661000)).toBe('1h 1m 1s');
      expect(formatPrometheusDuration(90000)).toBe('1m 30s');
      expect(formatPrometheusDuration(5000)).toBe('5s');
    });

    it('should return empty string for invalid values', () => {
      expect(formatPrometheusDuration(-1000)).toBe('');
      expect(formatPrometheusDuration(Number.NaN)).toBe('');
      expect(formatPrometheusDuration(Infinity)).toBe('');
    });

    it('should return empty string for zero', () => {
      expect(formatPrometheusDuration(0)).toBe('');
    });

    it('should handle days and weeks', () => {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      expect(formatPrometheusDuration(oneWeek)).toBe('1w');
      const oneDay = 24 * 60 * 60 * 1000;
      expect(formatPrometheusDuration(oneDay)).toBe('1d');
    });
  });

  describe('parsePrometheusDuration', () => {
    it('should parse duration string correctly', () => {
      expect(parsePrometheusDuration('1h 30m')).toBe(5400000);
      expect(parsePrometheusDuration('5m 30s')).toBe(330000);
      // 2d = 172800000, 3h = 10800000, 15m = 900000, total = 184500000
      expect(parsePrometheusDuration('2d 3h 15m')).toBe(184500000);
    });

    it('should handle invalid format', () => {
      // Empty string returns 1 (sumBy processes empty string as null, defaults to 1)
      expect(parsePrometheusDuration('')).toBe(1);
      // Invalid format without matching regex returns 1 (default value from sumBy)
      expect(parsePrometheusDuration('invalid')).toBe(1);
      expect(parsePrometheusDuration('abc123')).toBe(1);
    });

    it('should handle single unit', () => {
      expect(parsePrometheusDuration('1h')).toBe(3600000);
      expect(parsePrometheusDuration('30m')).toBe(1800000);
      expect(parsePrometheusDuration('45s')).toBe(45000);
    });
  });

  describe('toISODateString', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2020-01-15T12:00:00Z');
      expect(toISODateString(date)).toBe('2020-01-15');
    });

    it('should pad months and days with zeros', () => {
      const date = new Date('2020-03-05T12:00:00Z');
      expect(toISODateString(date)).toBe('2020-03-05');
    });

    it('should handle single digit months and days', () => {
      const date = new Date('2020-01-01T12:00:00Z');
      expect(toISODateString(date)).toBe('2020-01-01');
    });
  });

  describe('twentyFourHourTime', () => {
    it('should format time in 24-hour format', () => {
      const date = new Date('2020-01-01T14:30:00Z');
      const result = twentyFourHourTime(date);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should include seconds when showSeconds is true', () => {
      const date = new Date('2020-01-01T14:30:45Z');
      const result = twentyFourHourTime(date, true);
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should pad hours, minutes, and seconds with zeros', () => {
      const date = new Date('2020-01-01T09:05:03Z');
      const result = twentyFourHourTime(date, true);
      expect(result).toBe('09:05:03');
    });

    it('should not include seconds when showSeconds is false', () => {
      const date = new Date('2020-01-01T14:30:45Z');
      const result = twentyFourHourTime(date, false);
      expect(result).toBe('14:30');
    });
  });
});
