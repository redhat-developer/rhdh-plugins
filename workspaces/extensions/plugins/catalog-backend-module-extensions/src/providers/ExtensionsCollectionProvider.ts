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
import {
  ExtensionsCollection,
  ExtensionsKind,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { BaseEntityProvider } from './BaseEntityProvider';

/**
 * @public
 */
export class ExtensionsCollectionProvider extends BaseEntityProvider<ExtensionsCollection> {
  getKind(): string {
    return ExtensionsKind.Collection;
  }

  getProviderName(): string {
    return 'extensions-collection-provider';
  }
}

/**
 * @public
 * @deprecated Use ExtensionsCollectionProvider instead
 */
export const MarketplaceCollectionProvider = ExtensionsCollectionProvider;
