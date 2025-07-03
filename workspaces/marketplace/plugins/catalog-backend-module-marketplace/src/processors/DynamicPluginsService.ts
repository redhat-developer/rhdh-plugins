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

import fs from 'fs';

import { load } from 'js-yaml';
import { MarketplacePackage } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import path from 'path';
import type { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import { findPaths } from '@backstage/cli-common';
import { JsonObject } from '@backstage/types/index';

type DynamicPackagesFinalConfig = {
  [packageName: string]: {
    disabled: boolean;
    hash?: string;
    package: string;
    pluginConfig?: JsonObject;
  };
};

/**
 * @public
 */
export class DynamicPluginsService {
  private readonly logger: LoggerService;
  private readonly configFile?: string;
  private config: DynamicPackagesFinalConfig;

  private constructor(logger: LoggerService, rootDirectory?: string) {
    this.logger = logger;
    this.configFile = rootDirectory;
    this.config = {};
  }

  public initialize(): void {
    if (!this.configFile) {
      this.config = {};
      return;
    }

    if (!fs.existsSync(this.configFile)) {
      this.logger.warn(`File '${this.configFile}' is missing`);
      this.config = {};
      return;
    }
    const rawContent = fs.readFileSync(this.configFile, 'utf-8');
    const parsedContent = load(rawContent);
    this.config =
      (parsedContent as unknown as DynamicPackagesFinalConfig) || {};
  }

  static fromConfig(deps: {
    config: Config;
    logger: LoggerService;
  }): DynamicPluginsService {
    const { config, logger } = deps;
    const dynamicPluginsRoot = config.getOptionalString(
      'dynamicPlugins.rootDirectory',
    );

    if (!dynamicPluginsRoot) {
      logger.info(`'dynamicPlugins.rootDirectory' is missing`);
      return new DynamicPluginsService(logger);
    }

    // eslint-disable-next-line no-restricted-syntax
    const backstageRoot = findPaths(__dirname).targetRoot;
    const dynamicPluginsConfigFile = 'dynamic-plugins.final.yaml';
    const dynamicPluginsConfigFilePath = path.isAbsolute(dynamicPluginsRoot)
      ? path.resolve(dynamicPluginsRoot, dynamicPluginsConfigFile)
      : path.resolve(
          backstageRoot,
          dynamicPluginsRoot,
          dynamicPluginsConfigFile,
        );

    return new DynamicPluginsService(logger, dynamicPluginsConfigFilePath);
  }

  public isPackageDisabledViaConfig(
    marketplacePackage: MarketplacePackage,
  ): boolean {
    const packageDynamicArtifact = marketplacePackage.spec?.dynamicArtifact;
    if (!packageDynamicArtifact) {
      throw new Error(
        `Package ${marketplacePackage.metadata.name} is missing 'spec.dynamicArtifact'`,
      );
    }

    const entry = this.config[packageDynamicArtifact];
    return entry && entry.disabled === true;
  }
}
