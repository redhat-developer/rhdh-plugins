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

export const getTimeZoneOffsetString = () => {
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = DateTime.now().setZone(timeZone);
  return now.toFormat('ZZ');
};
