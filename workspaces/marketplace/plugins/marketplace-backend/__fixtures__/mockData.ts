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
import { MarketplaceKind } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

export const mockCollections = [
  {
    apiVersion: 'marketplace.backstage.io/v1alpha1',
    kind: MarketplaceKind.Collection,
    metadata: {
      namespace: 'default',
      name: 'test-featured-plugins',
    },
    spec: {
      plugins: ['plugin1', 'plugin2'],
    },
    relations: [
      { type: 'hasPart', targetRef: 'plugin:plugin1' },
      { type: 'hasPart', targetRef: 'plugin:plugin2' },
    ],
  },
];

export const mockPlugins = [
  {
    apiVersion: 'marketplace.backstage.io/v1alpha1',
    kind: MarketplaceKind.Plugin,
    metadata: {
      namespace: 'default',
      name: 'plugin1',
    },
  },
  {
    apiVersion: 'marketplace.backstage.io/v1alpha1',
    kind: MarketplaceKind.Plugin,
    metadata: {
      namespace: 'default',
      name: 'plugin2',
    },
  },
];
