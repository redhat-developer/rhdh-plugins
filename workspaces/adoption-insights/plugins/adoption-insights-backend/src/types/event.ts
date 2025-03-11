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
interface DateCount {
  date: string; // YYYY-MM-DD format
  count: string;
}
export interface DailyUser {
  date: string;
  total_users: number;
  new_users: number;
  returning_users: number;
}

interface TotalUser {
  logged_in_users: number;
  licensed_users: number;
}

export interface PluginCount {
  plugin_id: string;
  visit_count: string;
  trend: DateCount[];
  trend_percentage: string;
}

interface EntityRefCount {
  entityref: string;
  count: string;
  last_used: string;
}

interface CatalogEntityCount {
  plugin_id: string;
  kind: string;
  name: string;
  namespace: string;
  last_used: string; // ISO 8601 format (e.g., 2025-03-02T16:25:32.819Z);
  count: string;
}

export type ResponseData<T> = {
  data: T;
};

export type Grouping = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type ResponseWithGrouping<T> = {
  grouping: Grouping;
  data: T;
};
export type DailyUsers = ResponseWithGrouping<DailyUser[]>;
export type TotalUsers = ResponseData<TotalUser[]>;
export type TopSearches = ResponseData<DateCount[]>;
export type TopPluginCount = ResponseWithGrouping<PluginCount[]>;
export type TopTechDocsCount = ResponseData<EntityRefCount[]>;
export type TopTemplatesCount = ResponseData<EntityRefCount[]>;
export type TopCatalogEntitiesCount = ResponseData<CatalogEntityCount[]>;
