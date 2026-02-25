/**
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

import { formatRelativeTime } from './formatRelativeTime';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when startedAt is undefined', () => {
    it('returns "-"', () => {
      expect(formatRelativeTime(undefined, undefined)).toBe('-');
    });

    it('returns "-" even when finishedAt is provided', () => {
      const finishedAt = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(undefined, finishedAt)).toBe('-');
    });
  });

  describe('when task is running (no finishedAt)', () => {
    it('shows running duration in seconds', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T11:59:30Z');
      expect(formatRelativeTime(startedAt, undefined)).toBe('Running for 30s');
    });

    it('shows running duration in minutes and seconds', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T11:57:30Z');
      expect(formatRelativeTime(startedAt, undefined)).toBe(
        'Running for 2m 30s',
      );
    });

    it('shows running duration in hours', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T09:00:00Z');
      expect(formatRelativeTime(startedAt, undefined)).toBe('Running for 3h');
    });

    it('shows running duration in hours and minutes', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T09:45:00Z');
      expect(formatRelativeTime(startedAt, undefined)).toBe(
        'Running for 2h 15m',
      );
    });

    it('shows running duration in days', () => {
      const now = new Date('2024-01-03T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(startedAt, undefined)).toBe('Running for 2d');
    });

    it('shows running duration in days and hours', () => {
      const now = new Date('2024-01-03T15:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(startedAt, undefined)).toBe(
        'Running for 2d 3h',
      );
    });
  });

  describe('when task is finished', () => {
    beforeEach(() => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);
    });

    it('shows finished less than 1 minute ago with duration', () => {
      const startedAt = new Date('2024-01-01T11:59:00Z');
      const finishedAt = new Date('2024-01-01T11:59:30Z');
      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished <1m ago (took 30s)',
      );
    });

    it('shows finished minutes ago with duration', () => {
      const startedAt = new Date('2024-01-01T11:40:00Z');
      const finishedAt = new Date('2024-01-01T11:55:00Z');
      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished 5m ago (took 15m 0s)',
      );
    });

    it('shows finished hours ago with duration in minutes', () => {
      const startedAt = new Date('2024-01-01T08:00:00Z');
      const finishedAt = new Date('2024-01-01T10:00:00Z');
      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished 2h ago (took 2h)',
      );
    });

    it('shows finished hours and minutes ago with duration', () => {
      const startedAt = new Date('2024-01-01T08:00:00Z');
      const finishedAt = new Date('2024-01-01T09:30:00Z');
      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished 2h 30m ago (took 1h 30m)',
      );
    });

    it('shows finished days ago with duration', () => {
      const startedAt = new Date('2023-12-28T12:00:00Z');
      const finishedAt = new Date('2023-12-30T12:00:00Z');
      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished 2d ago (took 2d)',
      );
    });

    it('shows finished days and hours ago with complex duration', () => {
      const startedAt = new Date('2023-12-28T08:00:00Z');
      const finishedAt = new Date('2023-12-30T10:00:00Z');
      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished 2d 2h ago (took 2d 2h)',
      );
    });

    it('handles very short durations (seconds only)', () => {
      const startedAt = new Date('2024-01-01T11:59:50Z');
      const finishedAt = new Date('2024-01-01T11:59:55Z');
      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished <1m ago (took 5s)',
      );
    });

    it('handles exact hour durations', () => {
      const startedAt = new Date('2024-01-01T09:00:00Z');
      const finishedAt = new Date('2024-01-01T11:00:00Z');
      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished 1h ago (took 2h)',
      );
    });

    it('handles exact day durations', () => {
      const startedAt = new Date('2023-12-29T12:00:00Z');
      const finishedAt = new Date('2023-12-31T12:00:00Z');
      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished 1d ago (took 2d)',
      );
    });
  });

  describe('edge cases', () => {
    it('handles same start and finish time', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const timestamp = new Date('2024-01-01T11:59:00Z');
      expect(formatRelativeTime(timestamp, timestamp)).toBe(
        'Finished 1m ago (took 0s)',
      );
    });

    it('handles Date objects correctly', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T11:00:00Z');
      const finishedAt = new Date('2024-01-01T11:30:00Z');

      expect(formatRelativeTime(startedAt, finishedAt)).toBe(
        'Finished 30m ago (took 30m 0s)',
      );
    });

    it('handles running task started just now', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(startedAt, undefined)).toBe('Running for 0s');
    });
  });
});
