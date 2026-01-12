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

/**
 * @public
 */
export interface ExtensionsCollection extends Entity {
  spec?: ExtensionsCollectionSpec;
}

/**
 * @public
 */
export interface ExtensionsCollectionSpec extends JsonObject {
  type?: 'curated';
  plugins?: string[];
}

/**
 * @public
 */
export function isExtensionsCollection(
  entity?: Entity,
): entity is ExtensionsCollection {
  return (
    !!entity &&
    (entity.apiVersion === EXTENSIONS_API_VERSION ||
      entity.apiVersion === DEPRECATED_EXTENSIONS_API_VERSION) &&
    entity.kind === ExtensionsKind.Collection
  );
}
