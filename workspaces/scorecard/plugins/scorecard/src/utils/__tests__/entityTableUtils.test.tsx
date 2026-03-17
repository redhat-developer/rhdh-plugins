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

import { getLastUpdatedLabel } from '../entityTableUtils';

describe('entityTableUtils', () => {
  describe('getLastUpdatedLabel', () => {
    const mockToday = new Date('2026-03-10T10:00:00Z');

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockToday);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return "Today" if the date is today', () => {
      const result = getLastUpdatedLabel('2026-03-10T08:00:00Z');
      expect(result).toBe('Today');
    });

    it('should return "1 day ago" for yesterday', () => {
      const result = getLastUpdatedLabel('2026-03-09T10:00:00Z');
      expect(result).toBe('1 day ago');
    });

    it('should return "3 days ago" for dates within 6 days', () => {
      const result = getLastUpdatedLabel('2026-03-07T10:00:00Z');
      expect(result).toBe('3 days ago');
    });

    it('should return formatted date for dates older than 6 days', () => {
      const result = getLastUpdatedLabel('2026-03-01T10:00:00Z');
      expect(result).toBe('01 Mar 2026');
    });

    it('should handle Date object input', () => {
      const result = getLastUpdatedLabel(new Date('2026-03-09T10:00:00Z'));
      expect(result).toBe('1 day ago');
    });

    it('should handle timestamp input', () => {
      const result = getLastUpdatedLabel(
        new Date('2026-03-09T10:00:00Z').getTime(),
      );
      expect(result).toBe('1 day ago');
    });

    it('should return "--" for falsy timestamp', () => {
      expect(getLastUpdatedLabel('')).toBe('--');
      expect(getLastUpdatedLabel(null as unknown as string)).toBe('--');
      expect(getLastUpdatedLabel(undefined as unknown as string)).toBe('--');
    });

    it('should return "--" for invalid date', () => {
      expect(getLastUpdatedLabel('not-a-date')).toBe('--');
      expect(getLastUpdatedLabel('Invalid Date')).toBe('--');
      expect(getLastUpdatedLabel(NaN)).toBe('--');
    });

    it('should return "2 days ago" for two days ago (plural)', () => {
      const result = getLastUpdatedLabel('2026-03-08T10:00:00Z');
      expect(result).toBe('2 days ago');
    });

    it('should return "6 days ago" for exactly 6 days ago (boundary)', () => {
      const result = getLastUpdatedLabel('2026-03-04T10:00:00Z');
      expect(result).toBe('6 days ago');
    });

    it('should return formatted date for 7 days ago (beyond 6-day threshold)', () => {
      const result = getLastUpdatedLabel('2026-03-03T10:00:00Z');
      expect(result).toBe('03 Mar 2026');
    });
  });
});
