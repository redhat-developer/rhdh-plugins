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

import React from 'react';

import { HeaderLabel } from '@backstage/core-components';

/**
 * @public
 */
export interface LocalClockProps {
  label?: string;
  format?:
    | 'none'
    | 'full'
    | 'date'
    | 'datewithweekday'
    | 'time'
    | 'timewithseconds'
    | 'both';
  lang?: string;
}

/**
 * @public
 */
export const LocalClock = (props: LocalClockProps) => {
  const format = props.format ?? 'time';
  const lang = props.lang ?? window.navigator.language;

  const [time, setTime] = React.useState(() => new Date());

  // Could be optimized to only update the time when needed, but it's aligned with
  // https://github.com/backstage/backstage/blob/master/plugins/home/src/homePageComponents/HeaderWorldClock/HeaderWorldClock.tsx for now
  React.useEffect(() => {
    if (format === 'none') {
      return () => null;
    }
    const intervalId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, [format]);

  if (format === 'none') {
    return null;
  }

  try {
    const includeDate =
      format === 'full' ||
      format === 'date' ||
      format === 'datewithweekday' ||
      format === 'both';
    const includeTime =
      format === 'full' ||
      format === 'time' ||
      format === 'timewithseconds' ||
      format === 'both';

    const value =
      format === 'date' || format === 'datewithweekday'
        ? time.toLocaleDateString(lang, {
            weekday: format === 'datewithweekday' ? 'long' : undefined,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : time.toLocaleTimeString(lang, {
            weekday: format === 'full' ? 'long' : undefined,
            day: includeDate ? '2-digit' : undefined,
            month: includeDate ? '2-digit' : undefined,
            year: includeDate ? 'numeric' : undefined,
            hour: includeTime ? '2-digit' : undefined,
            minute: includeTime ? '2-digit' : undefined,
            second: format === 'timewithseconds' ? '2-digit' : undefined,
          });
    const dateTime = time.toLocaleTimeString(lang, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return (
      <HeaderLabel
        label={props.label ?? ''}
        value={
          <time
            dateTime={dateTime}
            style={props.label ? {} : { fontSize: '20px', fontWeight: 'bold' }}
          >
            {value}
          </time>
        }
      />
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to render clock', e);
    return null;
  }
};
