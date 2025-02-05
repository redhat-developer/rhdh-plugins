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

import {
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
  GetPackagesRequest,
  GetPluginsRequest,
  MarketplacePackage,
  MarketplacePlugin,
  MarketplaceCollection,
  MarketplacePluginWithPageInfo,
} from '../types';

/**
 * @public
 */
export interface PagedResponse<T> {
  items: T[];
  // TODO remove optionmal
  totalItems?: number;
  pageInfo?: {
    nextCursor?: string;
    prevCursor?: string;
  };
}

/**
 * @public
 */
export interface MarketplaceApi {
  getPackages(
    request?: GetPackagesRequest,
  ): Promise<PagedResponse<MarketplacePackage>>;
  getPackagesFacets(): Promise<GetEntityFacetsResponse>;
  getPackageByName(name: string): Promise<MarketplacePackage>;

  getPlugins(
    request?: GetPluginsRequest,
  ): Promise<MarketplacePluginWithPageInfo>;

  getPluginByName(name: string): Promise<MarketplacePlugin>;

  getPluginLists(): Promise<MarketplaceCollection[]>;
  getPluginListByName(name: string): Promise<MarketplaceCollection>;
  getPluginsByPluginListName(name: string): Promise<MarketplacePlugin[]>;

  // TODO: fix types
  getEntityFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse>;
}
