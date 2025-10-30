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

import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorCache,
  CatalogProcessorEmit,
} from '@backstage/plugin-catalog-node';
import { durationToMilliseconds } from '@backstage/types';
import {
  ExtensionsPackage,
  ExtensionsPackageInstallStatus,
  isExtensionsPackage,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { DynamicPluginProvider } from '@backstage/backend-dynamic-feature-service';
import { LoggerService } from '@backstage/backend-plugin-api';
import semver from 'semver';

/**
 * @public
 */
export type Plugins = {
  [pluginName: string]: string; // name: version
};

/**
 * @public
 */
export type CachedData = {
  plugins: Plugins;
  cachedTime: number;
};

/**
 * @public
 */
export class DynamicPackageInstallStatusProcessor implements CatalogProcessor {
  private readonly pluginProvider: DynamicPluginProvider;
  private readonly logger: LoggerService;
  private readonly cacheTTLMilliseconds = durationToMilliseconds({
    minutes: 1,
  });

  constructor(deps: {
    logger: LoggerService;
    pluginProvider: DynamicPluginProvider;
  }) {
    const { logger, pluginProvider } = deps;
    this.logger = logger;
    this.pluginProvider = pluginProvider;
  }

  // Return processor name
  getProcessorName(): string {
    return 'DynamicPackageInstallStatusProcessor';
  }

  async getCachedPlugins(
    cache: CatalogProcessorCache,
    entityRef: string,
  ): Promise<CachedData> {
    let cachedData = (await cache.get(entityRef)) as CachedData;
    if (!cachedData || this.isExpired(cachedData)) {
      const plugins = this.pluginProvider.plugins().reduce((acc, plugin) => {
        acc[plugin.name] = plugin.version;
        return acc;
      }, {} as Plugins);

      cachedData = { plugins, cachedTime: Date.now() };
      await cache.set(entityRef, cachedData);
    }

    return cachedData;
  }

  /**
   * Determines if cached data is expired based on TTL
   *
   * @param cachedData - The cached data for this entity
   * @returns True if data is expired
   */
  private isExpired(cachedData: CachedData): boolean {
    const elapsed = Date.now() - cachedData.cachedTime;
    return elapsed > this.cacheTTLMilliseconds;
  }

  private getPackageInstallStatus(
    extensionsPackage: ExtensionsPackage,
    installedPackages: Plugins,
  ): ExtensionsPackageInstallStatus | undefined {
    if (!extensionsPackage.spec?.packageName) {
      this.logger.debug(
        `Entity ${stringifyEntityRef(extensionsPackage)} is missing 'spec.packageName', unable to determine 'spec.installStatus'`,
      );
      return undefined;
    }

    const versionRange = extensionsPackage.spec.version;

    // account for possible names
    const nameOptions = [extensionsPackage.spec.packageName];
    const transformedName = extensionsPackage.spec.packageName
      .replace('@', '')
      .replace(/\//g, '-');
    nameOptions.push(transformedName);
    if (!extensionsPackage.spec.packageName.includes('dynamic')) {
      nameOptions.push(`${transformedName}-dynamic`);
      nameOptions.push(`${extensionsPackage.spec.packageName}-dynamic`);
    }
    for (const packageName of nameOptions) {
      if (packageName in installedPackages) {
        const installedVersion = installedPackages[packageName];
        if (!versionRange || semver.satisfies(installedVersion, versionRange)) {
          return ExtensionsPackageInstallStatus.Installed;
        }
        return ExtensionsPackageInstallStatus.UpdateAvailable;
      }
    }

    if (!extensionsPackage.spec?.dynamicArtifact) {
      this.logger.debug(
        `Entity ${stringifyEntityRef(extensionsPackage)} is missing 'spec.dynamicArtifact', unable to determine 'spec.installStatus'`,
      );
      return undefined;
    }

    if (extensionsPackage.spec.dynamicArtifact.startsWith('./')) {
      return ExtensionsPackageInstallStatus.Disabled;
    }

    return ExtensionsPackageInstallStatus.NotInstalled;
  }

  async preProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    _emit: CatalogProcessorEmit,
    _originLocation: LocationSpec,
    cache: CatalogProcessorCache,
  ): Promise<Entity> {
    if (isExtensionsPackage(entity)) {
      if (!entity.spec?.packageName) {
        this.logger.debug(
          `Entity ${stringifyEntityRef(entity)} is missing 'spec.packageName', unable to determine 'spec.installStatus'`,
        );
        return entity;
      }

      if (
        !entity.spec?.installStatus ||
        entity.spec.installStatus ===
          ExtensionsPackageInstallStatus.NotInstalled
      ) {
        const entityRef = stringifyEntityRef(entity);
        const data = await this.getCachedPlugins(cache, entityRef);
        const installStatus = this.getPackageInstallStatus(
          entity,
          data.plugins,
        );

        if (installStatus) {
          return {
            ...entity,
            spec: {
              ...entity.spec,
              installStatus,
            },
          };
        }
      }
    }

    return entity;
  }
}
