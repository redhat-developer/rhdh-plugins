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
  Entity,
  parseEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorEmit,
} from '@backstage/plugin-catalog-node';
import {
  MarketplaceKind,
  MarketplacePackage,
  MarketplacePackageInstallStatus,
  MarketplacePackageSpec,
  MarketplacePlugin,
  MarketplacePluginInstallStatus,
  isMarketplacePackage,
  isMarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import type {
  CatalogApi,
  GetEntitiesByRefsResponse,
  GetEntitiesResponse,
} from '@backstage/catalog-client';
import type {
  AuthService,
  LoggerService,
  CacheService,
  SchedulerService,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';

type MarketplacePackageWithInstallStatus = Omit<MarketplacePackage, 'spec'> & {
  spec: Omit<MarketplacePackageSpec, 'installStatus'> & {
    installStatus: MarketplacePackageInstallStatus;
  };
};

/**
 * @public
 */
export class PluginInstallStatusProcessor implements CatalogProcessor {
  private readonly auth: AuthService;
  private readonly catalog: CatalogApi;
  private readonly logger: LoggerService;
  private readonly cache: CacheService;
  private readonly cacheTTLSeconds = 30;

  public constructor(deps: {
    auth: AuthService;
    catalog: CatalogApi;
    logger: LoggerService;
    cache: CacheService;
    scheduler: SchedulerService;
  }) {
    const { auth, catalog, logger, cache, scheduler } = deps;
    this.auth = auth;
    this.catalog = catalog;
    this.logger = logger;
    this.cache = cache;

    // Set up scheduled refresh of package installStatus to save in cache
    const schedule: SchedulerServiceTaskScheduleDefinition = {
      frequency: { minutes: 30 },
      timeout: { minutes: 10 },
      initialDelay: { seconds: 10 },
      scope: 'global',
    };
    const taskRunner = scheduler.createScheduledTaskRunner(schedule);
    taskRunner.run({
      id: `${this.getProcessorName()}:refresh-packages`,
      fn: async () => {
        await this.refreshPackages();
      },
    });
  }

  // Return processor name
  getProcessorName(): string {
    return 'PluginInstallStatusProcessor';
  }

  private async cachePackageInstallStatuses(
    entityRefs?: string[],
  ): Promise<MarketplacePackageWithInstallStatus[]> {
    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    let packagesResponse: GetEntitiesByRefsResponse | GetEntitiesResponse;
    if (entityRefs) {
      packagesResponse = await this.catalog.getEntitiesByRefs(
        { entityRefs },
        token,
      );
    } else {
      packagesResponse = await this.catalog.getEntities(
        {
          filter: {
            kind: MarketplaceKind.Package,
          },
        },
        token,
      );
    }
    const packages = packagesResponse.items.filter(
      pkg => isMarketplacePackage(pkg) && pkg.spec?.installStatus !== undefined,
    ) as MarketplacePackageWithInstallStatus[];

    for (const pkg of packages) {
      const cacheKey = stringifyEntityRef(pkg);
      await this.cache.set(cacheKey, pkg.spec.installStatus, {
        ttl: { seconds: this.cacheTTLSeconds },
      });
    }

    return packages;
  }

  private async refreshPackages(): Promise<void> {
    this.logger.info(
      `Refreshing package install statuses for ${this.getProcessorName()}`,
    );

    try {
      const packages = await this.cachePackageInstallStatuses();
      this.logger.info(
        `${this.getProcessorName()}:refresh-packages cached ${packages.length} marketplace package install statuses`,
      );
    } catch (error) {
      this.logger.warn(
        `${this.getProcessorName()}:refresh-packages Failed to refresh package install statuses`,
        error,
      );
    }
  }

  private async getPluginPackageInstallStatuses(
    pluginPackageRefs: string[],
  ): Promise<MarketplacePackageInstallStatus[]> {
    const cachedPackageStatuses: MarketplacePackageInstallStatus[] = [];
    const uncachedPackageRefs: string[] = [];

    for (const packageRef of pluginPackageRefs) {
      const packageInstallStatus =
        await this.cache.get<MarketplacePackageInstallStatus>(packageRef);
      if (packageInstallStatus) {
        cachedPackageStatuses.push(packageInstallStatus);
      } else {
        uncachedPackageRefs.push(packageRef);
      }
    }

    let fetchedPackageStatuses: MarketplacePackageInstallStatus[] = [];
    if (uncachedPackageRefs.length > 0) {
      try {
        fetchedPackageStatuses = (
          await this.cachePackageInstallStatuses(uncachedPackageRefs)
        ).map(p => p.spec.installStatus);
      } catch (error) {
        this.logger.warn('Failed to fetch plugin packages', error);
      }
    }

    return [...cachedPackageStatuses, ...fetchedPackageStatuses];
  }

  private async getPluginInstallStatus(
    marketplacePlugin: MarketplacePlugin,
  ): Promise<MarketplacePluginInstallStatus | undefined> {
    const pluginPackageRefs = marketplacePlugin.spec?.packages?.map(
      pluginName => {
        const pluginRef = parseEntityRef(pluginName, {
          defaultKind: MarketplaceKind.Package,
          defaultNamespace: marketplacePlugin.metadata.namespace,
        });
        return stringifyEntityRef(pluginRef);
      },
    );

    if (!pluginPackageRefs || pluginPackageRefs.length === 0) {
      this.logger.debug(
        `Entity ${stringifyEntityRef(marketplacePlugin)} is missing 'spec.packages', unable to determine 'spec.installStatus'`,
      );
      return undefined;
    }

    const pluginPackageStatuses =
      await this.getPluginPackageInstallStatuses(pluginPackageRefs);
    if (pluginPackageRefs.length !== pluginPackageStatuses.length) {
      this.logger.debug(
        `Entity ${stringifyEntityRef(marketplacePlugin)} is missing all definitions of 'spec.installStatus' in its packages, unable to determine 'spec.installStatus'`,
      );
      return undefined;
    }

    const statusCounts = pluginPackageStatuses.reduce(
      (counts, status) => {
        counts[status] = counts[status] + 1;
        return counts;
      },
      {
        [MarketplacePackageInstallStatus.NotInstalled]: 0,
        [MarketplacePackageInstallStatus.Installed]: 0,
        [MarketplacePackageInstallStatus.Disabled]: 0,
        [MarketplacePackageInstallStatus.UpdateAvailable]: 0,
      } as Record<MarketplacePackageInstallStatus, number>,
    );
    const totalPackagesCount = pluginPackageRefs.length;

    // Disabled when any package is disabled
    if (statusCounts[MarketplacePackageInstallStatus.Disabled] > 0) {
      return MarketplacePluginInstallStatus.Disabled;
    }
    // NotInstalled when all packages are not installed
    if (
      statusCounts[MarketplacePackageInstallStatus.NotInstalled] ===
      totalPackagesCount
    ) {
      return MarketplacePluginInstallStatus.NotInstalled;
    }
    // Installed when all packages are installed
    if (
      statusCounts[MarketplacePackageInstallStatus.Installed] ===
      totalPackagesCount
    ) {
      return MarketplacePluginInstallStatus.Installed;
    }
    // UpdateAvailable when any package has update available and no packages are not installed
    if (
      statusCounts[MarketplacePackageInstallStatus.UpdateAvailable] > 0 &&
      statusCounts[MarketplacePackageInstallStatus.NotInstalled] === 0
    ) {
      return MarketplacePluginInstallStatus.UpdateAvailable;
    }
    return MarketplacePluginInstallStatus.PartiallyInstalled;
  }

  async preProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    _emit: CatalogProcessorEmit,
    _originLocation: LocationSpec,
  ): Promise<Entity> {
    if (isMarketplacePlugin(entity)) {
      if (!entity.spec?.packages || entity.spec.packages.length === 0) {
        this.logger.debug(
          `Entity ${stringifyEntityRef(entity)} is missing packages, unable to determine 'spec.installStatus'`,
        );
        return entity;
      }

      if (
        !entity.spec?.installStatus ||
        entity.spec.installStatus ===
          MarketplacePluginInstallStatus.NotInstalled
      ) {
        const installStatus = await this.getPluginInstallStatus(entity);
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
