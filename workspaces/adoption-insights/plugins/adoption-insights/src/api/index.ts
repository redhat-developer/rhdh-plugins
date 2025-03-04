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
import { createApiRef, ConfigApi, FetchApi } from '@backstage/core-plugin-api';
import {
  AdoptionInsightsApi,
  CatalogEntities,
  CatalogEntitiesOptions,
  PluginTrend,
  PluginViewsOptions,
  Techdocs,
  TechdocsOptions,
  Templates,
  TemplatesOptions,
} from '../types';

export interface InsightsApi {
  getPluginViews(options: PluginViewsOptions): Promise<PluginTrend[]>;

  getCatalogEntities(
    options: CatalogEntitiesOptions,
  ): Promise<CatalogEntities[]>;

  getTemplates(options: TemplatesOptions): Promise<Templates[]>;

  getTechdocs(options: TechdocsOptions): Promise<Techdocs[]>;
}

export const adoptionInsightsApiRef = createApiRef<AdoptionInsightsApi>({
  id: 'plugin.adoption-insights.service',
});

export type Options = {
  configApi: ConfigApi;
  fetchApi: FetchApi;
};

export class AdoptionInsightsApiClient implements AdoptionInsightsApi {
  private readonly configApi: ConfigApi;
  private readonly fetchApi: FetchApi;

  constructor(options: Options) {
    this.configApi = options.configApi;
    this.fetchApi = options.fetchApi;
  }

  async getBaseUrl() {
    return `${this.configApi.getString('backend.baseUrl')}/api/insights`;
  }

  async getPluginViews(options: PluginViewsOptions): Promise<PluginTrend[]> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve([]);
    }

    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(
      `${baseUrl}/plugin-views?start_date=${options.start_date}&end_date=${options.end_date}&limit=${options.limit}`,
    );
    const data = await response.json();
    return data as PluginTrend[];
  }

  async getCatalogEntities(
    options: CatalogEntitiesOptions,
  ): Promise<CatalogEntities[]> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve([]);
    }

    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(
      `${baseUrl}/catalog-entities?start_date=${options.start_date}&end_date=${options.end_date}&limit=${options.limit}`,
    );
    const data = await response.json();
    return data as CatalogEntities[];
  }

  async getTemplates(options: TemplatesOptions): Promise<Templates[]> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve([]);
    }

    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(
      `${baseUrl}/templates?start_date=${options.start_date}&end_date=${options.end_date}&limit=${options.limit}`,
    );
    const data = await response.json();
    return data as Templates[];
  }

  async getTechdocs(options: TechdocsOptions): Promise<Techdocs[]> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve([]);
    }

    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(
      `${baseUrl}/techdocs?start_date=${options.start_date}&end_date=${options.end_date}&limit=${options.limit}`,
    );
    const data = await response.json();
    return data as Techdocs[];
  }
}
