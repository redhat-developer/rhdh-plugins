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

export function formatTotalTimeSaved(
  timeSavedMinutes: string | undefined,
  count: number,
): string {
  if (!timeSavedMinutes) {
    return '—';
  }
  const parsed = Number(timeSavedMinutes);
  if (!Number.isFinite(parsed) || parsed <= 0 || count <= 0) {
    return '—';
  }
  const totalMinutes = parsed * count;
  if (totalMinutes < 60) {
    return `${totalMinutes}min`;
  }
  const hours = totalMinutes / 60;
  if (Number.isInteger(hours)) {
    return `${hours}hrs`;
  }
  return `${hours.toFixed(1)}hrs`;
}
