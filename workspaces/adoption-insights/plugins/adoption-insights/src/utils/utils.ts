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
  format,
  startOfToday,
  startOfYear,
  subDays,
  isToday,
  isYesterday,
} from 'date-fns';

export const getDateRange = (value: string) => {
  const startDate: Date | null = null;
  const endDate: Date | null = null;
  const today = startOfToday();

  switch (value) {
    case 'today':
      return {
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };

    case 'last-week':
      return {
        startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };

    case 'last-month':
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };

    case 'last-year':
      return {
        startDate: format(startOfYear(today), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };

    default:
      return { startDate, endDate };
  }
};

export const getXAxisTickValues = (data: any, grouping: string): string[] => {
  if (!data) return [];
  if (data.length === 0) return [];
  if (data.length === 1) return [data[0].date];
  if (data.length === 2) return [data[0].date, data[1].date];

  const first = data[0].date;
  const last = data[data.length - 1].date;
  const selectedDates: string[] = [];

  if (grouping === 'daily' || grouping === 'weekly') {
    const selectedUnits = new Set<number>();

    if (data.length <= 4) {
      data.forEach((d: { date: string }) => {
        const weekDay = new Date(d.date).getDay();
        if (!selectedUnits.has(weekDay)) {
          selectedUnits.add(weekDay);
          selectedDates.push(d.date);
        }
      });
    } else if (data.length === 6) {
      selectedDates.push(data[2].date, data[3].date);
    } else if (data.length === 9) {
      selectedDates.push(data[3].date, data[5].date);
    } else {
      const interval = Math.floor((data.length - 1) / 3);
      if (data.length !== 5) {
        selectedDates.push(data[interval].date);
      }
      selectedDates.push(data[interval * 2].date);
    }
  }

  if (grouping === 'monthly') {
    const selectedMonths = new Set<number>();
    selectedMonths.add(new Date(first).getMonth());
    selectedMonths.add(new Date(last).getMonth());

    if (data.length <= 4) {
      data.forEach((d: { date: string }) => {
        const month = new Date(d.date).getMonth();
        if (!selectedMonths.has(month)) {
          selectedMonths.add(month);
          selectedDates.push(d.date);
        }
      });
    } else if (data.length === 6) {
      selectedDates.push(data[2].date, data[3].date); // Fix: Always include indexes 2 and 3
    } else if (data.length === 9) {
      selectedDates.push(data[3].date, data[5].date);
    } else {
      const interval = Math.floor((data.length - 1) / 3);
      if (data.length !== 5) {
        selectedDates.push(data[interval].date);
      }
      selectedDates.push(data[interval * 2].date);
    }
  }

  return [first, ...selectedDates, last];
};

export const getXAxisformat = (date: string, grouping: string) => {
  const dateObj = new Date(date);

  if (grouping === 'daily' || grouping === 'weekly') {
    return format(dateObj, 'd MMMM yy');
  }

  if (grouping === 'monthly') {
    return format(dateObj, 'MMM yyyy');
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

export const getCatalogEntityKinds = (data: { kind: string }[]) => {
  return [...new Set(data?.map(item => item.kind))];
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
