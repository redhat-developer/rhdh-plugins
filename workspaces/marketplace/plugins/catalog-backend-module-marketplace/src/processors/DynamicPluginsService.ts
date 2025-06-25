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

import { Document, isMap, parseDocument } from 'yaml';
import { MarketplacePackage } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import path from 'path';
import type { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import { findPaths } from '@backstage/cli-common';

/**
 * @public
 */
export class DynamicPluginsService {
  private readonly config: Document;

  private constructor(config?: Document) {
    this.config = config ?? new Document();
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
      return new DynamicPluginsService();
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

    if (!fs.existsSync(dynamicPluginsConfigFilePath)) {
      logger.warn(`File '${dynamicPluginsConfigFilePath}' is missing`);
      return new DynamicPluginsService();
    }

    const rawContent = fs.readFileSync(dynamicPluginsConfigFilePath, 'utf-8');
    const pluginsConfig = parseDocument(rawContent);
    return new DynamicPluginsService(pluginsConfig);
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

    const entry = this.config.get(packageDynamicArtifact);
    return isMap(entry) && entry.get('disabled') === true;
  }
}
