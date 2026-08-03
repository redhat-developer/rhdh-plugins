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
/**
 * API
 */
export interface AdoptionInsightsApi {
  downloadBlob(options: APIsViewOptions): Promise<any>;
  getPlugins(options: APIsViewOptions): Promise<PluginTrendResponse>;
  getCatalogEntities(
    options: APIsViewOptions,
  ): Promise<CatalogEntitiesResponse>;
  getTemplates(options: APIsViewOptions): Promise<TemplatesResponse>;
  getTechdocs(options: APIsViewOptions): Promise<TechdocsResponse>;
  getActiveUsers(options: APIsViewOptions): Promise<ActiveUsersResponse>;
  getSearches(options: APIsViewOptions): Promise<SearchesResponse>;
  getUsers(options: APIsViewOptions): Promise<UsersResponse>;
}

export type APIsViewOptions = {
  type?: string;
  start_date?: string;
  end_date?: string;
  timezone?: string;
  limit?: number;
  intervalMs?: number;
  kind?: string;
  format?: string | null;
  blobName?: string;
  grouping?: string;
};

/**
 * Plugin Views
 */
export interface TrendData {
  date: string;
  count: number;
}

export interface PluginTrend {
  plugin_id: string;
  visit_count: number;
  trend_percentage: string;
  trend: TrendData[];
}

export type PluginTrendResponse = {
  data: PluginTrend[];
};
/**
 * Catalog Entities
 */
export type CatalogEntities = {
  plugin_id: string;
  kind: string;
  name: string;
  namespace: string;
  last_used: string;
  count: number;
};

export type CatalogEntitiesResponse = {
  data: CatalogEntities[];
};

/**
 * Templates
 */
export type Templates = {
  entityref: string;
  count: number;
};

export type TemplatesResponse = {
  data: Templates[];
};

/**
 * Techdocs
 */
export type Techdocs = {
  site_name: string;
  count: number;
  last_used: string;
  kind: string;
  namespace: string;
  name: string;
};

export type TechdocsResponse = {
  data: Techdocs[];
};

/**
 * Searches
 */
export type Searches = {
  date: string;
  count: string | number;
};

export type SearchesResponse = {
  grouping?: string;
  data: Searches[];
};

/**
 * ActiveUsers
 */
export type ActiveUsers = {
  date: string;
  total_users: string | number;
  new_users: string | number;
  returning_users: string | number;
};

export type ActiveUsersResponse = {
  grouping?: string;
  data: ActiveUsers[];
};

/**
 * Users
 */
export type Users = {
  logged_in_users: number;
  licensed_users: number;
};

export type UsersResponse = {
  data: Users[];
};
