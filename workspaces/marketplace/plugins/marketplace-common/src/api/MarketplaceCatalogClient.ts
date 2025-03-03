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

import { AuthService } from '@backstage/backend-plugin-api';
import {
  RELATION_HAS_PART,
  RELATION_PART_OF,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  CatalogApi,
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
} from '@backstage/catalog-client';
import { NotFoundError } from '@backstage/errors';

import {
  MarketplaceKind,
  type MarketplacePackage,
  type MarketplacePlugin,
  type MarketplaceCollection,
  isMarketplacePackage,
  isMarketplacePlugin,
} from '../types';
import type {
  MarketplaceApi,
  GetEntitiesRequest,
  GetEntitiesResponse,
} from './MarketplaceApi';

/**
 * @public
 */
export type MarketplaceCatalogClientOptions = {
  auth?: AuthService;
  catalogApi: CatalogApi;
};

const enforceKindFilter = <
  T extends GetEntitiesRequest | GetEntityFacetsRequest,
>(
  request: T,
  kind: MarketplaceKind,
): T => ({
  ...request,
  filter: {
    ...request.filter,
    kind,
  },
});

/**
 * @public
 */
export class MarketplaceCatalogClient implements MarketplaceApi {
  private readonly catalog: CatalogApi;
  private readonly auth?: AuthService;

  constructor(options: MarketplaceCatalogClientOptions) {
    this.auth = options.auth;
    this.catalog = options.catalogApi;
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

  async getCollections(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplaceCollection>> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      enforceKindFilter(request, MarketplaceKind.Collection),
      token,
    );
    return result as GetEntitiesResponse<MarketplaceCollection>;
  }

  async getCollectionsFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    const token = await this.getServiceToken();
    return await this.catalog.getEntityFacets(
      enforceKindFilter(request, MarketplaceKind.Collection),
      token,
    );
  }

  async getCollectionByName(
    namespace: string,
    name: string,
  ): Promise<MarketplaceCollection> {
    const token = await this.getServiceToken();
    const entityRef = stringifyEntityRef({
      kind: MarketplaceKind.Collection,
      namespace,
      name,
    });
    const result = await this.catalog.getEntityByRef(entityRef, token);
    if (!result) {
      throw new NotFoundError(`Collection ${namespace}/${name} not found`);
    }
    return result as MarketplaceCollection;
  }

  async getCollectionPlugins(
    namespace: string,
    name: string,
  ): Promise<MarketplacePlugin[]> {
    const collection = await this.getCollectionByName(namespace, name);
    const relations = collection.relations ?? [];

    // Ensure that we return just Plugins
    const entityRefs = relations
      .filter(
        relation =>
          (relation.type === RELATION_PART_OF ||
            relation.type === RELATION_HAS_PART) &&
          relation.targetRef.startsWith('plugin:'),
      )
      .map(relation => relation.targetRef);

    const token = await this.getServiceToken();
    const result = await this.catalog.getEntitiesByRefs({ entityRefs }, token);

    // Double check that we return (only) the right Plugins
    return result.items.filter(isMarketplacePlugin);
  }

  async getPackages(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplacePackage>> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      enforceKindFilter(request, MarketplaceKind.Package),
      token,
    );
    return result as GetEntitiesResponse<MarketplacePackage>;
  }

  async getPackagesFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    const token = await this.getServiceToken();
    return await this.catalog.getEntityFacets(
      enforceKindFilter(request, MarketplaceKind.Package),
      token,
    );
  }

  async getPackageByName(
    namespace: string,
    name: string,
  ): Promise<MarketplacePackage> {
    const token = await this.getServiceToken();
    const entityRef = stringifyEntityRef({
      kind: MarketplaceKind.Package,
      namespace,
      name,
    });
    const result = await this.catalog.getEntityByRef(entityRef, token);
    if (!result) {
      throw new NotFoundError(`Package ${namespace}/${name} not found`);
    }
    return result as MarketplaceCollection;
  }

  async getPlugins(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplacePlugin>> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      enforceKindFilter(request, MarketplaceKind.Plugin),
      token,
    );
    return result as GetEntitiesResponse<MarketplacePlugin>;
  }

  async getPluginFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    const token = await this.getServiceToken();
    return await this.catalog.getEntityFacets(
      enforceKindFilter(request, MarketplaceKind.Plugin),
      token,
    );
  }

  async getPluginByName(
    namespace: string,
    name: string,
  ): Promise<MarketplacePlugin> {
    const token = await this.getServiceToken();
    const entityRef = stringifyEntityRef({
      kind: MarketplaceKind.Plugin,
      namespace,
      name,
    });
    const result = await this.catalog.getEntityByRef(entityRef, token);
    if (!result) {
      throw new NotFoundError(`Plugin ${namespace}/${name} not found`);
    }
    return result as MarketplacePlugin;
  }

  async getPluginPackages(
    namespace: string,
    name: string,
  ): Promise<MarketplacePackage[]> {
    const plugin = await this.getPluginByName(namespace, name);
    const relations = plugin.relations ?? [];

    // Ensure that we return just Packages
    const entityRefs = relations
      .filter(
        relation =>
          (relation.type === RELATION_PART_OF ||
            relation.type === RELATION_HAS_PART) &&
          relation.targetRef.startsWith('package:'),
      )
      .map(relation => relation.targetRef);

    const token = await this.getServiceToken();
    const result = await this.catalog.getEntitiesByRefs({ entityRefs }, token);

    // Double check that we return (only) the right Packages
    return result.items.filter(isMarketplacePackage);
  }
}
