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
import { DateTime } from 'luxon';
import { Grouping } from '../types/event';

export const toStartOfDayUTC = (dateString: string, timezone = 'UTC') =>
  DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: timezone })
    .startOf('day')
    .toUTC()
    .toISO();

export const toEndOfDayUTC = (dateString: string, timezone = 'UTC') =>
  DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: timezone })
    .endOf('day')
    .toUTC()
    .toISO();

export const calculateDateRange = (
  start_date: string,
  end_date: string,
): number => {
  const start = DateTime.fromISO(start_date, { zone: 'UTC' });
  const end = DateTime.fromISO(end_date, { zone: 'UTC' });

  return Math.floor(end.diff(start, 'days').days);
};

export const isSameMonth = (start_date: string, end_date: string): boolean => {
  const start = DateTime.fromISO(start_date, { zone: 'UTC' });
  const end = DateTime.fromISO(end_date, { zone: 'UTC' });

  return start.hasSame(end, 'month');
};

export const getDateGroupingType = (dateDiff: number): Grouping => {
  if (dateDiff === 0) return 'hourly';
  if (dateDiff <= 7) return 'daily';
  if (dateDiff <= 30) return 'weekly';
  return 'monthly';
};

export const hasZFormat = (dateStr: string): boolean => {
  return dateStr.includes('Z') || dateStr.includes('T');
};

/**
 * Normalize any date string or Date to UTC ISO string (e.g. 2026-03-11T16:17:46.540Z).
 * Use this before storing timestamps in the database so they are consistent.
 */
export const normalizeToUTCISO = (date: string | Date): string => {
  if (date instanceof Date) {
    return date.toISOString();
  }
  const s = String(date).trim();
  // Luxon fromISO handles ISO with Z or offset (e.g. -05:00)
  let dt = DateTime.fromISO(s, { setZone: true });
  if (dt.isValid) {
    return dt.toUTC().toISO() ?? s;
  }
  // Try "yyyy-MM-dd HH:mm:ss.SSS -0500" or "yyyy-MM-dd HH:mm:ss -0500" style
  dt = DateTime.fromFormat(s, 'yyyy-MM-dd HH:mm:ss.SSS ZZZ', { setZone: true });
  if (dt.isValid) {
    return dt.toUTC().toISO() ?? s;
  }
  dt = DateTime.fromFormat(s, 'yyyy-MM-dd HH:mm:ss ZZZ', { setZone: true });
  if (dt.isValid) {
    return dt.toUTC().toISO() ?? s;
  }
  dt = DateTime.fromFormat(s, 'yyyy-MM-dd HH:mm:ss', { zone: 'UTC' });
  if (dt.isValid) {
    return dt.toISO() ?? s;
  }
  // Return original when unparseable: do not substitute current time, which would
  // silently corrupt created_at and misplace events in partitions/date-range queries.
  return s;
};

export const convertToTargetTimezone = (
  date: string | Date,
  timeZone: string = new Intl.DateTimeFormat().resolvedOptions().timeZone,
) => {
  const dateString = date instanceof Date ? date.toISOString() : date;

  const isoParsed = DateTime.fromISO(dateString, { setZone: true });

  if (isoParsed.isValid) {
    return isoParsed.setZone(timeZone).toISO();
  }

  // If not valid ISO, try parsing as 'yyyy-MM-dd HH:mm:ss' in UTC
  const fallback = DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm:ss', {
    zone: 'UTC',
  });

  if (fallback.isValid) {
    return fallback.setZone(timeZone).toISO();
  }

  // Last resort: return the original date
  console.warn('Unable to parse date:', date);
  return date;
};

export const getTimeZoneOffsetString = (
  timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone,
) => {
  const now = DateTime.now().setZone(timeZone);
  return now.toFormat('ZZ');
};
