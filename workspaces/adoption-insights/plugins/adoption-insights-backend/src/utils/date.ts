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

export const getDateGroupingType = (
  dateDiff: number,
  start_date: string,
  end_date: string,
): 'daily' | 'weekly' | 'monthly' => {
  if (dateDiff <= 7) return 'daily';
  if (dateDiff <= 30 && isSameMonth(start_date, end_date)) return 'weekly';
  return 'monthly';
};
