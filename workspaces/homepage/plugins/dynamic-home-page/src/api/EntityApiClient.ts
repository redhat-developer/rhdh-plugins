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
import { createApiRef } from '@backstage/core-plugin-api';
import {
  CatalogApi,
  EntityFilterQuery,
  GetEntitiesRequest,
  GetEntityFacetsRequest,
} from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';

export interface QueryEntitiesResponse<T> {
  items: T[];
  totalItems: number;
  pageInfo: {
    nextCursor?: string;
    prevCursor?: string;
  };
}

export interface EntityApi {
  getEntities(
    request: GetEntitiesRequest,
  ): Promise<QueryEntitiesResponse<Entity>>;
  getTemplates(
    request: GetEntitiesRequest,
  ): Promise<QueryEntitiesResponse<Entity>>;
}

export const entityApiRef = createApiRef<EntityApi>({
  id: 'app.developer-hub.entity.service',
});

export class EntityApiClient implements EntityApi {
  private readonly catalogApi: CatalogApi;

  constructor(options: { catalogApi: CatalogApi }) {
    this.catalogApi = options.catalogApi;
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

  async getEntities(
    request: GetEntitiesRequest,
  ): Promise<QueryEntitiesResponse<Entity>> {
    const response = await this.catalogApi.queryEntities(
      this.appendFilter(request, {
        kind: ['Component', 'API', 'Resource', 'System'],
      }),
    );

    return response as QueryEntitiesResponse<Entity>;
  }

  async getTemplates(
    request: GetEntitiesRequest,
  ): Promise<QueryEntitiesResponse<Entity>> {
    const response = await this.catalogApi.queryEntities(
      this.appendFilter(request, { kind: 'Template' }),
    );

    return response as QueryEntitiesResponse<Entity>;
  }
}
