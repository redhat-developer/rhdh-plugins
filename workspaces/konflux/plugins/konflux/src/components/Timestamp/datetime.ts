/* eslint-disable no-param-reassign */
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
import { pluralize } from '@patternfly/react-core';
import { each, isFinite, sumBy } from 'lodash';

// The maximum allowed clock skew in milliseconds where we show a date as "Just now" even if it is from the future.
export const maxClockSkewMS = -60000;

// https://tc39.es/ecma402/#datetimeformat-objects
export const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: 'numeric',
});

export const timeFormatterWithSeconds = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

export const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const dateFormatterNoYear = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

export const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  year: 'numeric',
});

export const dateTimeFormatterWithSeconds = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  year: 'numeric',
});

export const utcDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export const relativeTimeFormatter = Intl.RelativeTimeFormat
  ? new Intl.RelativeTimeFormat(undefined)
  : null;

export const getDuration = (ms: number) => {
  if (!ms || ms < 0) {
    ms = 0;
  }
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  let hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  const days = Math.floor(hours / 24);
  hours = hours % 24;
  return { days, hours, minutes, seconds };
};

export const fromNow = (dateTime: string | Date, now?: Date, options?: any) => {
  // Check for null. If dateTime is null, it returns incorrect date Jan 1 1970.
  if (!dateTime) {
    return '-';
  }

  if (!now) {
    now = new Date();
  }

  const d = new Date(dateTime);
  const ms = now.getTime() - d.getTime();
  const justNow = 'Just now';

  // If the event occurred less than one minute in the future, assume it's clock drift and show "Just now."
  if (!options?.omitSuffix && ms < 60000 && ms > maxClockSkewMS) {
    return justNow;
  }

  // Do not attempt to handle other dates in the future.
  if (ms < 0) {
    return '-';
  }

  const { days, hours, minutes } = getDuration(ms);

  if (options?.omitSuffix) {
    if (days) {
      return pluralize(days, 'day', 'days');
    }
    if (hours) {
      return pluralize(hours, 'hour', 'hours');
    }
    return pluralize(minutes, 'minute', 'minutes');
  }

  // Fallback to normal date/time formatting if Intl.RelativeTimeFormat is not
  // available. This is the case for older Safari versions.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat#browser_compatibility
  if (!relativeTimeFormatter) {
    return dateTimeFormatter.format(d);
  }

  if (!days && !hours && !minutes) {
    return justNow;
  }

  if (days) {
    return relativeTimeFormatter.format(-days, 'day');
  }

  if (hours) {
    return relativeTimeFormatter.format(-hours, 'hour');
  }

  return relativeTimeFormatter.format(-minutes, 'minute');
};

export const isValid = (dateTime: Date) =>
  dateTime instanceof Date && !Number.isNaN(dateTime.valueOf());

// Conversions between units and milliseconds
const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const units = { w, d, h, m, s };

// Formats a duration in milliseconds like "1h 10m"
export const formatPrometheusDuration = (ms: number) => {
  if (!isFinite(ms) || ms < 0) {
    return '';
  }
  let remaining = ms;
  let str = '';
  each(units, (factor, unit) => {
    const n = Math.floor(remaining / factor);
    if (n > 0) {
      str += `${n}${unit} `;
      remaining -= n * factor;
    }
  });
  return str.trim();
};

// Converts a duration like "1h 10m 23s" to milliseconds or returns 0 if the duration could not be
// parsed
export const parsePrometheusDuration = (duration: string): number => {
  try {
    const parts = duration
      .trim()
      .split(/\s+/)
      .map(p => /^(\d+)([wdhms])$/.exec(p));
    return sumBy(
      parts,
      p =>
        Number.parseInt(p?.[1] ?? '1', 10) *
        (p?.[2] ? units[p[2] as keyof typeof units] : 1),
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to render clock', error);
    return 0;
  }
};

const zeroPad = (number: number) => (number < 10 ? `0${number}` : number);

// Get YYYY-MM-DD date string for a date object
export const toISODateString = (date: Date): string =>
  `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(
    date.getDate(),
  )}`;

export const twentyFourHourTime = (
  date: Date,
  showSeconds?: boolean,
): string => {
  const hours = zeroPad(date.getHours() ?? 0);
  const minutes = `:${zeroPad(date.getMinutes() ?? 0)}`;
  const seconds = showSeconds ? `:${zeroPad(date.getSeconds() ?? 0)}` : '';
  return `${hours}${minutes}${seconds}`;
};
