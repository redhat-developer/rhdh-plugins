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
  MarketplaceApi,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import {
  FileInstallationStorage,
  InstallationStorage,
} from './FileInstallationStorage';
import type { Config } from '@backstage/config';

export class InstallationDataService {
  private constructor(
    private readonly installationStorage: InstallationStorage,
    private readonly marketplaceApi: MarketplaceApi,
  ) {}

  static fromConfig(deps: {
    config: Config;
    marketplaceApi: MarketplaceApi;
  }): InstallationDataService {
    const { config, marketplaceApi } = deps;

    const storage = new FileInstallationStorage(
      config.getString('extensions.installation.saveToSingleFile.file'),
    );
    storage.initialize();
    return new InstallationDataService(storage, marketplaceApi);
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

  getPackageConfig(packageDynamicArtifact: string): string | undefined {
    return this.installationStorage.getPackage(packageDynamicArtifact);
  }

  async getPluginConfig(
    plugin: MarketplacePlugin,
  ): Promise<string | undefined> {
    const dynamicArtifacts = await this.getPluginDynamicArtifacts(plugin);
    return this.installationStorage.getPackages(dynamicArtifacts);
  }
}
