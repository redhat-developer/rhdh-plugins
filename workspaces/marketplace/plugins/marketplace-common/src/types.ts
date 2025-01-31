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
  EntityFilterQuery,
  EntityOrderQuery,
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
} from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';

/**
 * @public
 */
export interface MarketplacePlugin extends Entity {
  spec?: MarketplacePluginSpec;
}

/**
 * @public
 */
export interface MarketplacePluginWithPageInfo {
  items: MarketplacePlugin[];
  totalItems?: number;
  pageInfo?: {
    nextCursor?: string;
    prevCursor?: string;
  };
}

/**
 * @public
 */
export interface MarketplacePackage extends Entity {
  spec?: MarketplacePackageSpec;
}

/**
 * @public
 */
export interface MarketplacePluginList extends Entity {
  spec?: {
    plugins: string[];
  } & MarketplacePluginSpec;
}

/**
 * @public
 */
export const MARKETPLACE_API_VERSION = 'marketplace.backstage.io/v1alpha1';

/**
 * @public
 */
export enum MarketplaceKinds {
  plugin = 'Plugin',
  pluginList = 'PluginList',
  package = 'Package',
}

/**
 * @public
 */
export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

/**
 * @public
 */
export enum InstallStatus {
  NotInstalled = 'NotInstalled',
  Installed = 'Installed',
}

/**
 * @public
 */
export type MarketplacePluginPackage = {
  name: string;
  version?: string; // from package.json
  backstage?: {
    role?: string; // from package.json backstage role
    'supported-versions'?: string;
  };
  distribution?: string;
};

/**
 * @public
 */
export interface MarketplacePluginSpec extends JsonObject {
  packages?: (string | MarketplacePluginPackage)[];
  installStatus?: keyof typeof InstallStatus;
  icon?: string;
  categories?: string[];
  developer?: string;
  highlights?: string[];
  description?: string;
  installation?: {
    markdown?: string;
    appconfig?: string;
  };
}

/**
 * @public
 */
export type FullTextFilter = {
  term: string;
  fields?: string[];
};

/**
 * @public
 */
export type GetPluginsRequest = {
  limit?: number;
  offset?: number;
  filter?: EntityFilterQuery;
  orderFields?: EntityOrderQuery;
  searchTerm?: string;
};

/**
 * @public
 */
export interface MarketplacePackageSpec extends JsonObject {
  packageName: string;
  dynamicArtifact?: string;
  author?: string;
  support?: string;
  lifecycle?: string;
  backstage?: MarketplacePackageBackstage;
  appConfigExamples?: AppConfigExample[];
}

/**
 * @public
 */
export interface AppConfigExample extends JsonObject {
  title: string;
  content: string | JsonObject;
}

/**
 * @public
 */
export interface MarketplacePackageBackstage extends JsonObject {
  role?: string;
  'supported-versions'?: string;
}
/** @public */
export type {
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
  EntityFilterQuery,
} from '@backstage/catalog-client';

/**
 * @public
 */
export interface MarketplaceApi {
  getPlugins(
    request?: GetPluginsRequest,
  ): Promise<MarketplacePluginWithPageInfo>;
  getPluginByName(name: string): Promise<MarketplacePlugin>;
  getPluginLists(): Promise<MarketplacePluginList[]>;
  getPluginListByName(name: string): Promise<MarketplacePluginList>;
  getPluginsByPluginListName(name: string): Promise<MarketplacePlugin[]>;
  getEntityFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse>;
}
