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

import { MARKETPLACE_API_VERSION } from '../consts';

import { MarketplaceKind } from './MarketplaceKind';

/**
 * @public
 */
export interface MarketplacePackage extends Entity {
  spec?: MarketplacePackageSpec;
}

/**
 * @public
 */
export enum MarketplacePackageInstallStatus {
  NotInstalled = 'NotInstalled',
  Installed = 'Installed',
  UpdateAvailable = 'UpdateAvailable',
}

/**
 * @public
 */
export interface MarketplacePackageSpec extends JsonObject {
  packageName?: string;
  version?: string;

  dynamicArtifact?: string;
  author?: string;
  support?: string;
  lifecycle?: string;
  role?: string;
  supportedVersions?: string;
  /**
   * @deprecated use role and supportedVersions under spec instead
   */
  backstage?: MarketplacePackageBackstage;
  appConfigExamples?: MarketplacePackageSpecAppConfigExample[];
  owner?: string;
  partOf?: string[];
  installStatus?: MarketplacePackageInstallStatus;
}

/**
 * @public
 */
export interface MarketplacePackageSpecAppConfigExample extends JsonObject {
  title: string;
  content: string | JsonObject;
}

/**
 * @public
 */
export interface MarketplacePackageBackstage extends JsonObject {
  role?: string;
  supportedVersions?: string;
}

/**
 * @public
 */
export function isMarketplacePackage(
  entity?: Entity,
): entity is MarketplacePackage {
  return (
    !!entity &&
    entity.apiVersion === MARKETPLACE_API_VERSION &&
    entity.kind === MarketplaceKind.Package
  );
}
