/*
 * Copyright 2025 The Backstage Authors
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
import { DiscoveryService } from '@backstage/backend-plugin-api';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import {
  CatalogProcessor,
  CatalogProcessorCache,
} from '@backstage/plugin-catalog-node';
import { durationToMilliseconds } from '@backstage/types';
import {
  InstallStatus,
  MARKETPLACE_API_VERSION,
  MarketplaceKinds,
  MarketplacePluginEntry,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

interface CachedData {
  [key: string]: number | string[];
  plugins: any;
  cachedTime: number;
}
/**
 * @public
 */
export class DynamicPluginInstallStatusProcessor implements CatalogProcessor {
  private discovery: DiscoveryService;
  private readonly cacheTTLMilliseconds = durationToMilliseconds({
    minutes: 1,
  });

  constructor(discovery: DiscoveryService) {
    this.discovery = discovery;
  }

  // Return processor name
  getProcessorName(): string {
    return 'DynamicPluginInstallStatusProcessor';
  }

  async getInstalledPlugins() {
    const scalprumUrl = await this.discovery.getBaseUrl('scalprum');
    const response = await fetch(`${scalprumUrl}/plugins`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJ0eXAiOiJ2bmQuYmFja3N0YWdlLnVzZXIiLCJhbGciOiJFUzI1NiIsImtpZCI6IjJlYmY1ZmI4LTdhNjMtNDM3NS05YTJkLTNlNjIzZTQxNWZjNSJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcwMDcvYXBpL2F1dGgiLCJzdWIiOiJ1c2VyOmRldmVsb3BtZW50L2d1ZXN0IiwiZW50IjpbInVzZXI6ZGV2ZWxvcG1lbnQvZ3Vlc3QiXSwiYXVkIjoiYmFja3N0YWdlIiwiaWF0IjoxNzM1OTE3Mzc0LCJleHAiOjE3MzU5MjA5NzQsInVpcCI6IlEwOV9LcVBOTWJwdFBvZldBT1Mzc01XTUgzQ0tkVEZUaHdDTWVydUVfalRnbWpGTEw4cndRalp1ck8tTEpiY0tfa2dJSURZZ2J5ZWdDZ01NQ3lZeEx3In0.rQUrGNa4zx6G--YuKOH5Pu5W8vKyz9hH2e0DNzltIr_vYvUN9Ljpn0SM7nKg25Q9di0iU1u7mvgOb7Kcru72QQ',
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

  private async getCachedPlugins(
    cache: CatalogProcessorCache,
    entityRef: string,
  ): Promise<any> {
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
    _: any,
    __: any,
    ___: any,
    cache: CatalogProcessorCache,
  ): Promise<MarketplacePluginEntry> {
    if (
      entity.apiVersion === MARKETPLACE_API_VERSION &&
      entity.kind === MarketplaceKinds.plugin
    ) {
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
