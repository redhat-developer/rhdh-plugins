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

import { createApiRef } from '@backstage/core-plugin-api';

import { MarketplaceApi } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

export const marketplaceApiRef = createApiRef<MarketplaceApi>({
  id: 'plugin.extensions.api-ref',
});

export type DynamicPluginInfo = {
  name: string;
  version: string;
  role: string;
  platform: string;
};
export interface DynamicPluginsInfoApi {
  listLoadedPlugins(): Promise<DynamicPluginInfo[]>;
}

export const dynamicPluginsInfoApiRef = createApiRef<DynamicPluginsInfoApi>({
  id: 'plugin.extensions.dynamic-plugins-info',
});
