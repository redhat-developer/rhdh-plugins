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

import { Entity } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';

import { MARKETPLACE_API_VERSION } from '../consts';

import { MarketplaceKind } from './MarketplaceKind';

/**
 * @public
 */
export interface MarketplacePlugin extends Entity {
  spec?: MarketplacePluginSpec;
}

/**
 * @public
 */
export enum DocumentationType {
  usage = 'usage',
  about = 'about',
  configuration = 'configuration',
  installation = 'installation',
}

/**
 * @public
 */
export enum AssetType {
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
export interface Documentation extends JsonObject {
  type: DocumentationType;
  markdown: string;
  title?: string;
  tabTitle?: string;
}

/**
 * @public
 */
export interface MarketplacePluginSpec extends JsonObject {
  packages?: string[];
  icon?: string;
  categories?: string[];
  developer?: string;
  highlights?: string[];
  /* @deprecated */
  description?: string;
  /* @deprecated */
  installation?: {
    markdown?: string;
    appconfig?: string;
  };
  documentation?: Documentation[];
  assets?: Asset[];
}

export function isMarketplacePlugin(
  entity?: Entity,
): entity is MarketplacePlugin {
  return (
    !!entity &&
    entity.apiVersion === MARKETPLACE_API_VERSION &&
    entity.kind === MarketplaceKind.Plugin
  );
}
