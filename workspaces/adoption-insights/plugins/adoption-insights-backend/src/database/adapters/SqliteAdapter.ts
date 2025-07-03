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
import {
  calculateDateRange,
  getDateGroupingType,
  getTimeZoneOffsetString,
} from '../../utils/date';

export class SqliteAdapter extends BaseDatabaseAdapter {
  isJsonSupported(): boolean {
    return false;
  }

  isPartitionSupported(): boolean {
    return false;
  }

  isTimezoneSupported(): boolean {
    return false;
  }

  getDate(): string {
    return `strftime('%Y-%m-%d', datetime(created_at, '${getTimeZoneOffsetString()}')) AS date`;
  }

  getLastUsedDate(): string {
    return `strftime('%Y-%m-%dT%H:%M:%SZ', MAX(datetime(created_at, '${getTimeZoneOffsetString()}'))) AS last_used`;
  }

  getFormatedDate(column: string): string {
    return `datetime(${column})`;
  }

  getDateBetweenQuery(): string {
    return 'created_at BETWEEN datetime(?) AND datetime(?)';
  }

  getJsonAggregationQuery(...args: any[]): string {
    const fieldMappings = args.map(field => `'${field}', ${field}`).join(', ');
    return `json_group_array(json_object(${fieldMappings}))`;
  }

  transformJson(data: any[], jsonField: string): any {
    return data.map((row: any) => ({
      ...row,
      [jsonField]: row[jsonField] ? JSON.parse(row[jsonField]) : null,
    }));
  }

  getDynamicDateGrouping({ onlyText = false }): string {
    const { start_date, end_date, grouping: groupingStrategy } = this.filters!;
    const dateDiff = calculateDateRange(start_date, end_date);

    const grouping = groupingStrategy || getDateGroupingType(dateDiff);

    if (onlyText) {
      return grouping;
    }

    return this.db
      .raw(`${this.getDateGroupingQuery(grouping)} as date`)
      .toQuery();
  }

  private getDateGroupingQuery(grouping: string): string {
    const offsetStr = getTimeZoneOffsetString();
    switch (grouping) {
      case 'hourly':
        return `strftime('%Y-%m-%d %H:00:00', datetime(created_at, '${offsetStr}'))`;
      case 'daily':
        return `strftime('%Y-%m-%d', datetime(created_at, '${offsetStr}'))`;
      case 'weekly':
        return `strftime('%Y-%m-%d', datetime(created_at, '${offsetStr}', 'weekday 0', '-6 days'))`;
      case 'monthly':
        return `strftime('%Y-%m-%d', datetime(created_at, '${offsetStr}'))`;
      default:
        throw new Error('Invalid date grouping');
    }
  }
}
