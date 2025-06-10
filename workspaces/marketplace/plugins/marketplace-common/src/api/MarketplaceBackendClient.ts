/*
 * Copyright The Backstage Authors
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

import {
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
} from '@backstage/catalog-client';

import type {
  ConfigurationResponse,
  MarketplaceCollection,
  MarketplacePackage,
  MarketplacePlugin,
} from '../types';
import {
  encodeGetEntitiesRequest,
  encodeGetEntityFacetsRequest,
} from '../utils';

import type {
  GetEntitiesRequest,
  GetEntitiesResponse,
  MarketplaceApi,
} from './MarketplaceApi';

/**
 * @public
 */
export type DiscoveryApi = {
  getBaseUrl(pluginId: string): Promise<string>;
};

/**
 * @public
 */
export type FetchApi = {
  fetch: typeof fetch;
};

/**
 * @public
 */
export type MarketplaceBackendClientOptions = {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
};

/**
 * @public
 */
export class MarketplaceBackendClient implements MarketplaceApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: MarketplaceBackendClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async request(
    path: string,
    requestType: 'GET' | 'POST',
    searchParams?: URLSearchParams,
    body?: any,
  ): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('extensions');
    const query = searchParams ? searchParams.toString() : '';
    const url = `${baseUrl}${path}${query ? '?' : ''}${query}`;

    const options: RequestInit = {
      method: requestType,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (body && requestType !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await this.fetchApi.fetch(url, options);
    if (!response.ok) {
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  getCollections(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplaceCollection>> {
    return this.request(
      '/collections',
      'GET',
      encodeGetEntitiesRequest(request),
    );
  }

  getCollectionsFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    return this.request(
      '/collections/facets',
      'GET',
      encodeGetEntityFacetsRequest(request),
    );
  }

  getCollectionByName(
    namespace: string,
    name: string,
  ): Promise<MarketplaceCollection> {
    return this.request(
      `/collection/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
      'GET',
    );
  }

  getCollectionPlugins(
    namespace: string,
    name: string,
  ): Promise<MarketplacePlugin[]> {
    return this.request(
      `/collection/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/plugins`,
      'GET',
    );
  }

  async getPackages(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplacePackage>> {
    return this.request('/packages', 'GET', encodeGetEntitiesRequest(request));
  }

  getPackagesFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    return this.request(
      '/packages/facets',
      'GET',
      encodeGetEntityFacetsRequest(request),
    );
  }

  getPackageByName(
    namespace: string,
    name: string,
  ): Promise<MarketplacePackage> {
    return this.request(
      `/package/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
      'GET',
    );
  }

  async getPackageConfigByName(
    namespace: string,
    name: string,
  ): Promise<ConfigurationResponse> {
    return this.request(
      `/package/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration`,
      'GET',
    );
  }

  async installPackage(
    namespace: string,
    name: string,
    configYaml: string,
  ): Promise<{ status: string }> {
    return this.request(
      `/package/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration`,
      'POST',
      undefined,
      { configYaml },
    );
  }

  async getPlugins(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplacePlugin>> {
    return this.request('/plugins', 'GET', encodeGetEntitiesRequest(request));
  }

  getPluginFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    return this.request(
      '/plugins/facets',
      'GET',
      encodeGetEntityFacetsRequest(request),
    );
  }

  async getPluginByName(
    namespace: string,
    name: string,
  ): Promise<MarketplacePlugin> {
    return this.request(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
      'GET',
    );
  }

  async getPluginConfigAuthorization(
    namespace: string,
    name: string,
  ): Promise<{ read: 'ALLOW' | 'DENY'; write: 'ALLOW' | 'DENY' }> {
    return this.request(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration/authorize`,
      'GET',
    );
  }

  async getPluginConfigByName(
    namespace: string,
    name: string,
  ): Promise<ConfigurationResponse> {
    return this.request(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration`,
      'GET',
    );
  }

  async installPlugin(
    namespace: string,
    name: string,
    configYaml: string,
  ): Promise<{ status: any }> {
    return this.request(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration`,
      'POST',
      undefined,
      { configYaml },
    );
  }

  getPluginPackages(
    namespace: string,
    name: string,
  ): Promise<MarketplacePackage[]> {
    return this.request(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/packages`,
      'GET',
    );
  }
}
