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

import { TFuncX2A } from '../../hooks/useTranslation';
import {
  mockT,
  createMockTFromFlatMessages,
} from '../../test-utils/mockTranslations';
import x2aPluginTranslationEs from '../../translations/es';
import x2aPluginTranslationDe from '../../translations/de';
import x2aPluginTranslationFr from '../../translations/fr';
import x2aPluginTranslationIt from '../../translations/it';
import {
  formatDuration,
  formatRelativeTime,
  formatTimeAgo,
} from './formatRelativeTime';

const t = mockT as unknown as TFuncX2A;

const extractTimeKeys = (translation: { messages: Record<string, string> }) =>
  Object.fromEntries(
    Object.entries(translation.messages).filter(([key]) =>
      key.startsWith('time.'),
    ),
  );

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when startedAt is undefined', () => {
    it('returns "-"', () => {
      expect(formatRelativeTime(t, undefined, undefined)).toBe('-');
    });

    it('returns "-" even when finishedAt is provided', () => {
      const finishedAt = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(t, undefined, finishedAt)).toBe('-');
    });
  });

  describe('when task is running (no finishedAt)', () => {
    it('shows running duration in seconds', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T11:59:30Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 30s',
      );
    });

    it('shows running duration in minutes and seconds', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T11:57:30Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 2m 30s',
      );
    });

    it('shows running duration in hours', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T09:00:00Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 3h',
      );
    });

    it('shows running duration in hours and minutes', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T09:45:00Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 2h 15m',
      );
    });

    it('shows running duration in days', () => {
      const now = new Date('2024-01-03T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 2d',
      );
    });

    it('shows running duration in days and hours', () => {
      const now = new Date('2024-01-03T15:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
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
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished <1m ago (took 30s)',
      );
    });

    it('shows finished minutes ago with duration', () => {
      const startedAt = new Date('2024-01-01T11:40:00Z');
      const finishedAt = new Date('2024-01-01T11:55:00Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished 5m ago (took 15m 0s)',
      );
    });

    it('shows finished hours ago with duration in minutes', () => {
      const startedAt = new Date('2024-01-01T08:00:00Z');
      const finishedAt = new Date('2024-01-01T10:00:00Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished 2h ago (took 2h)',
      );
    });

    it('shows finished hours and minutes ago with duration', () => {
      const startedAt = new Date('2024-01-01T08:00:00Z');
      const finishedAt = new Date('2024-01-01T09:30:00Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished 2h 30m ago (took 1h 30m)',
      );
    });

    it('shows finished days ago with duration', () => {
      const startedAt = new Date('2023-12-28T12:00:00Z');
      const finishedAt = new Date('2023-12-30T12:00:00Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished 2d ago (took 2d)',
      );
    });

    it('shows finished days and hours ago with complex duration', () => {
      const startedAt = new Date('2023-12-28T08:00:00Z');
      const finishedAt = new Date('2023-12-30T10:00:00Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished 2d 2h ago (took 2d 2h)',
      );
    });

    it('handles very short durations (seconds only)', () => {
      const startedAt = new Date('2024-01-01T11:59:50Z');
      const finishedAt = new Date('2024-01-01T11:59:55Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished <1m ago (took 5s)',
      );
    });

    it('handles exact hour durations', () => {
      const startedAt = new Date('2024-01-01T09:00:00Z');
      const finishedAt = new Date('2024-01-01T11:00:00Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished 1h ago (took 2h)',
      );
    });

    it('handles exact day durations', () => {
      const startedAt = new Date('2023-12-29T12:00:00Z');
      const finishedAt = new Date('2023-12-31T12:00:00Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished 1d ago (took 2d)',
      );
    });
  });

  describe('edge cases', () => {
    it('handles same start and finish time', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const timestamp = new Date('2024-01-01T11:59:00Z');
      expect(formatRelativeTime(t, timestamp, timestamp)).toBe(
        'Finished 1m ago (took 0s)',
      );
    });

    it('handles Date objects correctly', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T11:00:00Z');
      const finishedAt = new Date('2024-01-01T11:30:00Z');

      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished 30m ago (took 30m 0s)',
      );
    });

    it('handles running task started just now', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 0s',
      );
    });

    it('handles finished just now', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T11:58:00Z');
      expect(formatRelativeTime(t, startedAt, now)).toBe(
        'Finished <1m ago (took 2m 0s)',
      );
    });

    it('finished 59 seconds ago still shows <1m ago', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T11:58:31Z');
      const finishedAt = new Date('2024-01-01T11:59:01Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished <1m ago (took 30s)',
      );
    });

    it('finished exactly 60 seconds ago shows 1m ago', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const startedAt = new Date('2024-01-01T11:58:00Z');
      const finishedAt = new Date('2024-01-01T11:59:00Z');
      expect(formatRelativeTime(t, startedAt, finishedAt)).toBe(
        'Finished 1m ago (took 1m 0s)',
      );
    });
  });

  describe('duration boundary thresholds', () => {
    beforeEach(() => {
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    it('running for exactly 60 seconds shows 1m 0s', () => {
      const startedAt = new Date('2024-01-01T11:59:00Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 1m 0s',
      );
    });

    it('running for 59 seconds shows 59s', () => {
      const startedAt = new Date('2024-01-01T11:59:01Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 59s',
      );
    });

    it('running for exactly 3600 seconds shows 1h', () => {
      const startedAt = new Date('2024-01-01T11:00:00Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 1h',
      );
    });

    it('running for 3599 seconds shows 59m 59s', () => {
      const startedAt = new Date('2024-01-01T11:00:01Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 59m 59s',
      );
    });

    it('running for exactly 86400 seconds shows 1d', () => {
      const startedAt = new Date('2023-12-31T12:00:00Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 1d',
      );
    });

    it('running for 86399 seconds shows 23h 59m', () => {
      const startedAt = new Date('2023-12-31T12:00:01Z');
      expect(formatRelativeTime(t, startedAt, undefined)).toBe(
        'Running for 23h 59m',
      );
    });
  });
});

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(t, 0)).toBe('0s');
  });

  it('formats seconds only', () => {
    expect(formatDuration(t, 45)).toBe('45s');
  });

  it('formats exactly 60 seconds as minutes', () => {
    expect(formatDuration(t, 60)).toBe('1m 0s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(t, 90)).toBe('1m 30s');
  });

  it('formats exactly 1 hour', () => {
    expect(formatDuration(t, 3600)).toBe('1h');
  });

  it('formats hours and minutes (drops seconds)', () => {
    expect(formatDuration(t, 3661)).toBe('1h 1m');
  });

  it('formats exactly 1 day', () => {
    expect(formatDuration(t, 86400)).toBe('1d');
  });

  it('formats days and hours (drops lower units)', () => {
    expect(formatDuration(t, 90000)).toBe('1d 1h');
  });

  it('formats large values', () => {
    expect(formatDuration(t, 180000)).toBe('2d 2h');
  });
});

