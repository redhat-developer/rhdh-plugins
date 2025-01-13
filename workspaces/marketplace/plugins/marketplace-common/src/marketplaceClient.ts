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
import { MarketplaceService } from './types';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  MarketplaceKinds,
  MarketplacePlugin,
  MarketplacePluginList,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { CatalogApi } from '@backstage/catalog-client';
import { NotFoundError } from '@backstage/errors';

/**
 * @public
 */
export type MarketplaceClientOptions = {
  auth: AuthService;
  catalogApi: CatalogApi;
};

/**
 * @public
 */
export class MarketplaceClient implements MarketplaceService {
  private readonly catalog: CatalogApi;
  private readonly auth: AuthService;

  constructor(options: MarketplaceClientOptions) {
    this.auth = options.auth;
    this.catalog = options.catalogApi;
  }

  async getPlugins(): Promise<MarketplacePlugin[]> {
    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
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
    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
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
    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    const result = await this.catalog.queryEntities(
      {
        filter: {
          kind: 'pluginList',
          'metadata.name': name,
        },
      },
      token,
    );

    return result.items?.[0] as MarketplacePluginList;
  }

  async getPluginByName(name: string): Promise<MarketplacePlugin> {
    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    const result = await this.catalog.queryEntities(
      {
        filter: {
          kind: 'plugin',
          'metadata.name': name,
        },
      },
      token,
    );

    return result.items?.[0] as MarketplacePlugin;
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

    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });

    const entityRefs = plugins.map(plugin =>
      stringifyEntityRef({
        kind: MarketplaceKinds.plugin,
        namespace: pluginList.metadata!.namespace,
        name: plugin,
      }),
    );

    const result = await this.catalog.getEntitiesByRefs({ entityRefs }, token);

    return result.items as MarketplacePlugin[];
  }
}
