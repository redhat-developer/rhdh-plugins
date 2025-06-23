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

import fs from 'fs';

import { Document, isMap, parseDocument } from 'yaml';
import {
  MarketplacePackage,
  MarketplacePackageInstallStatus,
  type MarketplacePackageStatus,
  type MarketplacePluginStatus,
  MarketplacePlugin,
  MarketplaceApi,
  MarketplacePluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { DEFAULT_NAMESPACE } from '@backstage/catalog-model';
import path from 'path';
import type { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import { findPaths } from '@backstage/cli-common';

export class DynamicPluginsService {
  private readonly marketplaceApi: MarketplaceApi;
  private readonly config: Document;

  private constructor(marketplaceApi: MarketplaceApi, config?: Document) {
    this.marketplaceApi = marketplaceApi;
    this.config = config ?? new Document();
  }

  static fromConfig(deps: {
    config: Config;
    logger: LoggerService;
    marketplaceApi: MarketplaceApi;
  }): DynamicPluginsService {
    const { config, logger, marketplaceApi } = deps;
    const dynamicPluginsRoot = config.getOptionalString(
      'dynamicPlugins.rootDirectory',
    );

    if (!dynamicPluginsRoot) {
      logger.info(`'dynamicPlugins.rootDirectory' is missing`);
      return new DynamicPluginsService(marketplaceApi);
    }

    // eslint-disable-next-line no-restricted-syntax
    const backstageRoot = findPaths(__dirname).targetRoot;
    const dynamicPluginsConfigFile = 'dynamic-plugins.final.yaml';
    const dynamicPluginsConfigFilePath = path.isAbsolute(dynamicPluginsRoot)
      ? path.resolve(dynamicPluginsRoot, dynamicPluginsConfigFile)
      : path.resolve(
          backstageRoot,
          dynamicPluginsRoot,
          dynamicPluginsConfigFile,
        );

    if (!fs.existsSync(dynamicPluginsConfigFilePath)) {
      logger.warn(`File '${dynamicPluginsConfigFilePath}' is missing`);
      return new DynamicPluginsService(marketplaceApi);
    }

    const rawContent = fs.readFileSync(dynamicPluginsConfigFilePath, 'utf-8');
    const pluginsConfig = parseDocument(rawContent);
    return new DynamicPluginsService(marketplaceApi, pluginsConfig);
  }

  public async getPluginDynamicArtifacts(
    plugin: MarketplacePlugin,
  ): Promise<Set<string>> {
    const marketplacePackages = await this.marketplaceApi.getPluginPackages(
      plugin.metadata.namespace ?? DEFAULT_NAMESPACE,
      plugin.metadata.name,
    );

    return new Set(
      marketplacePackages.flatMap(p =>
        p.spec?.dynamicArtifact ? [p.spec.dynamicArtifact] : [],
      ),
    );
  }

  private getPackageInstallStatus(
    marketplacePackage: MarketplacePackage,
  ): MarketplacePackageInstallStatus {
    return (
      marketplacePackage.spec?.installStatus ??
      MarketplacePackageInstallStatus.NotInstalled
    );
  }

  private getPackageDynamicArtifact(
    marketplacePackage: MarketplacePackage,
  ): string {
    const dynamicArtifact = marketplacePackage.spec?.dynamicArtifact;

    if (!dynamicArtifact) {
      throw new Error(
        `Package ${marketplacePackage.metadata.name} is missing 'spec.dynamicArtifact'`,
      );
    }
    return dynamicArtifact;
  }

  private isPackageDisabledViaConfig(packageDynamicArtifact: string): boolean {
    const entry = this.config.get(packageDynamicArtifact);
    return !(isMap(entry) && entry.get('disabled') === false);
  }

  packageStatus(
    marketplacePackage: MarketplacePackage,
  ): MarketplacePackageStatus {
    const configDisabled = this.isPackageDisabledViaConfig(
      this.getPackageDynamicArtifact(marketplacePackage),
    );
    const installStatus = this.getPackageInstallStatus(marketplacePackage);
    return {
      installStatus,
      disabled:
        configDisabled ||
        installStatus === MarketplacePackageInstallStatus.NotInstalled, // local installation overwrites configDisabled
    };
  }

  async pluginStatus(
    marketplacePlugin: MarketplacePlugin,
  ): Promise<MarketplacePluginStatus> {
    const pluginPackages = await this.marketplaceApi.getPluginPackages(
      marketplacePlugin.metadata.namespace ?? DEFAULT_NAMESPACE,
      marketplacePlugin.metadata.name,
    );
    const installStatus = pluginPackages.reduce<MarketplacePluginInstallStatus>(
      (current, p) => {
        const newPackageStatus = this.getPackageInstallStatus(p);
        // PartiallyInstalled
        if (
          current === MarketplacePluginInstallStatus.PartiallyInstalled ||
          ([
            MarketplacePluginInstallStatus.Installed,
            MarketplacePluginInstallStatus.UpdateAvailable,
          ].includes(current) &&
            newPackageStatus === MarketplacePackageInstallStatus.NotInstalled)
        ) {
          return MarketplacePluginInstallStatus.PartiallyInstalled;
        }
        // UpdateAvailable
        if (
          current === MarketplacePluginInstallStatus.UpdateAvailable ||
          newPackageStatus === MarketplacePackageInstallStatus.UpdateAvailable
        ) {
          return MarketplacePluginInstallStatus.UpdateAvailable;
        }
        // Installed
        if (
          current === MarketplacePluginInstallStatus.NotInstalled &&
          newPackageStatus === MarketplacePackageInstallStatus.Installed
        ) {
          return MarketplacePluginInstallStatus.Installed;
        }
        return current;
      },
      MarketplacePluginInstallStatus.NotInstalled,
    );
    // plugin is enabled if any of its packages is not disabled
    const disabled = pluginPackages.reduce((current, p) => {
      return current === false ? current : this.packageStatus(p).disabled;
    }, true);

    return { installStatus, disabled };
  }
}
