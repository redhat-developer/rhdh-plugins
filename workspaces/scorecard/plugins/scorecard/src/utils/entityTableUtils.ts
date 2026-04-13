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
  differenceInCalendarDays,
  isValid,
  differenceInMinutes,
  differenceInHours,
  isYesterday,
} from 'date-fns';

export const formatDate = (
  date: Date,
  options: Intl.DateTimeFormatOptions = {},
  locale?: string,
) => {
  const currentLocale = locale || 'en';
  const currentTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(currentLocale, {
    timeZone: currentTimeZone,
    ...options,
  }).format(date);
};

export const formatRelativeTime = (
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale?: string,
) => {
  const currentLocale = locale || 'en';

  const rtf = new Intl.RelativeTimeFormat(currentLocale, {
    numeric: 'auto',
  });

  return rtf.format(value, unit);
};

export function getLastUpdatedLabel(
  timestamp: string | number | Date,
  locale?: string,
) {
  if (!timestamp) return '--';

  const date = new Date(timestamp);
  if (!isValid(date)) return '--';

  const now = new Date();

  const minutesDiff = differenceInMinutes(now, date);

  // < 1 minute → 1 minute ago
  if (minutesDiff < 1) {
    return formatRelativeTime(-1, 'minute', locale);
  }

  // 1 - 59 minutes → N minutes ago
  if (minutesDiff < 60) {
    return formatRelativeTime(-minutesDiff, 'minute', locale);
  }

  const hoursDiff = differenceInHours(now, date);

  // 1 – 24 hours → N hours ago
  if (hoursDiff < 24) {
    return formatRelativeTime(-hoursDiff, 'hour', locale);
  }

  // Yesterday → yesterday
  if (isYesterday(date)) {
    return formatRelativeTime(-1, 'day', locale);
  }

  const daysDiff = differenceInCalendarDays(now, date);

  // 2–6 days → N days ago
  if (daysDiff <= 6) {
    return formatRelativeTime(-daysDiff, 'day', locale);
  }

  // 7+ days → formatted date
  return formatDate(
    date,
    { year: 'numeric', month: 'short', day: '2-digit' },
    locale,
  );
}
