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
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { CatalogApi } from '@backstage/catalog-client';
import { AuthService, LoggerService } from '@backstage/backend-plugin-api';

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

  constructor(deps: {
    auth: AuthService;
    catalog: CatalogApi;
    logger: LoggerService;
  }) {
    const { auth, catalog, logger } = deps;
    this.auth = auth;
    this.catalog = catalog;
    this.logger = logger;
  }

  // Return processor name
  getProcessorName(): string {
    return 'PluginInstallStatusProcessor';
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
      this.logger.error(
        "Missing 'spec.packages', unable to determine 'spec.installStatus'",
      );
      return undefined;
    }

    const token = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    const pluginPackagesResponse = await this.catalog.getEntitiesByRefs(
      { entityRefs: pluginPackageRefs },
      token,
    );
    const pluginPackages = pluginPackagesResponse.items
      .filter(isMarketplacePackage)
      .filter(
        p => p.spec?.installStatus !== undefined,
      ) as MarketplacePackageWithInstallStatus[];
    if (pluginPackageRefs.length !== pluginPackages.length) {
      this.logger.warn(
        "Did not fetch all plugin packages with 'spec.installStatus', unable to determine 'spec.installStatus'",
      );
      return undefined;
    }

    const statusCounts = pluginPackages.reduce(
      (counts, p) => {
        const status = p.spec.installStatus;
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
    const totalPackagesCount = pluginPackages.length;

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
      if (
        entity.spec?.packages &&
        entity.spec.packages.length > 0 &&
        (!entity.spec?.installStatus ||
          entity.spec.installStatus ===
            MarketplacePluginInstallStatus.NotInstalled)
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
