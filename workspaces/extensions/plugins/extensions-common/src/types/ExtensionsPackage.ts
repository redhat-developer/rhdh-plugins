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
import { ExtensionsSupport } from './ExtensionsSupport';

/**
 * @public
 */
export interface ExtensionsPackage extends Entity {
  spec?: ExtensionsPackageSpec;
}

// /**
//  * @public
//  * @deprecated Use ExtensionsPackage instead
//  */
// export type ExtensionsPackage = ExtensionsPackage;

/**
 * @public
 */
export enum ExtensionsPackageInstallStatus {
  NotInstalled = 'NotInstalled',
  Installed = 'Installed',
  Disabled = 'Disabled',
  UpdateAvailable = 'UpdateAvailable',
}

/**
 * @public
 * @deprecated Use ExtensionsPackageInstallStatus instead
 */
// export const ExtensionsPackageInstallStatus = ExtensionsPackageInstallStatus;

/**
 * @public
 */
export interface ExtensionsPackageSpec extends JsonObject {
  packageName?: string;
  version?: string;

  dynamicArtifact?: string;
  author?: string;
  support?: ExtensionsSupport;
  lifecycle?: string;
  role?: string;
  supportedVersions?: string;
  /**
   * @deprecated use role and supportedVersions under spec instead
   */
  backstage?: ExtensionsPackageBackstage;
  appConfigExamples?: ExtensionsPackageSpecAppConfigExample[];
  owner?: string;
  partOf?: string[];
  integrity?: string;
  installStatus?: ExtensionsPackageInstallStatus;
}

// /**
//  * @public
//  * @deprecated Use ExtensionsPackageSpec instead
//  */
// export type ExtensionsPackageSpec = ExtensionsPackageSpec;

/**
 * @public
 */
export interface ExtensionsPackageSpecAppConfigExample extends JsonObject {
  title: string;
  content: string | JsonObject;
}

/**
 * @public
 * @deprecated Use ExtensionsPackageSpecAppConfigExample instead
 */
// export type ExtensionsPackageSpecAppConfigExample = ExtensionsPackageSpecAppConfigExample;

/**
 * @public
 */
export interface ExtensionsPackageAppConfigExamples {
  [key: string]: ExtensionsPackageSpecAppConfigExample[];
}

/**
 * @public
 */
export interface ExtensionsPackageBackstage extends JsonObject {
  role?: string;
  supportedVersions?: string;
}

// /**
//  * @public
//  * @deprecated Use ExtensionsPackageBackstage instead
//  */
// export type ExtensionsPackageBackstage = ExtensionsPackageBackstage;

/**
 * @public
 */
export function isExtensionsPackage(
  entity?: Entity,
): entity is ExtensionsPackage {
  return (
    !!entity &&
    (entity.apiVersion === EXTENSIONS_API_VERSION ||
      entity.apiVersion === 'marketplace.backstage.io/v1alpha1') &&
    entity.kind === ExtensionsKind.Package
  );
}

// /**
//  * @public
//  * @deprecated Use isExtensionsPackage instead
//  */
// // export const isExtensionsPackage = isExtensionsPackage;
