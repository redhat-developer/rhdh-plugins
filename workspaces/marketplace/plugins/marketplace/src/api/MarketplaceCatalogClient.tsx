/*
 * Copyright 2024 The Backstage Authors
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
  MarketplacePluginEntry,
  MarketplacePluginList,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { MarketplaceApi } from './MarketplaceApi';
import { CatalogApi } from '@backstage/plugin-catalog-react';

type CatalogApiOptions = {
  catalogApi: CatalogApi;
};

export class MarketplaceCatalogClient implements MarketplaceApi {
  private readonly catalogApi: CatalogApi;

  constructor(options: CatalogApiOptions) {
    this.catalogApi = options.catalogApi;
  }

  async getPlugins(): Promise<MarketplacePluginEntry[]> {
    const result = await this.catalogApi.getEntities({
      filter: {
        kind: 'plugin',
      },
    });

    return result?.items as MarketplacePluginEntry[];
  }

  async getPluginList(): Promise<MarketplacePluginList[]> {
    const result = await this.catalogApi.getEntities({
      filter: {
        kind: 'pluginList',
      },
    });
    return result.items as MarketplacePluginList[];
  }
}
