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
  APIsViewOptions,
  TemplatesResponse,
  CatalogEntitiesResponse,
  PluginTrendResponse,
  UsersResponse,
  TechdocsResponse,
  ActiveUsersResponse,
  SearchesResponse,
} from '../types';
import { generateEventsUrl } from '../utils/utils';

export interface InsightsApi {
  downloadBlob(options: APIsViewOptions): Promise<any>;
  getActiveUsers(options: APIsViewOptions): Promise<ActiveUsersResponse>;
  getUsers(options: APIsViewOptions): Promise<UsersResponse>;
  getCatalogEntities(
    options: APIsViewOptions,
  ): Promise<CatalogEntitiesResponse>;
  getTemplates(options: APIsViewOptions): Promise<TemplatesResponse>;
  getTechdocs(options: APIsViewOptions): Promise<TechdocsResponse>;
  getPlugins(options: APIsViewOptions): Promise<PluginTrendResponse>;
  getSearches(options: APIsViewOptions): Promise<SearchesResponse>;
}

export const adoptionInsightsApiRef = createApiRef<AdoptionInsightsApi>({
  id: 'plugin.adoption-insights.service',
});

export type Options = {
  configApi: ConfigApi;
  fetchApi: FetchApi;
};

const validateResponse = (response: Response, action: string) => {
  if (!response.body || !response.ok) {
    throw new Error(
      `failed to fetch ${action}, status ${response.status}: ${
        !response.ok ? response.statusText : 'Something went wrong.'
      }`,
    );
  }
};

export class AdoptionInsightsApiClient implements AdoptionInsightsApi {
  private readonly configApi: ConfigApi;
  private readonly fetchApi: FetchApi;

  constructor(options: Options) {
    this.configApi = options.configApi;
    this.fetchApi = options.fetchApi;
  }

  async getBaseUrl() {
    return `${this.configApi.getString(
      'backend.baseUrl',
    )}/api/adoption-insights`;
  }

  async getActiveUsers(options: APIsViewOptions): Promise<ActiveUsersResponse> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve({ grouping: undefined, data: [] });
    }

    const baseUrl = await this.getBaseUrl();
    const url = generateEventsUrl(`${baseUrl}/events`, options);

    const response = await this.fetchApi.fetch(url);

    validateResponse(response, 'active users');

    const data = await response.json();
    return data as ActiveUsersResponse;
  }

  async getUsers(options: APIsViewOptions): Promise<UsersResponse> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve({ data: [] });
    }

    const baseUrl = await this.getBaseUrl();
    const url = generateEventsUrl(`${baseUrl}/events`, options);

    const response = await this.fetchApi.fetch(url);

    validateResponse(response, 'users');

    const data = await response.json();
    return data as UsersResponse;
  }

  async getCatalogEntities(
    options: APIsViewOptions,
  ): Promise<CatalogEntitiesResponse> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve({ data: [] });
    }

    const baseUrl = await this.getBaseUrl();
    const url = generateEventsUrl(`${baseUrl}/events`, options);

    const response = await this.fetchApi.fetch(url);

    validateResponse(response, 'catalog entities');

    const data = await response.json();
    return data as CatalogEntitiesResponse;
  }

  async getTemplates(options: APIsViewOptions): Promise<TemplatesResponse> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve({ data: [] });
    }

    const baseUrl = await this.getBaseUrl();
    const url = generateEventsUrl(`${baseUrl}/events`, options);

    const response = await this.fetchApi.fetch(url);

    validateResponse(response, 'templates');

    const data = await response.json();
    return data as TemplatesResponse;
  }

  async getTechdocs(options: APIsViewOptions): Promise<TechdocsResponse> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve({ data: [] });
    }

    const baseUrl = await this.getBaseUrl();
    const url = generateEventsUrl(`${baseUrl}/events`, options);

    const response = await this.fetchApi.fetch(url);

    validateResponse(response, 'techdocs');

    const data = await response.json();
    return data as TechdocsResponse;
  }

  async getPlugins(options: APIsViewOptions): Promise<PluginTrendResponse> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve({ data: [] });
    }

    const baseUrl = await this.getBaseUrl();
    const url = generateEventsUrl(`${baseUrl}/events`, options);

    const response = await this.fetchApi.fetch(url);

    validateResponse(response, 'plugins');

    const data = await response.json();
    return data as PluginTrendResponse;
  }

  async getSearches(options: APIsViewOptions): Promise<SearchesResponse> {
    if (!options.start_date || !options.end_date) {
      return Promise.resolve({ grouping: undefined, data: [] });
    }

    const baseUrl = await this.getBaseUrl();
    const url = generateEventsUrl(`${baseUrl}/events`, options);

    const response = await this.fetchApi.fetch(url);

    validateResponse(response, 'searches');

    const data = await response.json();
    return data as SearchesResponse;
  }

  async downloadBlob(options: APIsViewOptions): Promise<void> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(
      `${baseUrl}/events?type=${options.type}&start_date=${options.start_date}&end_date=${options.end_date}&format=${options.format}&timezone=${options.timezone}`,
    );
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = options.blobName ?? 'active-users';
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
}
