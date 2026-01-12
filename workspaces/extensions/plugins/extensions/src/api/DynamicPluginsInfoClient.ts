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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { DynamicPluginInfo, DynamicPluginsInfoApi } from '.';

export interface DynamicPluginsInfoClientOptions {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
}

const loadedPluginsEndpoint = '/loaded-plugins';

export class DynamicPluginsInfoClient implements DynamicPluginsInfoApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: DynamicPluginsInfoClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }
  async listLoadedPlugins(): Promise<DynamicPluginInfo[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('extensions');
    const targetUrl = `${baseUrl}${loadedPluginsEndpoint}`;
    const response = await this.fetchApi.fetch(targetUrl);
    const data = await response.json();
    if (!response.ok) {
      const message = data.error?.message || data.message || data.toString?.();
      throw new Error(`Failed to load dynamic plugin info: ${message}`);
    }
    return data;
  }
}
