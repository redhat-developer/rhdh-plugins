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
  InstallStatus,
  MARKETPLACE_API_VERSION,
  MarketplaceKinds,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

/**
 * @public
 */
export type CachedData = {
  [key: string]: number | string[];
  plugins: any;
  cachedTime: number;
};

/**
 * @public
 */
export class DynamicPluginInstallStatusProcessor implements CatalogProcessor {
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
    return 'DynamicPluginInstallStatusProcessor';
  }

  async getInstalledPlugins() {
    const scalprumUrl = await this.discovery.getBaseUrl('scalprum');

    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });

    const response = await fetch(`${scalprumUrl}/plugins`, {
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
      const plugins = await this.getInstalledPlugins();
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
  ): Promise<MarketplacePlugin> {
    if (
      entity.apiVersion === MARKETPLACE_API_VERSION &&
      entity.kind === MarketplaceKinds.plugin
    ) {
      if (entity.spec?.installStatus === InstallStatus.Installed) {
        return entity;
      }

      const entityRef = stringifyEntityRef(entity);

      const data = await this.getCachedPlugins(cache, entityRef);
      const installedPluginNames = Object.keys(data?.plugins);
      return {
        ...entity,
        spec: {
          ...entity.spec,
          installStatus: installedPluginNames.find(plg =>
            plg.toLowerCase().includes(entity.metadata.name),
          )
            ? InstallStatus.Installed
            : InstallStatus.NotInstalled,
        },
      };
    }

    return entity;
  }
}
