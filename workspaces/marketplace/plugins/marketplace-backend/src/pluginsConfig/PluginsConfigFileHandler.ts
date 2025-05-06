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
import yaml from 'js-yaml';

import {
  DynamicPackageConfig,
  DynamicPluginsConfig,
  isDynamicPackageConfig,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { InputError } from '@backstage/errors';

export class PluginsConfigFileHandler {
  private readonly dynamicPluginsConfigFile: string | undefined;
  private configsMap: Map<string, DynamicPackageConfig> | undefined;

  constructor(dynamicPluginsConfigFile: string | undefined) {
    this.dynamicPluginsConfigFile = dynamicPluginsConfigFile;
  }

  private get requiredConfigsMap(): Map<string, DynamicPackageConfig> {
    if (!this.dynamicPluginsConfigFile) {
      throw new InputError("Missing 'marketplace.dynamicPluginsConfig'");
    }
    if (!this.configsMap) {
      throw new Error(
        "You must call 'parse()' before accessing the configuration",
      );
    }
    return this.configsMap;
  }

  parse(): void {
    if (!this.dynamicPluginsConfigFile) {
      return;
    }

    const configContent = fs.readFileSync(
      this.dynamicPluginsConfigFile,
      'utf-8',
    );
    const parsedContent = yaml.load(configContent) as DynamicPluginsConfig;

    if (!parsedContent || !Array.isArray(parsedContent.plugins)) {
      throw new Error(
        "Failed to load 'dynamicPluginsConfig', content of the 'plugins' field must be a list",
      );
    }

    this.configsMap = new Map(
      parsedContent.plugins.map(pkg => {
        if (!isDynamicPackageConfig(pkg)) {
          throw new Error(`Invalid package config ${JSON.stringify(pkg)}`);
        }
        return [pkg.package, pkg];
      }),
    );
  }

  getAllPackages() {
    return [...this.requiredConfigsMap.values()];
  }

  getPackage(packageName: string): DynamicPackageConfig | undefined {
    return this.requiredConfigsMap.get(packageName);
  }
}
