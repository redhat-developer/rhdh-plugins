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

/**
 * Shown when a template has no usable time-saved total.
 * Matches the other empty cells in the templates table.
 */
export const EMPTY_TIME_SAVED = '--';

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

export type TimeSavedPart = 'day' | 'hour' | 'minute';

/**
 * Reads a total estimated time saved, in minutes.
 *
 * The top-templates API already sums each run's stored estimate into
 * `minutes`. A run with no estimate contributes zero. Multiplying that
 * sum by `runs` would count the same time again, and it would ignore
 * runs whose annotation was missing or changed later.
 *
 * Missing, blank, non-numeric, infinite, and negative values are no total.
 * Zero is no recorded estimate, not a deliberate "saved nothing".
 */
export function readTotalMinutes(minutes: unknown): number | undefined {
  if (typeof minutes !== 'number' && typeof minutes !== 'string') {
    return undefined;
  }

  const raw = typeof minutes === 'string' ? minutes.trim() : minutes;
  if (raw === '') {
    return undefined;
  }

  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
}

/**
 * Formats a minute total as days, hours, and minutes.
 * Sub-minute totals round away to the empty marker.
 * Japanese joins units with no space (`1日2時間`).
 */
export function formatTotalTimeSaved(
  minutes: unknown,
  translate: (part: TimeSavedPart, count: number) => string,
  locale?: string,
): string {
  const total = readTotalMinutes(minutes);
  if (total === undefined) {
    return EMPTY_TIME_SAVED;
  }

  const rounded = Math.round(total);
  if (rounded <= 0) {
    return EMPTY_TIME_SAVED;
  }

  const days = Math.floor(rounded / MINUTES_PER_DAY);
  const hours = Math.floor((rounded % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  const remainingMinutes = rounded % MINUTES_PER_HOUR;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(translate('day', days));
  }
  if (hours > 0) {
    parts.push(translate('hour', hours));
  }
  if (remainingMinutes > 0) {
    parts.push(translate('minute', remainingMinutes));
  }

  const separator = locale === 'ja' ? '' : ' ';
  return parts.join(separator);
}
