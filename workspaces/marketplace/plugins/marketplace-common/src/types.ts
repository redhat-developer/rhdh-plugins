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

/**
 * @public
 */
export interface MarketplacePluginEntry {
  metadata: MarketplacePluginMetadata;
  spec?: MarketplacePluginSpec;
}

/**
 * @public
 */
export interface MarketplacePluginList {
  metadata: MarketplacePluginMetadata;
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
}

/**
 * @public
 */
export interface MarketplacePluginMetadata {
  // primary identifier
  name: string;

  // primary display name
  title: string;

  description?: string;

  // TODO: support for light/dark icon

  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  tags?: string[];
  links?: MarketplacePluginLink[];
}

/**
 * @public
 */
export interface MarketplacePluginLink {
  url: string;
  title?: string;
  icon?: string;
  type?: string;
}

/**
 * @public
 */
export interface MarketplacePluginSpec {
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
