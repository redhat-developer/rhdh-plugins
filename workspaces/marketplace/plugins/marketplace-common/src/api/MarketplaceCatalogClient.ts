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
import { stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogApi } from '@backstage/catalog-client';
import { NotFoundError } from '@backstage/errors';
import {
  MarketplaceApi,
  MarketplaceKinds,
  MarketplacePlugin,
  MarketplacePluginList,
} from '../types';

/**
 * @public
 */
export type MarketplaceCatalogClientOptions = {
  auth?: AuthService;
  catalogApi: CatalogApi;
};

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

  async getPlugins(): Promise<MarketplacePlugin[]> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      {
        filter: {
          kind: 'plugin',
        },
      },
      token,
    );

    return result.items as MarketplacePlugin[];
  }

  async getPluginLists(): Promise<MarketplacePluginList[]> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      {
        filter: {
          kind: 'pluginList',
        },
      },
      token,
    );

    return result.items as MarketplacePluginList[];
  }

  async getPluginListByName(name: string): Promise<MarketplacePluginList> {
    const token = await this.getServiceToken();
    const result = await this.catalog.getEntityByRef(
      stringifyEntityRef({
        name,
        kind: MarketplaceKinds.pluginList,
      }),
      token,
    );

    return result as MarketplacePluginList;
  }

  async getPluginByName(name: string): Promise<MarketplacePlugin> {
    const token = await this.getServiceToken();
    const result = await this.catalog.getEntityByRef(
      stringifyEntityRef({
        name,
        kind: MarketplaceKinds.plugin,
      }),
      token,
    );

    return result as MarketplacePlugin;
  }

  async getPluginsByPluginListName(name: string): Promise<MarketplacePlugin[]> {
    const pluginList = await this.getPluginListByName(name);
    const plugins = pluginList?.spec?.plugins;

    if (!pluginList) {
      throw new NotFoundError(
        `${MarketplaceKinds.pluginList}:${name} not found`,
      );
    }

    if (!plugins) {
      return [] as MarketplacePlugin[];
    }

    const token = await this.getServiceToken();

    const entityRefs = plugins.map(plugin =>
      stringifyEntityRef({
        kind: MarketplaceKinds.plugin,
        namespace: pluginList.metadata!.namespace,
        name: plugin,
      }),
    );

    const result = await this.catalog.getEntitiesByRefs({ entityRefs }, token);
    return result.items.filter(i => !!i) as MarketplacePlugin[];
  }
}
