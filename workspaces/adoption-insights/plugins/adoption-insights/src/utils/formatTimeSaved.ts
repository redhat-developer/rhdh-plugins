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

export type TimeSavedResult = {
  days: number;
  hours: number;
  minutes: number;
} | null;

export function parseTimeSavedMinutes(
  minutesStr: string | undefined,
): TimeSavedResult {
  if (!minutesStr) {
    return null;
  }
  const parsed = Number(minutesStr);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  const days = Math.floor(parsed / 1440);
  const remainingAfterDays = parsed % 1440;
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = Math.round(remainingAfterDays % 60);
  return { days, hours, minutes };
}

export function computeTotalTimeSaved(
  timeSavedMinutes: string | undefined,
  count: number,
): TimeSavedResult {
  if (!timeSavedMinutes) {
    return null;
  }
  const parsed = Number(timeSavedMinutes);
  if (!Number.isFinite(parsed) || parsed <= 0 || count <= 0) {
    return null;
  }
  const totalMinutes = parsed * count;
  const days = Math.floor(totalMinutes / 1440);
  const remainingAfterDays = totalMinutes % 1440;
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = Math.round(remainingAfterDays % 60);
  return { days, hours, minutes };
}
