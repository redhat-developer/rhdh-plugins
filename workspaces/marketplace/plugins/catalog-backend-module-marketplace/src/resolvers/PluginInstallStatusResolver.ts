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

import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import {
  MarketplaceKind,
  MarketplacePackage,
  MarketplacePackageInstallStatus,
  MarketplacePackageSpec,
  MarketplacePlugin,
  MarketplacePluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { LoggerService } from '@backstage/backend-plugin-api';

type MarketplacePackageWithInstallStatus = Omit<MarketplacePackage, 'spec'> & {
  spec: Omit<MarketplacePackageSpec, 'installStatus'> & {
    installStatus: MarketplacePackageInstallStatus;
  };
};

/**
 * @public
 */
export class PluginInstallStatusResolver {
  private readonly logger: LoggerService;

  constructor(deps: { logger: LoggerService }) {
    this.logger = deps.logger;
  }

  public getPluginInstallStatus(
    marketplacePlugin: MarketplacePlugin,
    packagesMap: Map<string, MarketplacePackage>,
  ): MarketplacePluginInstallStatus | undefined {
    const pluginPackageRefs = marketplacePlugin.spec?.packages?.map(pkgName => {
      const pluginRef = parseEntityRef(pkgName, {
        defaultKind: MarketplaceKind.Package,
        defaultNamespace: marketplacePlugin.metadata.namespace,
      });
      return stringifyEntityRef(pluginRef);
    });
    if (!pluginPackageRefs) {
      this.logger.warn(
        `Entity ${stringifyEntityRef(marketplacePlugin)} is missing packages, unable to determine 'spec.installStatus'`,
      );
      return undefined;
    }

    const pluginPackages = pluginPackageRefs
      .map(pkgRef =>
        packagesMap.has(pkgRef) ? packagesMap.get(pkgRef) : undefined,
      )
      .filter(
        pkg => pkg !== undefined && pkg.spec?.installStatus,
      ) as MarketplacePackageWithInstallStatus[];
    if (pluginPackageRefs.length !== pluginPackages.length) {
      this.logger.warn(
        `Missing all definitions for ${stringifyEntityRef(marketplacePlugin)} packages installStatus, unable to determine 'spec.installStatus'`,
      );
      return undefined;
    }

    const statusCounts = pluginPackages.reduce(
      (counts, pkg) => {
        const status = pkg.spec.installStatus;
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
}
