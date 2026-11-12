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

import { daysAgo, oneDayAgo, sevenDaysAgo } from './relativeDates';

describe('relativeDates', () => {
  const fixedNow = new Date('2024-06-15T12:00:00.000Z').getTime();

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(fixedNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('daysAgo', () => {
    it('should return a date the given number of days before now', () => {
      expect(daysAgo(3, fixedNow).toISOString()).toBe(
        '2024-06-12T12:00:00.000Z',
      );
      expect(daysAgo(0, fixedNow).getTime()).toBe(fixedNow);
    });

    it('should default now to Date.now()', () => {
      expect(daysAgo(2).toISOString()).toBe('2024-06-13T12:00:00.000Z');
    });
  });

  describe('sevenDaysAgo', () => {
    it('should return a date 7 days before the given now', () => {
      expect(sevenDaysAgo(fixedNow).toISOString()).toBe(
        '2024-06-08T12:00:00.000Z',
      );
    });

    it('should default now to Date.now()', () => {
      expect(sevenDaysAgo().toISOString()).toBe('2024-06-08T12:00:00.000Z');
    });
  });

  describe('oneDayAgo', () => {
    it('should return a date 1 day before the given now', () => {
      expect(oneDayAgo(fixedNow).toISOString()).toBe(
        '2024-06-14T12:00:00.000Z',
      );
    });

    it('should default now to Date.now()', () => {
      expect(oneDayAgo().toISOString()).toBe('2024-06-14T12:00:00.000Z');
    });
  });
});
