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
import { Knex } from 'knex';
import {
  DailyUsers,
  Grouping,
  TopCatalogEntitiesCount,
  TopPluginCount,
  TopSearches,
  TopTechDocsCount,
  TopTemplatesResponse,
  TimeSavedTotals,
  TotalUsers,
} from '../types/event';
import { Event } from '../models/Event';
import { TemplateSortBy } from '../types/event-request';

export interface Filters {
  start_date: string;
  end_date: string;
  limit?: number | undefined;
  sort_by?: TemplateSortBy;
  kind?: string | undefined;
  timezone: string;
  grouping?: Grouping | undefined;
}

export type UserConfig = {
  licensedUsers: number;
};

export interface EventDatabase {
  insertEvents(events: Event[]): Promise<void>;
  insertFailedEvent(
    event: string,
    errorMessage: string,
    maxRetries: number,
  ): Promise<void>;
  isJsonSupported(): boolean;
  isTimezoneSupported(): boolean;
  isPartitionSupported(): boolean;
  setFilters(filters: Filters): void;
  setConfig(userConfig: UserConfig): void;
  getUsers(): Promise<Knex.QueryBuilder<TotalUsers>>;
  getDailyUsers(): Promise<Knex.QueryBuilder<DailyUsers>>;
  getTimeSaved(): Promise<TimeSavedTotals>;
  getTopSearches(): Promise<Knex.QueryBuilder<TopSearches>>;
  getTopPluginViews(): Promise<Knex.QueryBuilder<TopPluginCount>>;
  getTopTemplates(): Promise<Knex.QueryBuilder<TopTemplatesResponse>>;
  getTopTechDocsViews(): Promise<Knex.QueryBuilder<TopTechDocsCount>>;
  getTopCatalogEntitiesViews(): Promise<
    Knex.QueryBuilder<TopCatalogEntitiesCount>
  >;
}
