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
    return 'DynamicPluginInstallStatusProcessor';
  }

  async getPluginInstallStatus(
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

    // disabled when any of plugin packages set to disabled:true
    const isDisabled = pluginPackages.some(
      p => p.spec.installStatus === MarketplacePackageInstallStatus.Disabled,
    );
    if (isDisabled) {
      return MarketplacePluginInstallStatus.Disabled;
    }

    const installStatus = pluginPackages.reduce<MarketplacePluginInstallStatus>(
      (acc, p) => {
        const newPackageStatus = p.spec.installStatus;
        // PartiallyInstalled
        if (
          acc === MarketplacePluginInstallStatus.PartiallyInstalled ||
          ([
            MarketplacePluginInstallStatus.Installed,
            MarketplacePluginInstallStatus.UpdateAvailable,
          ].includes(acc) &&
            newPackageStatus === MarketplacePackageInstallStatus.NotInstalled)
        ) {
          return MarketplacePluginInstallStatus.PartiallyInstalled;
        }
        // UpdateAvailable
        if (
          acc === MarketplacePluginInstallStatus.UpdateAvailable ||
          newPackageStatus === MarketplacePackageInstallStatus.UpdateAvailable
        ) {
          return MarketplacePluginInstallStatus.UpdateAvailable;
        }
        // Installed
        if (
          acc === MarketplacePluginInstallStatus.NotInstalled &&
          newPackageStatus === MarketplacePackageInstallStatus.Installed
        ) {
          return MarketplacePluginInstallStatus.Installed;
        }
        return acc;
      },
      MarketplacePluginInstallStatus.NotInstalled,
    );

    return installStatus;
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
