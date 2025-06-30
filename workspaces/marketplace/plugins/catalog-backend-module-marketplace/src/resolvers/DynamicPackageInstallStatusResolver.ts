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

import { durationToMilliseconds } from '@backstage/types';
import {
  MarketplacePackage,
  MarketplacePackageInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { DynamicPluginProvider } from '@backstage/backend-dynamic-feature-service';
import { DynamicPluginsService } from './DynamicPluginsService';
import { LoggerService } from '@backstage/backend-plugin-api';
import semver from 'semver';
import { stringifyEntityRef } from '@backstage/catalog-model';

/**
 * @public
 */
export type Plugins = {
  [pluginName: string]: string; // name: version
};

/**
 * @public
 */
export type CachedPlugins = {
  plugins: Plugins;
  cachedTime: number;
};

/**
 * @public
 */
export class DynamicPackageInstallStatusResolver {
  private readonly pluginProvider: DynamicPluginProvider;
  private readonly logger: LoggerService;
  private readonly dynamicPluginsService: DynamicPluginsService;
  private readonly cacheTTLMilliseconds = durationToMilliseconds({
    minutes: 1,
  });
  private _cachedPlugins?: CachedPlugins;

  constructor(deps: {
    logger: LoggerService;
    pluginProvider: DynamicPluginProvider;
    dynamicPluginsService: DynamicPluginsService;
  }) {
    const { logger, pluginProvider, dynamicPluginsService } = deps;
    this.logger = logger;
    this.pluginProvider = pluginProvider;
    this.dynamicPluginsService = dynamicPluginsService;
  }

  private get cachedPlugins(): CachedPlugins {
    if (!this._cachedPlugins || this.isExpired(this._cachedPlugins)) {
      const plugins = this.pluginProvider.plugins().reduce((acc, plugin) => {
        acc[plugin.name] = plugin.version;
        return acc;
      }, {} as Plugins);

      this._cachedPlugins = { plugins, cachedTime: Date.now() };
    }
    return this._cachedPlugins;
  }

  /**
   * Determines if cached data is expired based on TTL
   *
   * @param cachedData - The cached data for this entity
   * @returns True if data is expired
   */
  private isExpired(cachedData: CachedPlugins): boolean {
    const elapsed = Date.now() - cachedData.cachedTime;
    return elapsed > this.cacheTTLMilliseconds;
  }

  public getPackageInstallStatus(
    marketplacePackage: MarketplacePackage,
  ): MarketplacePackageInstallStatus | undefined {
    if (!marketplacePackage.spec?.packageName) {
      this.logger.warn(
        `Entity ${stringifyEntityRef(marketplacePackage)} missing 'entity.spec.packageName', unable to determine 'spec.installStatus'`,
      );
      return undefined;
    }
    if (!marketplacePackage.spec?.dynamicArtifact) {
      this.logger.warn(
        `Entity ${stringifyEntityRef(marketplacePackage)} missing 'entity.spec.dynamicArtifact', unable to determine 'spec.installStatus'`,
      );
      return undefined;
    }
    const versionRange = marketplacePackage.spec.version;

    // account for wrapper names
    let transformedName = marketplacePackage.spec.packageName
      .replace('@', '')
      .replace(/\//g, '-');
    if (transformedName.includes('backend')) {
      transformedName += '-dynamic';
    }

    for (const packageName of [
      marketplacePackage.spec.packageName,
      transformedName,
    ]) {
      if (packageName in this.cachedPlugins.plugins) {
        const installedVersion = this.cachedPlugins.plugins[packageName];
        if (!versionRange || semver.satisfies(installedVersion, versionRange)) {
          return MarketplacePackageInstallStatus.Installed;
        }
        return MarketplacePackageInstallStatus.UpdateAvailable;
      }
    }

    if (
      this.dynamicPluginsService.isPackageDisabledViaConfig(marketplacePackage)
    ) {
      this.logger.info(
        `${marketplacePackage.spec?.dynamicArtifact} is disabled`,
      );
      return MarketplacePackageInstallStatus.Disabled;
    }

    return MarketplacePackageInstallStatus.NotInstalled;
  }
}
