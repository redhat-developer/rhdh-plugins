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

import {
  DynamicPackageConfig,
  DynamicPluginConfig,
  MarketplaceApi,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { PluginsConfigFileHandler } from './PluginsConfigFileHandler';

export interface PluginsConfig {
  getPackageConfig(dynamicArtifact: string): DynamicPackageConfig | undefined;
  getPluginConfig(
    plugin: MarketplacePlugin,
  ): Promise<DynamicPluginConfig | undefined>;
}

export class PluginsConfigService implements PluginsConfig {
  constructor(
    private readonly pluginsConfigFileHandler: PluginsConfigFileHandler,
    private readonly marketplaceApi: MarketplaceApi,
  ) {
    pluginsConfigFileHandler.parse();
  }

  private async getPluginDynamicArtifacts(
    plugin: MarketplacePlugin,
  ): Promise<Set<string>> {
    const marketplacePackages = await this.marketplaceApi.getPluginPackages(
      plugin.metadata.namespace!,
      plugin.metadata.name,
    );

    return new Set(
      marketplacePackages.flatMap(p =>
        p.spec?.dynamicArtifact ? [p.spec.dynamicArtifact] : [],
      ),
    );
  }

  getPackageConfig(
    packageDynamicArtifact: string,
  ): DynamicPackageConfig | undefined {
    return this.pluginsConfigFileHandler.getPackage(packageDynamicArtifact);
  }

  async getPluginConfig(
    plugin: MarketplacePlugin,
  ): Promise<DynamicPluginConfig> {
    const dynamicArtifacts = await this.getPluginDynamicArtifacts(plugin);

    const result: DynamicPluginConfig = [];
    for (const dynamicArtifact of dynamicArtifacts) {
      const p = this.pluginsConfigFileHandler.getPackage(dynamicArtifact);
      if (p) {
        result.push(p);
      }
    }
    return result;
  }
}
