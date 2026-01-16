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

import {
  DEPRECATED_EXTENSIONS_API_VERSION,
  EXTENSIONS_API_VERSION,
} from '../consts';

import { ExtensionsKind } from './ExtensionsKind';
import { ExtensionsSupport } from './ExtensionsSupport';

/**
 * @public
 */
export interface ExtensionsPackage extends Entity {
  spec?: ExtensionsPackageSpec;
}

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

/**
 * @public
 */
export interface ExtensionsPackageSpecAppConfigExample extends JsonObject {
  title: string;
  content: string | JsonObject;
}

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

/**
 * @public
 */
export function isExtensionsPackage(
  entity?: Entity,
): entity is ExtensionsPackage {
  return (
    !!entity &&
    (entity.apiVersion === EXTENSIONS_API_VERSION ||
      entity.apiVersion === DEPRECATED_EXTENSIONS_API_VERSION) &&
    entity.kind === ExtensionsKind.Package
  );
}
