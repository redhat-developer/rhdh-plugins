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

import type { AuthService } from '@backstage/backend-plugin-api';
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
  ExtensionsKind,
  type ExtensionsPackage,
  type ExtensionsPlugin,
  type ExtensionsCollection,
  isExtensionsPackage,
  isExtensionsPlugin,
} from '../types';
import type {
  ExtensionsApi,
  GetEntitiesRequest,
  GetEntitiesResponse,
} from './ExtensionsApi';

/**
 * @public
 */
export type ExtensionsCatalogClientOptions = {
  auth?: AuthService;
  catalogApi: CatalogApi;
};

const enforceKindFilter = <
  T extends GetEntitiesRequest | GetEntityFacetsRequest,
>(
  request: T,
  kind: ExtensionsKind,
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
export class ExtensionsCatalogClient implements ExtensionsApi {
  private readonly catalog: CatalogApi;
  private readonly auth?: AuthService;

  constructor(options: ExtensionsCatalogClientOptions) {
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
  ): Promise<GetEntitiesResponse<ExtensionsCollection>> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      enforceKindFilter(request, ExtensionsKind.Collection),
      token,
    );
    return result as GetEntitiesResponse<ExtensionsCollection>;
  }

  async getCollectionsFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    const token = await this.getServiceToken();
    return await this.catalog.getEntityFacets(
      enforceKindFilter(request, ExtensionsKind.Collection),
      token,
    );
  }

  async getCollectionByName(
    namespace: string,
    name: string,
  ): Promise<ExtensionsCollection> {
    const token = await this.getServiceToken();
    const entityRef = stringifyEntityRef({
      kind: ExtensionsKind.Collection,
      namespace,
      name,
    });
    const result = await this.catalog.getEntityByRef(entityRef, token);
    if (!result) {
      throw new NotFoundError(`Collection ${namespace}/${name} not found`);
    }
    return result as ExtensionsCollection;
  }

  async getCollectionPlugins(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin[]> {
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
    return result.items.filter(isExtensionsPlugin);
  }

  async getPackages(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<ExtensionsPackage>> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      enforceKindFilter(request, ExtensionsKind.Package),
      token,
    );
    return result as GetEntitiesResponse<ExtensionsPackage>;
  }

  async getPackagesFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    const token = await this.getServiceToken();
    return await this.catalog.getEntityFacets(
      enforceKindFilter(request, ExtensionsKind.Package),
      token,
    );
  }

  async getPackageByName(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPackage> {
    const token = await this.getServiceToken();
    const entityRef = stringifyEntityRef({
      kind: ExtensionsKind.Package,
      namespace,
      name,
    });
    const result = await this.catalog.getEntityByRef(entityRef, token);
    if (!result) {
      throw new NotFoundError(`Package ${namespace}/${name} not found`);
    }
    return result as ExtensionsCollection;
  }

  async getPlugins(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<ExtensionsPlugin>> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      enforceKindFilter(request, ExtensionsKind.Plugin),
      token,
    );
    return result as GetEntitiesResponse<ExtensionsPlugin>;
  }

  async getPluginFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse> {
    const token = await this.getServiceToken();
    return await this.catalog.getEntityFacets(
      enforceKindFilter(request, ExtensionsKind.Plugin),
      token,
    );
  }

  async getPluginByName(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin> {
    const token = await this.getServiceToken();
    const entityRef = stringifyEntityRef({
      kind: ExtensionsKind.Plugin,
      namespace,
      name,
    });
    const result = await this.catalog.getEntityByRef(entityRef, token);
    if (!result) {
      throw new NotFoundError(`Plugin ${namespace}/${name} not found`);
    }
    return result as ExtensionsPlugin;
  }

  async getPluginPackages(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPackage[]> {
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
    return result.items.filter(isExtensionsPackage);
  }

  async getPackagePlugins(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin[]> {
    const entityRef = stringifyEntityRef({
      kind: ExtensionsKind.Package,
      namespace,
      name,
    });
    const token = await this.getServiceToken();
    const result = await this.catalog.getEntities(
      { filter: { kind: 'Plugin', 'relations.hasPart': entityRef } },
      token,
    );
    return result.items;
  }
}
