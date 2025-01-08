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

import { Entity } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';

/**
 * @public
 */
export interface MarketplacePluginEntry extends Entity {
  spec?: MarketplacePluginSpec;
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
export type MarketplacePackage = {
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
  packages?: (string | MarketplacePackage)[];
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
