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

import { calculateDaysBetweenDates, errorMessage } from '../common';

describe('errorMessage', () => {
  it('should return the string directly when input is a string', () => {
    const error = 'test error message';
    expect(errorMessage(error)).toBe('test error message');
  });

  it('should return message from Error object', () => {
    const error = new Error('test error');
    expect(errorMessage(error)).toBe('test error');
  });

  it('should return message from object with message property', () => {
    const error = { message: 'test error from object' };
    expect(errorMessage(error)).toBe('test error from object');
  });

  it('should return stringified object when object has no message property', () => {
    const error = { code: 404, details: 'not found' };
    expect(errorMessage(error)).toBe('{"code":404,"details":"not found"}');
  });

  it('should return fallback message for null input', () => {
    expect(errorMessage(null)).toBe('An unknown error occurred');
  });

  it('should return fallback message for undefined input', () => {
    expect(errorMessage(undefined)).toBe('An unknown error occurred');
  });

  it('should return fallback message for non-string message property', () => {
    const error = { message: 123 };
    expect(errorMessage(error)).toBe('{"message":123}');
  });
});

describe('calculateDaysBetweenDates', () => {
  it('should return the expected number of days between dates', () => {
    expect(
      calculateDaysBetweenDates(new Date('2001-01-01'), new Date('2001-01-30')),
    ).toBe(30);
  });

  it('should handle same day (returns 1 since it includes both start and end date)', () => {
    expect(
      calculateDaysBetweenDates(new Date('2023-05-15'), new Date('2023-05-15')),
    ).toBe(1);
  });

  it('should handle dates spanning month boundaries', () => {
    expect(
      calculateDaysBetweenDates(new Date('2023-01-25'), new Date('2023-02-05')),
    ).toBe(12);
  });

  it('should handle dates spanning year boundaries', () => {
    expect(
      calculateDaysBetweenDates(new Date('2022-12-25'), new Date('2023-01-05')),
    ).toBe(12);
  });

  it('should handle leap years correctly', () => {
    // February in a leap year (2020)
    expect(
      calculateDaysBetweenDates(new Date('2020-02-01'), new Date('2020-02-29')),
    ).toBe(29);

    // February in a non-leap year (2023)
    expect(
      calculateDaysBetweenDates(new Date('2023-02-01'), new Date('2023-02-28')),
    ).toBe(28);
  });

  it('should handle dates with different time components', () => {
    // Same day but different times - should still count as 1 day
    const startDate = new Date('2023-05-15T08:00:00');
    const endDate = new Date('2023-05-15T18:00:00');
    expect(calculateDaysBetweenDates(startDate, endDate)).toBe(1);
  });

  it('should handle a full year correctly', () => {
    expect(
      calculateDaysBetweenDates(new Date('2023-01-01'), new Date('2023-12-31')),
    ).toBe(365);
  });
});
