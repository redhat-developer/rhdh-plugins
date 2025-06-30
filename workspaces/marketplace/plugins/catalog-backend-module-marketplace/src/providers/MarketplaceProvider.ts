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
import {
  SchedulerServiceTaskRunner,
  LoggerService,
} from '@backstage/backend-plugin-api';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  MarketplaceKind,
  MarketplacePlugin,
  MarketplacePackage,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { findTopmostFolder, readYamlFiles } from '../utils/file-utils';
import { JsonFileData } from '../types';
import { PackageInstallStatusResolver } from '../resolvers/PackageInstallStatusResolver';
import { PluginInstallStatusResolver } from '../resolvers/PluginInstallStatusResolver';

/**
 * @public
 */
export class MarketplaceProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly taskRunner: SchedulerServiceTaskRunner;
  private readonly logger: LoggerService;
  private readonly packageInstallStatusResolver: PackageInstallStatusResolver;
  private readonly pluginInstallStatusResolver: PluginInstallStatusResolver;

  constructor(deps: {
    taskRunner: SchedulerServiceTaskRunner;
    logger: LoggerService;
    packageInstallStatusResolver: PackageInstallStatusResolver;
    pluginInstallStatusResolver: PluginInstallStatusResolver;
  }) {
    this.taskRunner = deps.taskRunner;
    this.logger = deps.logger;
    this.packageInstallStatusResolver = deps.packageInstallStatusResolver;
    this.pluginInstallStatusResolver = deps.pluginInstallStatusResolver;
  }

  getProviderName(): string {
    return 'marketplace-provider';
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    this.logger.info('Reading Marketplace entities');
    const { plugins, packages } = this.loadMarketplaceEntities();

    const packageMap = new Map(packages.map(p => [stringifyEntityRef(p), p]));
    this.enrichPackages(packageMap);
    this.enrichPlugins(plugins, packageMap);

    const allEntities = [...packages, ...plugins];
    this.logger.info(
      `Processed ${allEntities.length} marketplace entities (${packages.length} packages, ${plugins.length} plugins)`,
    );

    await this.connection.applyMutation({
      type: 'full',
      entities: allEntities.map(entity => ({
        locationKey: `file:${this.getProviderName()}`,
        entity: {
          ...entity,
          metadata: {
            ...entity.metadata,
            annotations: {
              ...entity.metadata.annotations,
              [ANNOTATION_LOCATION]: `file:${this.getProviderName()}`,
              [ANNOTATION_ORIGIN_LOCATION]: `file:${this.getProviderName()}`,
            },
          },
        },
      })),
    });
  }

  private loadMarketplaceEntities(): {
    plugins: MarketplacePlugin[];
    packages: MarketplacePackage[];
  } {
    const marketplaceFilePath = findTopmostFolder('marketplace');
    if (!marketplaceFilePath) {
      this.logger.warn("Folder 'marketplace' not found");
      return { plugins: [], packages: [] };
    }

    try {
      const yamlData: JsonFileData<MarketplacePlugin | MarketplacePackage>[] =
        readYamlFiles(marketplaceFilePath);
      const plugins = yamlData
        .filter(d => d.content.kind === MarketplaceKind.Plugin)
        .map(d => d.content) as MarketplacePlugin[];
      const packages = yamlData
        .filter(d => d.content.kind === MarketplaceKind.Package)
        .map(d => d.content) as MarketplacePackage[];
      return { plugins, packages };
    } catch (error) {
      this.logger.error(`Error loading marketplace entities: ${error}`);
      return { plugins: [], packages: [] };
    }
  }

  private enrichPackages(packageMap: Map<string, MarketplacePackage>): void {
    for (const pkg of packageMap.values()) {
      const installStatus =
        this.packageInstallStatusResolver.getPackageInstallStatus(pkg);
      if (installStatus) {
        pkg.spec = {
          ...pkg.spec,
          installStatus,
        };
      }
    }
  }

  private enrichPlugins(
    plugins: MarketplacePlugin[],
    packageMap: Map<string, MarketplacePackage>,
  ): void {
    for (const p of plugins) {
      const installStatus =
        this.pluginInstallStatusResolver.getPluginInstallStatus(p, packageMap);
      if (installStatus) {
        p.spec = {
          ...p.spec,
          installStatus,
        };
      }
    }
  }
}
