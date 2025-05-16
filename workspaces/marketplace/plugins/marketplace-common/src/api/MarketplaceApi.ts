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
  QueryEntitiesInitialRequest,
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
} from '@backstage/catalog-client';

import {
  MarketplaceCollection,
  MarketplacePackage,
  MarketplacePlugin,
} from '../types';

/**
 * @public
 */
export type GetEntitiesRequest = QueryEntitiesInitialRequest;

/**
 * @public
 */
export interface GetEntitiesResponse<T> {
  items: T[];
  totalItems: number;
  pageInfo: {
    nextCursor?: string;
    prevCursor?: string;
  };
}

/**
 * @public
 */
export interface MarketplaceApi {
  getCollections(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplaceCollection>>;

  getCollectionsFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse>;

  getCollectionByName(
    namespace: string,
    name: string,
  ): Promise<MarketplaceCollection>;

  getCollectionPlugins(
    namespace: string,
    name: string,
  ): Promise<MarketplacePlugin[]>;

  getPackages(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplacePackage>>;

  getPackagesFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse>;

  getPackageByName(
    namespace: string,
    name: string,
  ): Promise<MarketplacePackage>;

  getPlugins(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<MarketplacePlugin>>;

  getPluginFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse>;

  getPluginByName(namespace: string, name: string): Promise<MarketplacePlugin>;

  getPluginConfigAuthorization?(
    namespace: string,
    name: string,
  ): Promise<{ read: 'ALLOW' | 'DENY'; write: 'ALLOW' | 'DENY' }>;

  getPluginConfigByName?(
    namespace: string,
    name: string,
  ): Promise<{ configYaml: string }>;

  getPluginPackages(
    namespace: string,
    name: string,
  ): Promise<MarketplacePackage[]>;
}
