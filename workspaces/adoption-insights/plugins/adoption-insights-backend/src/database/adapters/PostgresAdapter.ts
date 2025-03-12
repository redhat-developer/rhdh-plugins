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
import { BaseDatabaseAdapter } from './BaseAdapter';
import { calculateDateRange, getDateGroupingType } from '../../utils/date';

export class PostgresAdapter extends BaseDatabaseAdapter {
  isJsonSupported(): boolean {
    return true;
  }

  isPartitionSupported(): boolean {
    return true;
  }

  getFormatedDate(column: string): string {
    return `${column}::timestamp`;
  }

  getDate(): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.db
      .raw(
        `to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE ?,'YYYY-MM-DD"T"HH24:MI:SS.MSZ')`,
        [timeZone],
      )
      .toQuery();
  }

  getLastUsedDate(): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.db
      .raw(
        `to_char(MAX(created_at)  AT TIME ZONE 'UTC' AT TIME ZONE ?,'YYYY-MM-DD"T"HH24:MI:SS.FF3') || 'Z' AS last_used`,
        [timeZone],
      )
      .toQuery();
  }

  getDateBetweenQuery() {
    return 'created_at';
  }
  getJsonAggregationQuery(...args: any[]): string {
    const { grouping } = this.filters!;
    const fieldMappings = args
      .map(field => {
        if (field === 'date' && grouping === 'hourly') {
          return `'${field}', to_char(date, 'YYYY-MM-DD HH24:MI:SS')`;
        }
        return `'${field}', ${field}`;
      })
      .join(', ');

    return `jsonb_agg(jsonb_build_object(${fieldMappings}) ORDER BY date)`;
  }

  transformJson(data: any[]): any {
    return data;
  }

  getDynamicDateGrouping(onlyText: boolean = false): string {
    this.ensureFiltersSet();
    const { start_date, end_date, grouping: groupingStrategy } = this.filters!;
    const dateDiff = calculateDateRange(start_date, end_date);
    const grouping =
      groupingStrategy || getDateGroupingType(dateDiff, start_date, end_date);

    if (onlyText) {
      return grouping;
    }

    return `${this.getDateGroupingQuery(grouping)} as date`;
  }

  private getDateGroupingQuery(grouping: string): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const rawQuery = (query: any, bindings: any) =>
      this.db.raw(query, bindings).toQuery();
    switch (grouping) {
      case 'hourly':
        return rawQuery(`date_trunc('hour', created_at AT TIME ZONE ?)`, [
          timeZone,
        ]);
      case 'daily':
        return rawQuery(`to_char(created_at AT TIME ZONE ?, 'YYYY-MM-DD')`, [
          timeZone,
        ]);
      case 'weekly':
        return rawQuery(
          `to_char(date_trunc('week', created_at AT TIME ZONE ?), 'YYYY-MM-DD')`,
          [timeZone],
        );
      case 'monthly':
        return rawQuery(
          `to_char(
           LEAST (
              (date_trunc('month', created_at AT TIME ZONE ?) 
              + interval '1 month' - interval '1 day'), 
              ?::date
              ),
              'YYYY-MM-DD'
          )`,
          [timeZone, this.filters?.end_date],
        );
      default:
        throw new Error('Invalid date grouping');
    }
  }
}
