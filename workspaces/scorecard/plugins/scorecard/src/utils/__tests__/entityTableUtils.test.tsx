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
    // Mock time: 2026-03-10T10:00:00Z
    const mockToday = new Date('2026-03-10T10:00:00Z');

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockToday);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    // --- Falsy / invalid input ---

    it('should return "--" for falsy timestamp', () => {
      expect(getLastUpdatedLabel('')).toBe('--');
      expect(getLastUpdatedLabel(null as unknown as string)).toBe('--');
      expect(getLastUpdatedLabel(undefined as unknown as string)).toBe('--');
    });

    it('should return "--" for invalid date string', () => {
      expect(getLastUpdatedLabel('not-a-date')).toBe('--');
      expect(getLastUpdatedLabel('Invalid Date')).toBe('--');
      expect(getLastUpdatedLabel(NaN)).toBe('--');
    });

    // --- Less than 1 minute ---

    it('should return "1 minute ago" for a date less than 1 minute ago', () => {
      // 30 seconds ago → minutesDiff = 0, falls into < 1 branch
      const result = getLastUpdatedLabel('2026-03-10T09:59:30Z');
      expect(result).toBe('1 minute ago');
    });

    // --- Minutes (1–59) ---

    it('should return "1 minute ago" for exactly 1 minute ago', () => {
      const result = getLastUpdatedLabel('2026-03-10T09:59:00Z');
      expect(result).toBe('1 minute ago');
    });

    it('should return "30 minutes ago" for 30 minutes ago', () => {
      const result = getLastUpdatedLabel('2026-03-10T09:30:00Z');
      expect(result).toBe('30 minutes ago');
    });

    it('should return "59 minutes ago" for 59 minutes ago (boundary before hours)', () => {
      const result = getLastUpdatedLabel('2026-03-10T09:01:00Z');
      expect(result).toBe('59 minutes ago');
    });

    // --- Hours (1–23) ---

    it('should return "1 hour ago" for exactly 1 hour ago', () => {
      const result = getLastUpdatedLabel('2026-03-10T09:00:00Z');
      expect(result).toBe('1 hour ago');
    });

    it('should return "5 hours ago" for 5 hours ago', () => {
      const result = getLastUpdatedLabel('2026-03-10T05:00:00Z');
      expect(result).toBe('5 hours ago');
    });

    it('should return "23 hours ago" for 23 hours ago (boundary before yesterday)', () => {
      // 23 hours before mock time → still within same-day hour range (hoursDiff < 24)
      const result = getLastUpdatedLabel('2026-03-09T11:00:00Z');
      expect(result).toBe('23 hours ago');
    });

    // --- Yesterday ---

    it('should return "yesterday" for exactly 24 hours ago (yesterday)', () => {
      const result = getLastUpdatedLabel('2026-03-09T10:00:00Z');
      expect(result).toBe('yesterday');
    });

    it('should handle Date object input and return "yesterday"', () => {
      const result = getLastUpdatedLabel(new Date('2026-03-09T10:00:00Z'));
      expect(result).toBe('yesterday');
    });

    it('should handle numeric timestamp input and return "yesterday"', () => {
      const result = getLastUpdatedLabel(
        new Date('2026-03-09T10:00:00Z').getTime(),
      );
      expect(result).toBe('yesterday');
    });

    // --- N days ago (2–6) ---

    it('should return "2 days ago" for 2 days ago', () => {
      const result = getLastUpdatedLabel('2026-03-08T10:00:00Z');
      expect(result).toBe('2 days ago');
    });

    it('should return "3 days ago" for 3 days ago', () => {
      const result = getLastUpdatedLabel('2026-03-07T10:00:00Z');
      expect(result).toBe('3 days ago');
    });

    it('should return "6 days ago" for exactly 6 days ago (upper boundary)', () => {
      const result = getLastUpdatedLabel('2026-03-04T10:00:00Z');
      expect(result).toBe('6 days ago');
    });

    // --- Formatted calendar date (7+ days) ---

    it('should return a formatted date for 7 days ago (crosses 6-day threshold)', () => {
      const result = getLastUpdatedLabel('2026-03-03T10:00:00Z');
      expect(result).toBe('Mar 03, 2026');
    });

    it('should return a formatted date for dates older than 7 days', () => {
      const result = getLastUpdatedLabel('2026-03-01T10:00:00Z');
      expect(result).toBe('Mar 01, 2026');
    });
  });
});