describe('formatTimeAgo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "<1m ago" for less than 60 seconds ago', () => {
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    expect(formatTimeAgo(t, new Date('2024-01-01T11:59:30Z'))).toBe('<1m ago');
  });

  it('returns minutes ago', () => {
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    expect(formatTimeAgo(t, new Date('2024-01-01T11:55:00Z'))).toBe('5m ago');
  });

  it('returns hours and minutes ago', () => {
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    expect(formatTimeAgo(t, new Date('2024-01-01T09:30:00Z'))).toBe(
      '2h 30m ago',
    );
  });

  it('returns hours ago when minutes are zero', () => {
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    expect(formatTimeAgo(t, new Date('2024-01-01T10:00:00Z'))).toBe('2h ago');
  });

  it('returns days and hours ago', () => {
    jest.setSystemTime(new Date('2024-01-03T15:00:00Z'));
    expect(formatTimeAgo(t, new Date('2024-01-01T12:00:00Z'))).toBe(
      '2d 3h ago',
    );
  });

  it('returns days ago when hours are zero', () => {
    jest.setSystemTime(new Date('2024-01-03T12:00:00Z'));
    expect(formatTimeAgo(t, new Date('2024-01-01T12:00:00Z'))).toBe('2d ago');
  });
});

describe('formatDuration with fractional seconds', () => {
  it('floors fractional seconds input', () => {
    expect(formatDuration(t, 90.7)).toBe('1m 30s');
  });

  it('floors fractional seconds in sub-minute range', () => {
    expect(formatDuration(t, 5.9)).toBe('5s');
  });
});

describe('locale-specific compositions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-03T15:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const startedAt = new Date('2024-01-01T12:00:00Z');
  const finishedAt = new Date('2024-01-01T14:30:00Z');

  it('Spanish: no doubled "hace" in finished message', () => {
    const tEs = createMockTFromFlatMessages(
      extractTimeKeys(x2aPluginTranslationEs),
    ) as unknown as TFuncX2A;
    const result = formatRelativeTime(tEs, startedAt, finishedAt);
    expect(result).toBe('Finalizado hace 2d (duró 2h 30min)');
    expect(result).not.toMatch(/hace.*hace/);
  });

  it('German: correct finished message', () => {
    const tDe = createMockTFromFlatMessages(
      extractTimeKeys(x2aPluginTranslationDe),
    ) as unknown as TFuncX2A;
    const result = formatRelativeTime(tDe, startedAt, finishedAt);
    expect(result).toBe('Beendet vor 2T (2Std 30Min gedauert)');
    expect(result).not.toMatch(/vor.*vor/);
  });

  it('French: correct finished message', () => {
    const tFr = createMockTFromFlatMessages(
      extractTimeKeys(x2aPluginTranslationFr),
    ) as unknown as TFuncX2A;
    const result = formatRelativeTime(tFr, startedAt, finishedAt);
    expect(result).toBe('Terminé il y a 2j (durée 2h 30min)');
    expect(result).not.toMatch(/il y a.*il y a/);
  });

  it('Italian: correct finished message', () => {
    const tIt = createMockTFromFlatMessages(
      extractTimeKeys(x2aPluginTranslationIt),
    ) as unknown as TFuncX2A;
    const result = formatRelativeTime(tIt, startedAt, finishedAt);
    expect(result).toBe('Terminato 2g fa (durata 2h 30min)');
    expect(result).not.toMatch(/fa.*fa/);
  });

  it('Spanish: correct running message', () => {
    const tEs = createMockTFromFlatMessages(
      extractTimeKeys(x2aPluginTranslationEs),
    ) as unknown as TFuncX2A;
    const result = formatRelativeTime(tEs, startedAt, undefined);
    expect(result).toBe('En ejecución desde hace 2d 3h');
  });
});
