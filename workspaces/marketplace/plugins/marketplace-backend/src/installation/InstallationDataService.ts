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
  MarketplaceApi,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { DEFAULT_NAMESPACE } from '@backstage/catalog-model';
import {
  FileInstallationStorage,
  InstallationStorage,
} from './FileInstallationStorage';
import type { Config } from '@backstage/config';
import {
  InstallationInitError,
  InstallationInitErrorReason,
  InstallationInitErrorReasonKeys,
} from '../errors/InstallationInitError';
import { LoggerService } from '@backstage/backend-plugin-api';
import { ConfigFormatError } from '../errors/ConfigFormatError';

export class InstallationDataService {
  private constructor(
    private readonly marketplaceApi: MarketplaceApi,
    private readonly _installationStorage?: InstallationStorage,
    private readonly initializationError?: InstallationInitError,
  ) {}

  private get installationStorage(): InstallationStorage {
    if (!this._installationStorage) {
      throw new Error('Installation storage is not initialized', {
        cause: this.initializationError,
      });
    }
    return this._installationStorage;
  }

  static fromConfig(deps: {
    config: Config;
    marketplaceApi: MarketplaceApi;
    logger: LoggerService;
  }): InstallationDataService {
    const { config, marketplaceApi, logger } = deps;

    const serviceWithInitializationError = (
      reason: InstallationInitErrorReasonKeys,
      message: string,
      cause?: Error,
    ): InstallationDataService => {
      if (
        reason ===
          InstallationInitErrorReason.INSTALLATION_DISABLED_IN_PRODUCTION ||
        reason === InstallationInitErrorReason.INSTALLATION_DISABLED
      ) {
        logger.warn(message);
      } else {
        logger.error(
          `Installation feature is disabled. Error while loading data: ${message}`,
        );
      }
      return new InstallationDataService(
        marketplaceApi,
        undefined,
        new InstallationInitError(reason, message, cause),
      );
    };

    try {
      const node_env = process.env.NODE_ENV ?? 'development';
      if (node_env === 'production') {
        return serviceWithInitializationError(
          InstallationInitErrorReason.INSTALLATION_DISABLED_IN_PRODUCTION,
          'Installation feature is disabled in production',
        );
      }

      const installationEnabled = config.getOptionalBoolean(
        'extensions.installation.enabled',
      );
      if (!installationEnabled) {
        return serviceWithInitializationError(
          InstallationInitErrorReason.INSTALLATION_DISABLED,
          "Installation feature is disabled under 'extensions.installation.enabled'",
        );
      }

      const filePath = config.getOptionalString(
        'extensions.installation.saveToSingleFile.file',
      );
      if (!filePath) {
        return serviceWithInitializationError(
          InstallationInitErrorReason.FILE_CONFIG_VALUE_MISSING,
          "The 'extensions.installation.saveToSingleFile.file' config value is not being specified in the extensions configuration",
        );
      }

      const storage = new FileInstallationStorage(filePath);
      storage.initialize();
      return new InstallationDataService(marketplaceApi, storage);
    } catch (e) {
      let reason: InstallationInitErrorReasonKeys;
      if (e instanceof InstallationInitError) {
        reason = e.reason;
      } else if (e instanceof ConfigFormatError) {
        reason = InstallationInitErrorReason.INVALID_CONFIG;
      } else {
        reason = InstallationInitErrorReason.UNKNOWN;
      }
      return serviceWithInitializationError(
        reason,
        e.message,
        reason === InstallationInitErrorReason.UNKNOWN ? e : undefined,
      );
    }
  }

  private async getPluginDynamicArtifacts(
    plugin: MarketplacePlugin,
  ): Promise<Set<string>> {
    const marketplacePackages = await this.marketplaceApi.getPluginPackages(
      plugin.metadata.namespace ?? DEFAULT_NAMESPACE,
      plugin.metadata.name,
    );

    return new Set(
      marketplacePackages.flatMap(p =>
        p.spec?.dynamicArtifact ? [p.spec.dynamicArtifact] : [],
      ),
    );
  }

  getInitializationError(): InstallationInitError | undefined {
    return this.initializationError;
  }

  getPackageConfig(packageDynamicArtifact: string): string | undefined {
    return this.installationStorage.getPackage(packageDynamicArtifact);
  }

  async getPluginConfig(
    plugin: MarketplacePlugin,
  ): Promise<string | undefined> {
    const dynamicArtifacts = await this.getPluginDynamicArtifacts(plugin);
    return this.installationStorage.getPackages(dynamicArtifacts);
  }

  updatePackageConfig(packageDynamicArtifact: string, newConfig: string): void {
    this.installationStorage.updatePackage(packageDynamicArtifact, newConfig);
  }

  async updatePluginConfig(
    plugin: MarketplacePlugin,
    newConfig: string,
  ): Promise<void> {
    const dynamicArtifacts = await this.getPluginDynamicArtifacts(plugin);
    this.installationStorage.updatePackages(dynamicArtifacts, newConfig);
  }

  setPackageDisabled(packageDynamicArtifact: string, disabled: boolean) {
    this.installationStorage.setPackageDisabled(
      packageDynamicArtifact,
      disabled,
    );
  }

  async setPluginDisabled(plugin: MarketplacePlugin, disabled: boolean) {
    const dynamicArtifacts = await this.getPluginDynamicArtifacts(plugin);
    this.installationStorage.setPackagesDisabled(dynamicArtifacts, disabled);
  }
}
