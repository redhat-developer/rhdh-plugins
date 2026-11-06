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

/** Catalog annotation that stores a template owner's estimated minutes saved. */
export const TIME_SAVED_ANNOTATION = 'rhdh.redhat.com/time-saved';

/** Line copied into template.yaml when the annotation is missing. */
export const TIME_SAVED_ANNOTATION_SNIPPET =
  "rhdh.redhat.com/time-saved: '<duration>'";

export type TimeSavedDuration = {
  days: number;
  hours: number;
  minutes: number;
};

type AnnotatedTemplate = {
  metadata?: {
    annotations?: Record<string, string>;
  };
};

/**
 * Reads a positive minute count from `rhdh.redhat.com/time-saved`.
 * Missing, blank, and non-positive values are treated as no estimate.
 */
export function readTimeSavedMinutes(
  template: AnnotatedTemplate,
): number | undefined {
  const raw = template.metadata?.annotations?.[TIME_SAVED_ANNOTATION];
  if (raw === undefined) {
    return undefined;
  }

  const value = Number(raw.trim());
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
}

/** Splits a minute count into the units shown on the template card. */
export function partitionTimeSaved(minutes: number): TimeSavedDuration {
  const rounded = Math.round(minutes);
  const totalHours = Math.floor(rounded / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return {
    days,
    hours,
    minutes: rounded % 60,
  };
}
