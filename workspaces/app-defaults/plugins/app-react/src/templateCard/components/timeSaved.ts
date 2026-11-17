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

import { Duration } from 'luxon';

/**
 * Catalog annotation that stores a template owner's estimated time saved.
 * The value is an ISO 8601 duration, for example `PT15M` or `PT1H30M`.
 */
export const TIME_SAVED_ANNOTATION = 'backstage.io/time-saved';

/**
 * Duration shown in the copyable YAML line. Matches the example in the
 * Backstage template descriptor.
 */
const TIME_SAVED_DURATION_EXAMPLE = 'PT15M';

/**
 * YAML mapping entry copied into `template.yaml`. The value is quoted so it
 * is stored as a string duration, for example `backstage.io/time-saved: 'PT15M'`.
 */
export const TIME_SAVED_ANNOTATION_SNIPPET = `${TIME_SAVED_ANNOTATION}: '${TIME_SAVED_DURATION_EXAMPLE}'`;

export type TimeSavedDuration = {
  days: number;
  hours: number;
  minutes: number;
};

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

type AnnotatedTemplate = {
  metadata?: {
    annotations?: Record<string, string>;
  };
};

/**
 * Reads minutes from `backstage.io/time-saved`.
 * Uses Luxon `Duration.fromISO(value).as('minutes')`.
 * A year is 365 days and a month is 30 days.
 * Missing, invalid, and negative values are no estimate. `PT0M` is a real zero.
 */
export function readTimeSavedMinutes(
  template: AnnotatedTemplate,
): number | undefined {
  const raw = template.metadata?.annotations?.[TIME_SAVED_ANNOTATION];
  if (typeof raw !== 'string') {
    return undefined;
  }

  const minutes = Duration.fromISO(raw).as('minutes');
  if (!Number.isFinite(minutes) || minutes < 0) {
    return undefined;
  }

  return minutes;
}

/** Splits a minute count into the days, hours, and minutes shown on the card. */
export function partitionTimeSaved(minutes: number): TimeSavedDuration {
  const rounded = Math.round(minutes);

  return {
    days: Math.floor(rounded / MINUTES_PER_DAY),
    hours: Math.floor((rounded % MINUTES_PER_DAY) / MINUTES_PER_HOUR),
    minutes: rounded % MINUTES_PER_HOUR,
  };
}
