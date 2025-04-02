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
import { GetEntitiesRequest } from '@backstage/catalog-client';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import {
  AIModel,
  encodeGetEntitiesRequest,
  GetEntitiesResponse,
  ModelServiceApi,
} from '@red-hat-developer-hub/backstage-plugin-ai-experience-common';

/**
 * @public
 */
export type ModelCatalogClientOptions = {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
};

/**
 * @public
 */
export class ModelCatalogClient implements ModelServiceApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: ModelCatalogClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async fetcher(
    path: string,
    searchParams?: URLSearchParams,
  ): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('ai-experience');
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

  getModels(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<AIModel>> {
    return this.fetcher('/models', encodeGetEntitiesRequest(request));
  }

  getTemplates(request: GetEntitiesRequest): Promise<GetEntitiesResponse<any>> {
    return this.fetcher('/templates', encodeGetEntitiesRequest(request));
  }
}
