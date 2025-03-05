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
 * Plugin Views
 */
export interface TrendData {
  date: string;
  count: number;
}

export interface PluginTrend {
  plugin_id: string;
  count: string;
  trend_percentage: string;
  trend: TrendData[];
}

export type PluginViewsOptions = {
  type?: string;
  start_date: string;
  end_date: string;
  limit?: number;
  intervalMs?: number;
};

/**
 * Catalog Entities
 */
export type CatalogEntities = {
  id: string;
  name: string;
  kind: string;
  last_used: string;
  views: string;
};

export type CatalogEntitiesOptions = {
  type?: string;
  start_date: string;
  end_date: string;
  limit?: number;
  intervalMs?: number;
};

/**
 * API
 */
export interface AdoptionInsightsApi {
  getPluginViews(options: PluginViewsOptions): Promise<PluginTrend[]>;

  getCatalogEntities(
    options: CatalogEntitiesOptions,
  ): Promise<CatalogEntities[]>;

  getTemplates(options: TemplatesOptions): Promise<Templates[]>;

  getTechdocs(options: TechdocsOptions): Promise<Techdocs[]>;
}

/**
 * Templates
 */
export type TemplatesOptions = {
  type?: string;
  start_date: string;
  end_date: string;
  limit?: number;
  intervalMs?: number;
};

export type Templates = {
  id: string;
  name: string;
  useBy: string;
  executions: string;
};

/**
 * Techdocs
 */
export type TechdocsOptions = {
  type?: string;
  start_date: string;
  end_date: string;
  limit?: number;
  intervalMs?: number;
};

export type Techdocs = {
  id: string;
  name: string;
  entity: string;
  last_used: string;
  views: string;
};
