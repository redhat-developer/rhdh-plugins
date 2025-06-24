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

import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorCache,
  CatalogProcessorEmit,
} from '@backstage/plugin-catalog-node';
import { durationToMilliseconds } from '@backstage/types';
import {
  MarketplacePackageInstallStatus,
  isMarketplacePackage,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import type { DynamicPlugin } from '@backstage/backend-dynamic-feature-service';

/**
 * @public
 */
export type CachedData = {
  plugins: string[];
  cachedTime: number;
};

/**
 * @public
 */
export class DynamicPackageInstallStatusProcessor implements CatalogProcessor {
  private discovery: DiscoveryService;
  private auth: AuthService;
  private readonly cacheTTLMilliseconds = durationToMilliseconds({
    minutes: 1,
  });

  constructor(discovery: DiscoveryService, auth: AuthService) {
    this.discovery = discovery;
    this.auth = auth;
  }

  // Return processor name
  getProcessorName(): string {
    return 'DynamicPackageInstallStatusProcessor';
  }

  async getInstalledPlugins(): Promise<DynamicPlugin[]> {
    const dynamicPluginsInfoUrl = await this.discovery.getBaseUrl(
      'dynamic-plugins-info',
    );

    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'dynamic-plugins-info',
    });

    const response = await fetch(`${dynamicPluginsInfoUrl}/loaded-plugins`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    return await response.json();
  }

  async getCachedPlugins(
    cache: CatalogProcessorCache,
    entityRef: string,
  ): Promise<CachedData> {
    let cachedData = (await cache.get(entityRef)) as CachedData;
    if (!cachedData || this.isExpired(cachedData)) {
      const pluginsList = await this.getInstalledPlugins();
      const plugins = pluginsList.map(plugin => plugin.name);
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

  async preProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    _emit: CatalogProcessorEmit,
    _originLocation: LocationSpec,
    cache: CatalogProcessorCache,
  ): Promise<Entity> {
    if (isMarketplacePackage(entity)) {
      if (
        entity.spec?.packageName &&
        (!entity.spec?.installStatus ||
          entity.spec.installStatus ===
            MarketplacePackageInstallStatus.NotInstalled)
      ) {
        const entityRef = stringifyEntityRef(entity);

        const data = await this.getCachedPlugins(cache, entityRef);
        const installedPackageNames = data.plugins;

        // account for wrapper names
        let transformedName = entity.spec.packageName
          .replace('@', '')
          .replace(/\//g, '-');
        if (transformedName.includes('backend')) {
          transformedName += '-dynamic';
        }
        if (
          [entity.spec.packageName, transformedName].some(packageName =>
            installedPackageNames.includes(packageName),
          )
        ) {
          return {
            ...entity,
            spec: {
              ...entity.spec,
              installStatus: MarketplacePackageInstallStatus.Installed,
            },
          };
        }
      }
    }

    return entity;
  }
}
