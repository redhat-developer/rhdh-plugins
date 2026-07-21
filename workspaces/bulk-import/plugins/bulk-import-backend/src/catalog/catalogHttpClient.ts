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

import type { AuthService, LoggerService } from '@backstage/backend-plugin-api';
import type { LocationEntity } from '@backstage/catalog-model';
import type { Config } from '@backstage/config';
import type { CatalogService } from '@backstage/plugin-catalog-node';

import { logErrorIfNeeded } from '../helpers';
import { filterLocations, getCatalogUrl } from './catalogUtils';
import { CatalogLocation } from './types';

export class CatalogHttpClient {
  private readonly logger: LoggerService;
  private readonly config: Config;
  private readonly auth: AuthService;
  private readonly catalog: CatalogService;

  constructor(deps: {
    logger: LoggerService;
    config: Config;
    auth: AuthService;
    catalog: CatalogService;
  }) {
    this.logger = deps.logger;
    this.config = deps.config;
    this.auth = deps.auth;
    this.catalog = deps.catalog;
  }

  private async getCredentials() {
    return this.auth.getOwnServiceCredentials();
  }

  // Wrapper for https://backstage.io/docs/features/software-catalog/software-catalog-api/#post-analyze-location
  async analyzeLocation(repoUrl: string): Promise<any[]> {
    this.logger.debug(`Forwarding request to analyze location: ${repoUrl}`);
    const response = await this.catalog.analyzeLocation(
      {
        location: {
          type: 'github',
          target: repoUrl,
        },
      },
      {
        credentials: await this.getCredentials(),
      },
    );
    return response.generateEntities ?? [];
  }

  async listCatalogUrlLocations(
    search?: string,
    pageNumber?: number,
    pageSize?: number,
  ): Promise<{
    uniqueCatalogUrlLocations: Map<string, CatalogLocation>;
    totalCount?: number;
  }> {
    // byId order: config, locations, other
    const byId = await this.listCatalogUrlLocationsById(
      search,
      pageNumber,
      pageSize,
    );
    const result = new Map<string, CatalogLocation>();

    for (const l of byId.locations) {
      if (!result.has(l.target)) {
        result.set(l.target, l);
      }
    }
    return {
      uniqueCatalogUrlLocations: result,
      totalCount: byId.totalCount,
    };
  }

  async listCatalogUrlLocationsById(
    search?: string,
    pageNumber?: number,
    pageSize?: number,
  ): Promise<{
    locations: CatalogLocation[];
    totalCount?: number;
  }> {
    const result = await Promise.all([
      this.listCatalogUrlLocationsFromConfig(search),
      this.listCatalogUrlLocationsByIdFromLocationsEndpoint(search),
      this.listCatalogUrlLocationEntitiesById(search, pageNumber, pageSize),
    ]);
    const locations = result.flatMap(u => u.locations);
    // we might have duplicate elements here
    const totalCount = result
      .map(l => l.totalCount ?? 0)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    return {
      locations,
      totalCount,
    };
  }

  async listCatalogUrlLocationsByIdFromLocationsEndpoint(
    search?: string,
  ): Promise<{
    locations: CatalogLocation[];
    totalCount?: number;
  }> {
    const { items: locations } = await this.catalog.getLocations(
      {},
      {
        credentials: await this.getCredentials(),
      },
    );
    if (!Array.isArray(locations)) {
      return { locations: [] };
    }
    const res = locations
      .filter(location => location.target && location.type === 'url')
      .map(location => {
        return {
          id: location.id,
          target: location.target,
          source: 'location',
        } as CatalogLocation;
      });
    const filtered = filterLocations(res, search);
    return { locations: filtered, totalCount: filtered.length };
  }

  listCatalogUrlLocationsFromConfig(search?: string): {
    locations: CatalogLocation[];
    totalCount?: number;
  } {
    const locationConfigs =
      this.config.getOptionalConfigArray('catalog.locations') ?? [];
    const res = locationConfigs
      .filter(
        location =>
          location.getOptionalString('target') &&
          location.getOptionalString('type') === 'url',
      )
      .map(location => {
        const target = location.getString('target');
        return {
          id: `app-config-location--${target}`,
          target,
          source: 'config',
        } as CatalogLocation;
      });
    const filtered = filterLocations(res, search);
    return { locations: filtered, totalCount: filtered.length };
  }

