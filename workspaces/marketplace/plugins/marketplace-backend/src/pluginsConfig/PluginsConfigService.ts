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
import { PluginsConfigReader } from './PluginsConfigReader';
import { InputError } from '@backstage/errors';

export class PluginsConfigService {
  private packageConfigs?: DynamicPackageConfig[];

  constructor(
    pluginsConfigReader: PluginsConfigReader,
    private readonly marketplaceApi: MarketplaceApi,
  ) {
    this.packageConfigs = pluginsConfigReader.parse();
  }

  private get requiredPackageConfigs(): DynamicPackageConfig[] {
    if (!this.packageConfigs) {
      throw new InputError("Missing 'marketplace.dynamicPluginsConfig'");
    }
    return this.packageConfigs;
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
    return this.requiredPackageConfigs.find(
      c => c.package === packageDynamicArtifact,
    );
  }

  async getPluginConfig(
    plugin: MarketplacePlugin,
  ): Promise<DynamicPluginConfig | undefined> {
    const dynamicArtifacts = await this.getPluginDynamicArtifacts(plugin);
    return this.requiredPackageConfigs.filter(c =>
      dynamicArtifacts.has(c.package),
    );
  }
}
