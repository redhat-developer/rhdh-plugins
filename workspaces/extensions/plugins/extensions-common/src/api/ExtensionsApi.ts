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
  QueryEntitiesInitialRequest,
} from '@backstage/catalog-client';

import {
  ConfigurationResponse,
  ExtensionsCollection,
  ExtensionsPackage,
  ExtensionsPlugin,
  NodeEnvironmentType,
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
export interface ExtensionsApi {
  getCollections(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<ExtensionsCollection>>;

  getCollectionsFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse>;

  getCollectionByName(
    namespace: string,
    name: string,
  ): Promise<ExtensionsCollection>;

  getCollectionPlugins(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin[]>;

  getPackages(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<ExtensionsPackage>>;

  getPackagesFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse>;

  getPackageByName(namespace: string, name: string): Promise<ExtensionsPackage>;

  getPackageConfigByName?(
    namespace: string,
    name: string,
  ): Promise<ConfigurationResponse>;

  installPackage?(
    namespace: string,
    name: string,
    configYaml: string,
  ): Promise<{ status: string }>;

  disablePackage?(
    namespace: string,
    name: string,
    disabled: boolean,
  ): Promise<{ status: string }>;

  getPlugins(
    request: GetEntitiesRequest,
  ): Promise<GetEntitiesResponse<ExtensionsPlugin>>;

  getPluginFacets(
    request: GetEntityFacetsRequest,
  ): Promise<GetEntityFacetsResponse>;

  getPluginByName(namespace: string, name: string): Promise<ExtensionsPlugin>;

  getPluginConfigAuthorization?(
    namespace: string,
    name: string,
  ): Promise<{ read: 'ALLOW' | 'DENY'; write: 'ALLOW' | 'DENY' }>;

  getExtensionsConfiguration?(): Promise<{ enabled: boolean }>;

  getNodeEnvironment?(): Promise<{ nodeEnv: NodeEnvironmentType }>;

  getPluginConfigByName?(
    namespace: string,
    name: string,
  ): Promise<ConfigurationResponse>;

  installPlugin?(
    namespace: string,
    name: string,
    configYaml: string,
  ): Promise<{ status: string }>;

  disablePlugin?(
    namespace: string,
    name: string,
    disabled: boolean,
  ): Promise<{ status: string }>;

  getPluginPackages(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPackage[]>;

  getPackagePlugins(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin[]>;
}

// /**
//  * @public
//  * @deprecated Use ExtensionsApi instead
//  */
// export type ExtensionsApi = ExtensionsApi;
