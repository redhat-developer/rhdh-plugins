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

import type { Entity } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';

import { EXTENSIONS_API_VERSION } from '../consts';

import { ExtensionsKind } from './ExtensionsKind';
import { ExtensionsAuthor } from './ExtensionsAuthor';
import { ExtensionsSupport } from './ExtensionsSupport';

/**
 * @public
 */
export interface ExtensionsPlugin extends Entity {
  spec?: ExtensionsPluginSpec;
}

/**
 * @public
 * @deprecated Use ExtensionsPlugin instead
 */
// export type ExtensionsPlugin = ExtensionsPlugin;

/**
 * @public
 */
export enum DocumentationType {
  about = 'about',
  usage = 'usage',
  installation = 'installation',
  configuration = 'configuration',
}

/**
 * @public
 */
export interface Documentation extends JsonObject {
  type: DocumentationType;
  markdown: string;
  title?: string;
  tabTitle?: string;
}

/**
 * @public
 */
export enum AssetType {
  icon = 'icon',
  image = 'image',
}

/**
 * @public
 */
export interface Asset extends JsonObject {
  type: AssetType;
  filename: string;
  originUri: string;
  encodedData?: string;
}

/**
 * @public
 */
export enum ExtensionsPluginInstallStatus {
  NotInstalled = 'NotInstalled',
  Installed = 'Installed',
  PartiallyInstalled = 'PartiallyInstalled',
  Disabled = 'Disabled',
  UpdateAvailable = 'UpdateAvailable',
}

/**
 * @public
 * @deprecated Use ExtensionsPluginInstallStatus instead
 */
// export const ExtensionsPluginInstallStatus = ExtensionsPluginInstallStatus;

/**
 * @public
 */
export interface ExtensionsPluginSpec extends JsonObject {
  icon?: string;

  /**
   * @deprecated use author instead
   */
  developer?: string;
  author?: string;
  authors?: ExtensionsAuthor[];
  support?: ExtensionsSupport;

  packages?: string[];
  categories?: string[];
  highlights?: string[];

  description?: string;
  installation?: string;
  documentation?: Documentation[];
  assets?: Asset[];

  installStatus?: ExtensionsPluginInstallStatus;
}

// /**
//  * @public
//  * @deprecated Use ExtensionsPluginSpec instead
//  */
// export type ExtensionsPluginSpec = ExtensionsPluginSpec;

/**
 * @public
 */
export function isExtensionsPlugin(
  entity?: Entity,
): entity is ExtensionsPlugin {
  return (
    !!entity &&
    (entity.apiVersion === EXTENSIONS_API_VERSION ||
      entity.apiVersion === 'marketplace.backstage.io/v1alpha1') &&
    entity.kind === ExtensionsKind.Plugin
  );
}

/**
 * @public
 * @deprecated Use isExtensionsPlugin instead
 */
export const isMarketplacePlugin = isExtensionsPlugin;