  async listCatalogUrlLocationEntitiesById(
    search?: string,
    _pageNumber?: number,
    _pageSize?: number,
  ): Promise<{
    locations: CatalogLocation[];
    totalCount?: number;
  }> {
    const result = await this.catalog.getEntities(
      {
        filter: {
          kind: 'Location',
        },
        // There is no query parameter to find entities with target URLs containing a string.
        // The existing filter does an exact matching. That's why we are retrieving this hard-coded high number of Locations.
        limit: 9999,
        offset: 0,
        order: { field: 'metadata.name', order: 'desc' },
      },
      {
        credentials: await this.getCredentials(),
      },
    );
    const locations = (result?.items ?? []) as LocationEntity[];
    const res = locations
      .filter(
        location => location.spec?.target && location.spec?.type === 'url',
      )
      .map(location => {
        return {
          id: location.metadata.uid,
          target: location.spec.target!,
          source: 'integration',
        } as CatalogLocation;
      });
    const filtered = filterLocations(res, search);
    return { locations: filtered, totalCount: filtered.length };
  }

  /**
   * verifyLocationExistence checks for the existence of the Location target.
   * Under the hood, it attempts to read the target URL and will return false if the target could not be found
   * and even if there is already a Location row in the database.
   * @param repoCatalogUrl
   */
  async verifyLocationExistence(repoCatalogUrl: string): Promise<boolean> {
    try {
      const result = await this.catalog.addLocation(
        {
          type: 'url',
          target: repoCatalogUrl,
          dryRun: true,
        },
        {
          credentials: await this.getCredentials(),
        },
      );
      // The `result.exists` field is only filled in dryRun mode
      return result.exists as boolean;
    } catch (error: any) {
      if (
        error.message?.includes('NotFoundError') ||
        error.body?.error?.message?.includes('NotFoundError')
      ) {
        return false;
      }
      throw error;
    }
  }

  async hasEntityInCatalog(entityName: string) {
    return this.catalog
      .queryEntities(
        {
          filter: {
            'metadata.name': entityName,
          },
          limit: 1,
        },
        {
          credentials: await this.getCredentials(),
        },
      )
      .then(resp => resp.items?.length > 0);
  }

  async possiblyCreateLocation(repoCatalogUrl: string) {
    try {
      await this.catalog.addLocation(
        {
          type: 'url',
          target: repoCatalogUrl,
        },
        {
          credentials: await this.getCredentials(),
        },
      );
    } catch (error: any) {
      if (
        !(
          error.message?.includes('ConflictError') ||
          error.body?.error?.name?.includes('ConflictError')
        )
      ) {
        throw error;
      }
      // Location already exists, which is fine
    }
  }

  async deleteCatalogLocationById(locationId: string): Promise<void> {
    try {
      await this.catalog.removeLocationById(locationId, {
        credentials: await this.getCredentials(),
      });
    } catch (error: any) {
      logErrorIfNeeded(
        this.logger,
        `Could not delete location ${locationId}`,
        error,
      );
    }
  }

  async deleteCatalogLocationEntityById(locationUid: string): Promise<void> {
    await this.catalog.removeEntityByUid(locationUid, {
      credentials: await this.getCredentials(),
    });
  }

  async findLocationEntitiesByRepoUrl(repoUrl: string, defaultBranch?: string) {
    return this.findLocationEntitiesByTargetUrl(
      getCatalogUrl(this.config, repoUrl, defaultBranch),
    );
  }

  async findLocationEntitiesByTargetUrl(targetUrl: string, limit?: number) {
    return this.catalog
      .queryEntities(
        {
          filter: [
            { kind: 'Location', 'spec.type': 'url', 'spec.target': targetUrl },
          ],
          fields: ['metadata.namespace', 'metadata.name', 'metadata.uid'],
          limit,
        },
        {
          credentials: await this.getCredentials(),
        },
      )
      .then(resp => resp.items);
  }

  async refreshLocationByRepoUrl(repoUrl: string, defaultBranch?: string) {
    const promises: Promise<void>[] = [];
    this.findLocationEntitiesByRepoUrl(repoUrl, defaultBranch).then(
      entities => {
        const nbEntities = entities.length;
        if (nbEntities === 0) {
          this.logger.debug(`No Location Entity found for repo: ${repoUrl}`);
          return;
        }
        this.logger.debug(
          `Refreshing ${nbEntities} Location(s) for repo: ${repoUrl}`,
        );
        entities.forEach(ent =>
          promises.push(
            this.refreshEntity(
              'location',
              ent.metadata.name,
              ent.metadata.namespace,
            ),
          ),
        );
      },
    );
    await Promise.all(promises);
  }

  async refreshEntity(
    kind: string,
    name: string,
    namespace: string = 'default',
  ) {
    const entityRef = `${kind}:${namespace}/${name}`;
    this.logger.debug(`Refreshing entityRef: ${entityRef}`);
    await this.catalog.refreshEntity(entityRef, {
      credentials: await this.getCredentials(),
    });
  }
}
