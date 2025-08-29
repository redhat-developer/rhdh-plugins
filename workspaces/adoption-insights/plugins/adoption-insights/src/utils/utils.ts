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
import {
  addDays,
  addHours,
  getYear,
  isToday,
  isYesterday,
  startOfWeek,
  subDays,
} from 'date-fns';

import { utcToZonedTime, format, formatInTimeZone } from 'date-fns-tz';

import { APIsViewOptions } from '../types';

export const formatRange = (
  start: Date,
  end: Date,
  timeZone: string = 'UTC',
): { startDate: string; endDate: string } => ({
  startDate: `${formatInTimeZone(start, timeZone, 'yyyy-MM-dd')}T00:00:00`,
  endDate: `${formatInTimeZone(end, timeZone, 'yyyy-MM-dd')}T23:59:59.999`,
});

export const getDateRange = (value: string) => {
  const startDate: Date | null = null;
  const endDate: Date | null = null;

  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = utcToZonedTime(new Date(), timeZone);

  switch (value) {
    case 'today':
      return formatRange(today, today, timeZone);

    case 'last-week': {
      const startingDate = subDays(today, 6);
      return formatRange(startingDate, today, timeZone);
    }

    case 'last-month': {
      const startDay = subDays(today, 29);
      return formatRange(startDay, today, timeZone);
    }

    case 'last-28-days': {
      const startDay = subDays(today, 27);
      return formatRange(startDay, today, timeZone);
    }

    case 'last-year': {
      const startOfTheYear = subDays(today, 364); // 364 days before today
      return formatRange(startOfTheYear, today, timeZone);
    }

    default:
      return { startDate, endDate };
  }
};

export const getXAxisTickValues = (data: any, grouping: string): string[] => {
  if (!data || data.length === 0) return [];
  if (data.length <= 2) return data.map((d: { date: string }) => d.date);

  const first = data[0].date;
  const last = data[data.length - 1].date;
  const selectedDates: string[] = [];

  const processGrouping = (unitExtractor: (date: string) => number) => {
    const selectedUnits = new Set<number>([
      unitExtractor(first),
      unitExtractor(last),
    ]);

    if (data.length <= 4) {
      data.forEach((d: { date: string }) => {
        const unit = unitExtractor(d.date);
        if (!selectedUnits.has(unit)) {
          selectedUnits.add(unit);
          selectedDates.push(d.date);
        }
      });
    } else if (data.length === 6) {
      selectedDates.push(data[2].date);
      selectedDates.push(data[3].date);
    } else if (data.length === 9) {
      selectedDates.push(data[3].date);
      selectedDates.push(data[5].date);
    } else {
      const intervals = [];
      if (data.length !== 5) {
        intervals.push(Math.floor((data.length - 1) / 3));
      }
      intervals.push(Math.floor(((data.length - 1) * 2) / 3));
      intervals.forEach(i => selectedDates.push(data[i].date));
    }
  };

  if (grouping === 'hourly') {
    processGrouping(date => new Date(date).getHours());
  } else if (grouping === 'daily' || grouping === 'weekly') {
    processGrouping(date => new Date(date).getDate());
  } else if (grouping === 'monthly') {
    processGrouping(date => new Date(date).getMonth());
  }

  return [first, ...selectedDates, last];
};

export const getXAxisformat = (date: string, grouping: string) => {
  const dateObj = new Date(date);
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (isNaN(dateObj.getTime())) {
    return formatInTimeZone(date, timeZone, 'd MMMM yy');
  }

  if (grouping === 'hourly') {
    return formatInTimeZone(dateObj, timeZone, 'hh:mm a');
  }

  if (grouping === 'daily' || grouping === 'weekly') {
    return formatInTimeZone(dateObj, timeZone, 'd MMMM yy');
  }

  if (grouping === 'monthly') {
    return formatInTimeZone(dateObj, timeZone, 'MMM yyyy');
  }

  return date;
};

export const getLastUsedDay = (timestamp: string) => {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'dd MMM yyyy');
};

export const getAverage = <T extends Record<string, any>>(
  data: T[],
  key: keyof T,
) => {
  if (!data || data.length === 0) return 0;

  const totalSum = data.reduce(
    (sum, entry) => sum + Number(entry[key] || 0),
    0,
  );
  return totalSum / data.length;
};

export const getTotal = <T extends Record<string, any>>(
  data: T[],
  key: keyof T,
) => {
  const totalSum = data?.reduce(
    (sum, entry) => sum + Number(entry[key] || 0),
    0,
  );
  return totalSum;
};

export const getUniqueCatalogEntityKinds = (data: { kind: string }[]) => {
  const allKinds = data.map(
    item => item.kind.charAt(0).toLocaleUpperCase('en-US') + item.kind.slice(1),
  );
  const uniqueKinds = Array.from(new Set([...allKinds]));
  return uniqueKinds;
};

export const generateEventsUrl = (
  baseUrl: string,
  options: APIsViewOptions,
): string => {
  const params = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    if (value && value !== undefined) {
      params.append(key, String(value));
    }
  });

  return `${baseUrl}?${params.toString()}`;
};

export const determineGrouping = (
  startDate: Date | null,
  endDate: Date | null,
): string => {
  if (
    startDate &&
    endDate &&
    (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
  ) {
    throw new Error('Invalid date format');
  }

  if (startDate && endDate) {
    const diffInMs = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    if (daysDiff <= 1) return 'hourly';
    if (daysDiff <= 7) return 'daily';
    if (daysDiff <= 30) return 'weekly';
  }

  return 'monthly';
};

export const formatWithTimeZone = (
  date: Date,
  formatStr: string = 'yyyy-MM-dd',
) => {
  const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(date, timezone, formatStr);
};

export const formatHourlyBucket = (date: Date): string => {
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

  const start = formatInTimeZone(date, timeZone, 'h:mm');
  const end = formatInTimeZone(addHours(date, 1), timeZone, 'h:mm a');
  const labelDate = formatInTimeZone(date, timeZone, 'MMMM d, yyyy');

  return `${labelDate}, ${start}–${end}`;
};

export const formatDateWithRange = (
  date: Date,
  startDateRange?: Date | null,
  endDateRange?: Date | null,
): string => {
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = utcToZonedTime(new Date(), timeZone);
  const end = endDateRange ?? today;
  const start = startDateRange ?? subDays(end, 364);

  const startLabel = formatInTimeZone(start, timeZone, 'MMM d, yyyy');
  const endLabel = formatInTimeZone(end, timeZone, 'MMM d, yyyy');
  const labelDate = formatInTimeZone(date, timeZone, 'MMMM d, yyyy');
  return `${labelDate}\n  (filtered by ${startLabel} – ${endLabel})`;
};

export const formatWeeklyBucket = (date: Date): string => {
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  const end = addDays(start, 6);

  const sameYear = getYear(start) === getYear(end);

  const startLabel = formatInTimeZone(
    start,
    timeZone,
    sameYear ? 'MMM d' : 'MMM d, yyyy',
  );
  const endLabel = formatInTimeZone(end, timeZone, 'MMM d, yyyy');

  return `${startLabel} – ${endLabel}`;
};

export const formatTooltipHeaderLabel = (key: string) => {
  const words = key.replace(/_/g, ' ').toLowerCase().split(' ');
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(' ');
};

export const getGroupingLabel = (grouping: string): string => {
  switch (grouping) {
    case 'hourly':
      return 'hour';
    case 'daily':
      return 'day';
    case 'weekly':
      return 'week';
    case 'monthly':
      return 'month';
    default:
      return 'day';
  }
};
