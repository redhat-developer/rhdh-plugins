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

import {
  AuthService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';

import {
  MarketplaceKinds,
  MarketplacePluginEntry,
  MarketplacePluginList,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { MarketplaceService } from './MarketplaceService';
import { CatalogApi } from '@backstage/catalog-client';
import { NotFoundError } from '@backstage/errors';

export type Options = {
  logger: LoggerService;
  auth: AuthService;
  config?: RootConfigService;
  catalogApi: CatalogApi;
};

export class MarketplaceCatalogService implements MarketplaceService {
  private readonly logger: LoggerService;
  private readonly catalog: CatalogApi;
  private readonly auth: AuthService;

  constructor(options: Options) {
    this.logger = options.logger;
    this.auth = options.auth;
    this.catalog = options.catalogApi;
  }

  async getPlugins(): Promise<MarketplacePluginEntry[]> {
    this.logger.info('getPlugins');

    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    const result = await this.catalog.getEntities(
      {
        filter: {
          kind: 'plugin',
        },
      },
      token,
    );

    return result.items as MarketplacePluginEntry[];
  }

  async getPluginList(): Promise<MarketplacePluginList[]> {
    this.logger.info('getPluginList');

    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    const result = await this.catalog.getEntities(
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
    const result = await this.catalog.getEntities(
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

  async getPluginByName(name: string): Promise<MarketplacePluginEntry> {
    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    const result = await this.catalog.getEntities(
      {
        filter: {
          kind: 'plugin',
          'metadata.name': name,
        },
      },
      token,
    );

    return result.items?.[0] as MarketplacePluginEntry;
  }

  async getPluginsByPluginsListName(
    name: string,
  ): Promise<MarketplacePluginEntry[]> {
    const pluginList = await this.getPluginListByName(name);
    const plugins = pluginList?.spec?.plugins;

    if (!pluginList) {
      throw new NotFoundError(
        `${MarketplaceKinds.pluginList}:${name} not found`,
      );
    }

    if (!plugins) {
      return [] as MarketplacePluginEntry[];
    }

    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });

    const entityRefs = plugins.map(plugin =>
      `${MarketplaceKinds.plugin}:${pluginList.metadata?.namespace}/${plugin}`.toLowerCase(),
    );
    const result = await this.catalog.getEntitiesByRefs({ entityRefs }, token);

    return result.items as MarketplacePluginEntry[];
  }
}
