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

import type { DbScalarTimeSeriesPoint } from '../types';

/**
 * One row from the scalar time-series query:
 * `daily` scalar aggregation left-joined to `error_counts` aggregation).
 */
export type DbScalarTimeSeriesQueryRow = {
  utc_day: string;
  value: number | string | null;
  success_count: number | string;
  error_count: number | string;
  total: number | string;
  error_message: string | null;
  error_msg_count: number | string | null;
};

/**
 * Group left-joined query rows into one {@link DbScalarTimeSeriesPoint} per UTC day.
 * Coerces driver numeric types, attaches error messages, sorts them by count then
 * message, and drops days with no successes and no calculation errors.
 */
export function buildScalarTimeSeriesPoints(
  rows: DbScalarTimeSeriesQueryRow[],
): DbScalarTimeSeriesPoint[] {
  const pointsByDay = new Map<string, DbScalarTimeSeriesPoint>();

  for (const row of rows) {
    let point = pointsByDay.get(row.utc_day);
    if (!point) {
      const successCount = Number(row.success_count) || 0;
      const errorCount = Number(row.error_count) || 0;
      const rawValue = Number(row.value);
      const rawTotal = Number(row.total);
      point = {
        utcDay: row.utc_day,
        value: successCount > 0 && Number.isFinite(rawValue) ? rawValue : null,
        successCount,
        errorCount,
        total: Number.isFinite(rawTotal) ? rawTotal : successCount + errorCount,
        errors: [],
      };
      pointsByDay.set(row.utc_day, point);
    }
    const uniqueErrorMessage = row.error_message ?? '';
    if (uniqueErrorMessage !== '') {
      point.errors.push({
        message: uniqueErrorMessage,
        count: Number(row.error_msg_count) || 0,
      });
    }
  }

  for (const point of pointsByDay.values()) {
    point.errors.sort(
      (a, b) => b.count - a.count || a.message.localeCompare(b.message),
    );
  }

  return [...pointsByDay.values()].filter(
    point => point.successCount > 0 || point.errorCount > 0,
  );
}
