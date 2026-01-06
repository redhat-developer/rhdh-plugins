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
import type { ConfigApi } from '@backstage/core-plugin-api';

import type {
  ConfigurationResponse,
  ExtensionsCollection,
  ExtensionsPackage,
  ExtensionsPlugin,
} from '../types';
import {
  encodeGetEntitiesRequest,
  encodeGetEntityFacetsRequest,
} from '../utils';

import type {
  GetEntitiesRequest,
  GetEntitiesResponse,
  ExtensionsApi,
} from './ExtensionsApi';
import { NodeEnvironmentType } from '../types/NodeEnvironmentType';

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
export type IdentityApi = {
  getCredentials(): Promise<{
    token?: string;
  }>;
};

/**
 * @public
 */
export type ExtensionsBackendClientOptions = {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
  identityApi: IdentityApi;
  configApi: ConfigApi;
};

// /**
//  * @public
//  * @deprecated Use ExtensionsBackendClientOptions instead
//  */
// export type ExtensionsBackendClientOptions = ExtensionsBackendClientOptions;

/**
 * @public
 */
export class ExtensionsBackendClient implements ExtensionsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;
  private readonly identityApi: IdentityApi;

  constructor(options: ExtensionsBackendClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
    this.identityApi = options.identityApi;
  }

  private async request(
    path: string,
    requestType: 'GET' | 'POST' | 'PATCH',
    searchParams?: URLSearchParams,
    body?: any,
  ): Promise<any> {
    const { token: idToken } = await this.identityApi.getCredentials();
    const baseUrl = await this.discoveryApi.getBaseUrl('extensions');
    const query = searchParams ? searchParams.toString() : '';
    const url = `${baseUrl}${path}${query ? '?' : ''}${query}`;

    const options: RequestInit = {
      method: requestType,
      headers: {
        'Content-Type': 'application/json',
        ...(idToken && { Authorization: `Bearer ${idToken}` }),
      },
    };
    if (body && requestType !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await this.fetchApi.fetch(url, options);

    return response.json();
  }

  getCollections(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<ExtensionsCollection>> {
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
  ): Promise<ExtensionsCollection> {
    return this.request(
      `/collection/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
      'GET',
    );
  }

  getCollectionPlugins(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin[]> {
    return this.request(
      `/collection/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/plugins`,
      'GET',
    );
  }

  async getPackages(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<ExtensionsPackage>> {
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
  ): Promise<ExtensionsPackage> {
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

  async disablePackage(
    namespace: string,
    name: string,
    disabled: boolean,
  ): Promise<{ status: string }> {
    return this.request(
      `/package/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration/disable`,
      'PATCH',
      undefined,
      { disabled },
    );
  }

  async getPlugins(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<ExtensionsPlugin>> {
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
  ): Promise<ExtensionsPlugin> {
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

  async getExtensionsConfiguration(): Promise<{ enabled: boolean }> {
    return this.request(`/plugins/configure`, 'GET');
  }

  async getNodeEnvironment(): Promise<{ nodeEnv: NodeEnvironmentType }> {
    return this.request(`/environment`, 'GET');
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
  ): Promise<{ status: string }> {
    return this.request(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration`,
      'POST',
      undefined,
      { configYaml },
    );
  }

  async disablePlugin(
    namespace: string,
    name: string,
    disabled: boolean,
  ): Promise<{ status: string }> {
    return this.request(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/configuration/disable`,
      'PATCH',
      undefined,
      { disabled },
    );
  }

  getPluginPackages(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPackage[]> {
    return this.request(
      `/plugin/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/packages`,
      'GET',
    );
  }

  getPackagePlugins(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin[]> {
    return this.request(
      `/package/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/plugins`,
      'GET',
    );
  }
}

/**
 * @public
 * @deprecated Use ExtensionsBackendClient instead
 */
// export const ExtensionsBackendClient = ExtensionsBackendClient;
