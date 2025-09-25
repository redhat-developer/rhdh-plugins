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
import { AuthService } from '@backstage/backend-plugin-api';
import {
  CatalogApi,
  EntityFilterQuery,
  GetEntitiesRequest,
  GetEntityFacetsRequest,
} from '@backstage/catalog-client';
import {
  AIModel,
  GetEntitiesResponse,
  ModelServiceApi,
} from '@red-hat-developer-hub/backstage-plugin-ai-experience-common';

/**
 * @public
 */
export type ModelServiceCatalogClient = {
  auth?: AuthService;
  catalog: CatalogApi;
};

export class ModelService implements ModelServiceApi {
  private readonly catalog: CatalogApi;
  private readonly auth?: AuthService;

  constructor(options: ModelServiceCatalogClient) {
    this.auth = options.auth;
    this.catalog = options.catalog;
  }

  private async getServiceToken(): Promise<{ token: string } | undefined> {
    if (!this.auth) {
      return undefined;
    }
    return await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
  }

  appendFilter = <T extends GetEntitiesRequest | GetEntityFacetsRequest>(
    request: T,
    filter: EntityFilterQuery,
  ): T => ({
    ...request,
    filter: {
      ...request.filter,
      ...filter,
    },
  });

  async getModels(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<AIModel>> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      this.appendFilter(request, {
        kind: 'Resource',
        'spec.type': 'ai-model',
      }),
      token,
    );
    return result as GetEntitiesResponse<AIModel>;
  }

  async getTemplates(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<AIModel>> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      this.appendFilter(request, { kind: 'Template' }),
      token,
    );
    return result as GetEntitiesResponse<AIModel>;
  }
}
