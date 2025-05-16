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
  MarketplaceCollection,
  MarketplacePackage,
  MarketplacePlugin,
} from '../types';
import {
  encodeGetEntitiesRequest,
  encodeGetEntityFacetsRequest,
} from '../utils';

import type {
  MarketplaceApi,
  GetEntitiesRequest,
  GetEntitiesResponse,
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

  private async get(
    path: string,
    searchParams?: URLSearchParams,
  ): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('extensions');
    const query = searchParams ? searchParams.toString() : '';
    const url = `${baseUrl}${path}${query ? '?' : ''}${query}`;

    const response = await this.fetchApi.fetch(url);
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
    return this.get('/collections', encodeGetEntitiesRequest(request));
  }

  getCollectionsFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    return this.get(
      '/collections/facets',
      encodeGetEntityFacetsRequest(request),
    );
  }

  getCollectionByName(
    namespace: string,
    name: string,
  ): Promise<MarketplaceCollection> {
    return this.get(
      `/collection/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
    );
  }

  getCollectionPlugins(
    namespace: string,
    name: string,
  ): Promise<MarketplacePlugin[]> {
    return this.get(
      `/collection/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/plugins`,
    );
  }

  async getPackages(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplacePackage>> {
    return this.get('/packages', encodeGetEntitiesRequest(request));
  }

  getPackagesFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    return this.get('/packages/facets', encodeGetEntityFacetsRequest(request));
  }

  getPackageByName(
    namespace: string,
    name: string,
  ): Promise<MarketplacePackage> {
    return this.get(
      `/package/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
    );
  }

  async getPlugins(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplacePlugin>> {
    return this.get('/plugins', encodeGetEntitiesRequest(request));
  }

  getPluginFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    return this.get('/plugins/facets', encodeGetEntityFacetsRequest(request));
  }

  async getPluginByName(
    namespace: string,
    name: string,
  ): Promise<MarketplacePlugin> {
    return this.get(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
    );
  }

  async getPluginConfigAuthorization(
    namespace: string,
    name: string,
  ): Promise<{ read: 'ALLOW' | 'DENY'; write: 'ALLOW' | 'DENY' }> {
    return this.get(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration/authorize`,
    );
  }

  async getPluginConfigByName(
    namespace: string,
    name: string,
  ): Promise<{ configYaml: string }> {
    return this.get(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration`,
    );
  }

  getPluginPackages(
    namespace: string,
    name: string,
  ): Promise<MarketplacePackage[]> {
    return this.get(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/packages`,
    );
  }
}
