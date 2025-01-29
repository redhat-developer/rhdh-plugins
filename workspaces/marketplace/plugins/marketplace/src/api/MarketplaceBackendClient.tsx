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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

import {
  encodeQueryParams,
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
  MarketplaceApi,
  MarketplacePlugin,
  MarketplacePluginList,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

export type MarketplaceBackendClientOptions = {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
};

export class MarketplaceBackendClient implements MarketplaceApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: MarketplaceBackendClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async getPlugins(): Promise<MarketplacePlugin[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('marketplace');
    const url = `${baseUrl}/plugins`;

    const response = await this.fetchApi.fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  async getPluginByName(name: string): Promise<MarketplacePlugin> {
    const baseUrl = await this.discoveryApi.getBaseUrl('marketplace');
    const url = `${baseUrl}/plugins/${name}`;

    const response = await this.fetchApi.fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  async getPluginLists(): Promise<MarketplacePluginList[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('marketplace');
    const url = `${baseUrl}/pluginlists`;

    const response = await this.fetchApi.fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  async getPluginListByName(name: string): Promise<MarketplacePluginList> {
    const baseUrl = await this.discoveryApi.getBaseUrl('marketplace');
    const url = `${baseUrl}/pluginlists/${name}`;

    const response = await this.fetchApi.fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  async getPluginsByPluginListName(name: string): Promise<MarketplacePlugin[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('marketplace');
    const url = `${baseUrl}/pluginlists/${name}/plugins`;

    const response = await this.fetchApi.fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  async getEntityFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    const { facets, filter } = request;

    const baseUrl = await this.discoveryApi.getBaseUrl('marketplace');
    const url = `${baseUrl}/aggreations?${encodeQueryParams({ facets, filter })}`;

    const response = await this.fetchApi.fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }
}
