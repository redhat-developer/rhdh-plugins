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

import { formatDuration } from './DurationUtils';

// Mock translation function that matches the expected signature
const createMockT = () => {
  return jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'duration.aFewSeconds': 'a few seconds',
      'duration.aSecond': 'a second',
      'duration.seconds': '{{count}} seconds',
      'duration.aMinute': 'a minute',
      'duration.minutes': '{{count}} minutes',
      'duration.anHour': 'an hour',
      'duration.hours': '{{count}} hours',
      'duration.aDay': 'a day',
      'duration.days': '{{count}} days',
      'duration.aMonth': 'a month',
      'duration.months': '{{count}} months',
      'duration.aYear': 'a year',
      'duration.years': '{{count}} years',
    };
    return translations[key] || key;
  }) as any;
};

describe('DurationUtils', () => {
  describe('formatDuration', () => {
    let mockT: ReturnType<typeof createMockT>;

    beforeEach(() => {
      mockT = createMockT();
    });

    describe('seconds', () => {
      it('should return "a few seconds" for less than 1 second', () => {
        const result = formatDuration(500, mockT);
        expect(result).toBe('a few seconds');
        expect(mockT).toHaveBeenCalledWith('duration.aFewSeconds');
      });

      it('should return "a second" for exactly 1 second', () => {
        const result = formatDuration(1000, mockT);
        expect(result).toBe('a second');
        expect(mockT).toHaveBeenCalledWith('duration.aSecond');
      });

      it('should return "X seconds" for multiple seconds', () => {
        const result = formatDuration(10000, mockT);
        expect(result).toBe('10 seconds');
        expect(mockT).toHaveBeenCalledWith('duration.seconds');
      });

      it('should round 1.5 seconds to 2 seconds', () => {
        const result = formatDuration(1500, mockT);
        expect(result).toBe('2 seconds');
        expect(mockT).toHaveBeenCalledWith('duration.seconds');
      });

      it('should return "30 seconds" for 30 seconds', () => {
        const result = formatDuration(30000, mockT);
        expect(result).toBe('30 seconds');
        expect(mockT).toHaveBeenCalledWith('duration.seconds');
      });
    });

    describe('minutes', () => {
      it('should return "a minute" for 60 seconds', () => {
        const result = formatDuration(60000, mockT);
        expect(result).toBe('a minute');
        expect(mockT).toHaveBeenCalledWith('duration.aMinute');
      });

      it('should return "2 minutes" for 90 seconds (rounded)', () => {
        const result = formatDuration(90000, mockT);
        expect(result).toBe('2 minutes');
        expect(mockT).toHaveBeenCalledWith('duration.minutes');
      });

      it('should return "2 minutes" for 2 minutes', () => {
        const result = formatDuration(120000, mockT);
        expect(result).toBe('2 minutes');
        expect(mockT).toHaveBeenCalledWith('duration.minutes');
      });

      it('should return "45 minutes" for 45 minutes', () => {
        const result = formatDuration(45 * 60 * 1000, mockT);
        expect(result).toBe('45 minutes');
        expect(mockT).toHaveBeenCalledWith('duration.minutes');
      });
    });

    describe('hours', () => {
      it('should return "an hour" for 60 minutes', () => {
        const result = formatDuration(60 * 60 * 1000, mockT);
        expect(result).toBe('an hour');
        expect(mockT).toHaveBeenCalledWith('duration.anHour');
      });

      it('should return "2 hours" for 90 minutes (rounded)', () => {
        const result = formatDuration(90 * 60 * 1000, mockT);
        expect(result).toBe('2 hours');
        expect(mockT).toHaveBeenCalledWith('duration.hours');
      });

      it('should return "2 hours" for 2 hours', () => {
        const result = formatDuration(2 * 60 * 60 * 1000, mockT);
        expect(result).toBe('2 hours');
        expect(mockT).toHaveBeenCalledWith('duration.hours');
      });

      it('should return "12 hours" for 12 hours', () => {
        const result = formatDuration(12 * 60 * 60 * 1000, mockT);
        expect(result).toBe('12 hours');
        expect(mockT).toHaveBeenCalledWith('duration.hours');
      });
    });

    describe('days', () => {
      it('should return "a day" for 24 hours', () => {
        const result = formatDuration(24 * 60 * 60 * 1000, mockT);
        expect(result).toBe('a day');
        expect(mockT).toHaveBeenCalledWith('duration.aDay');
      });

      it('should return "2 days" for 36 hours (rounded)', () => {
        const result = formatDuration(36 * 60 * 60 * 1000, mockT);
        expect(result).toBe('2 days');
        expect(mockT).toHaveBeenCalledWith('duration.days');
      });

      it('should return "7 days" for 7 days', () => {
        const result = formatDuration(7 * 24 * 60 * 60 * 1000, mockT);
        expect(result).toBe('7 days');
        expect(mockT).toHaveBeenCalledWith('duration.days');
      });
    });

    describe('months', () => {
      it('should return "a month" for 30 days', () => {
        const result = formatDuration(30 * 24 * 60 * 60 * 1000, mockT);
        expect(result).toBe('a month');
        expect(mockT).toHaveBeenCalledWith('duration.aMonth');
      });

      it('should return "2 months" for 60 days', () => {
        const result = formatDuration(60 * 24 * 60 * 60 * 1000, mockT);
        expect(result).toBe('2 months');
        expect(mockT).toHaveBeenCalledWith('duration.months');
      });

      it('should return "6 months" for 180 days', () => {
        const result = formatDuration(180 * 24 * 60 * 60 * 1000, mockT);
        expect(result).toBe('6 months');
        expect(mockT).toHaveBeenCalledWith('duration.months');
      });
    });

    describe('years', () => {
      it('should return "a year" for 365 days', () => {
        const result = formatDuration(365 * 24 * 60 * 60 * 1000, mockT);
        expect(result).toBe('a year');
        expect(mockT).toHaveBeenCalledWith('duration.aYear');
      });

      it('should return "2 years" for 730 days', () => {
        const result = formatDuration(730 * 24 * 60 * 60 * 1000, mockT);
        expect(result).toBe('2 years');
        expect(mockT).toHaveBeenCalledWith('duration.years');
      });

      it('should return "5 years" for 5 years', () => {
        const result = formatDuration(5 * 365 * 24 * 60 * 60 * 1000, mockT);
        expect(result).toBe('5 years');
        expect(mockT).toHaveBeenCalledWith('duration.years');
      });
    });

    describe('edge cases', () => {
      it('should handle 0 milliseconds', () => {
        const result = formatDuration(0, mockT);
        expect(result).toBe('a few seconds');
        expect(mockT).toHaveBeenCalledWith('duration.aFewSeconds');
      });

      it('should handle negative durations (absolute value)', () => {
        const result = formatDuration(-5000, mockT);
        expect(result).toBe('5 seconds');
        expect(mockT).toHaveBeenCalledWith('duration.seconds');
      });

      it('should handle very small positive numbers', () => {
        const result = formatDuration(1, mockT);
        expect(result).toBe('a few seconds');
        expect(mockT).toHaveBeenCalledWith('duration.aFewSeconds');
      });
    });

    describe('rounding behavior', () => {
      it('should round 1.4 minutes to 1 minute', () => {
        const result = formatDuration(1.4 * 60 * 1000, mockT);
        expect(result).toBe('a minute');
        expect(mockT).toHaveBeenCalledWith('duration.aMinute');
      });

      it('should round 1.5 minutes to 2 minutes', () => {
        const result = formatDuration(1.5 * 60 * 1000, mockT);
        expect(result).toBe('2 minutes');
        expect(mockT).toHaveBeenCalledWith('duration.minutes');
      });

      it('should round 1.6 hours to 2 hours', () => {
        const result = formatDuration(1.6 * 60 * 60 * 1000, mockT);
        expect(result).toBe('2 hours');
        expect(mockT).toHaveBeenCalledWith('duration.hours');
      });
    });

    describe('real-world scenarios', () => {
      it('should format 10.172 seconds correctly', () => {
        const result = formatDuration(10172, mockT);
        expect(result).toBe('10 seconds');
        expect(mockT).toHaveBeenCalledWith('duration.seconds');
      });

      it('should format 2 minutes 13 seconds as 2 minutes', () => {
        const result = formatDuration(2 * 60 * 1000 + 13 * 1000, mockT);
        expect(result).toBe('2 minutes');
        expect(mockT).toHaveBeenCalledWith('duration.minutes');
      });

      it('should format 1 hour 30 minutes as 2 hours (rounded)', () => {
        const result = formatDuration(1.5 * 60 * 60 * 1000, mockT);
        expect(result).toBe('2 hours');
        expect(mockT).toHaveBeenCalledWith('duration.hours');
      });
    });
  });
});
