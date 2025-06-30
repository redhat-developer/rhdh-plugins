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
import path from 'path';
import semver from 'semver';
import {
  MarketplacePackage,
  MarketplacePackageInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { LoggerService } from '@backstage/backend-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';

/**
 * @public
 */
export class LocalPackageInstallStatusResolver {
  private readonly logger: LoggerService;
  private readonly workspacesPath = this.findWorkspacesPath();
  private readonly customPaths;

  /**
   *
   * @param deps - Dependencies object containing logger
   * @param options - Optional object containing paths - custom workspace paths to find the installed packages. Defaults to backstage default workspaces ['packages/app', 'packages/backend']
   */
  constructor(deps: { logger: LoggerService }, options?: { paths: string[] }) {
    this.logger = deps.logger;
    this.customPaths =
      options?.paths ??
      ['packages/app', 'packages/backend']?.map(
        cpath => `${this.workspacesPath}/${cpath}/package.json`,
      );
  }

  findWorkspacesPath(startPath = process.cwd()): string {
    let currentPath = path.resolve(startPath);

    while (currentPath !== path.parse(currentPath).root) {
      const packageJsonPath = path.join(currentPath, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8'),
        );

        if (packageJson.workspaces) {
          return currentPath;
        }
      }

      currentPath = path.dirname(currentPath);
    }
    return '';
  }

  private isPackageInstalled(
    packageName: string,
    packageJsonPath: string,
    versionRange?: string,
  ): MarketplacePackageInstallStatus | undefined {
    try {
      const absolutePackageJsonPath = path.resolve(packageJsonPath);

      if (!fs.existsSync(absolutePackageJsonPath)) {
        throw new Error(
          `package.json not found at: ${absolutePackageJsonPath}`,
        );
      }

      const packageJson = JSON.parse(
        fs.readFileSync(absolutePackageJsonPath, 'utf8'),
      );
      const dependencies = packageJson.dependencies;
      const devDependencies = packageJson.devDependencies;

      const isInPackageJson =
        dependencies?.[packageName] ?? devDependencies?.[packageName];

      const nodeModulesPath = path.resolve(
        this.workspacesPath,
        'node_modules',
        packageName,
      );

      const isInNodeModules = fs.existsSync(nodeModulesPath);
      const packageInstalled = Boolean(isInPackageJson && isInNodeModules);

      if (packageInstalled) {
        if (!versionRange) {
          return MarketplacePackageInstallStatus.Installed;
        }

        // Get installed package from node_modules
        const packagePath = path.resolve(nodeModulesPath, 'package.json');
        const installedPackageJson = JSON.parse(
          fs.readFileSync(packagePath, 'utf8'),
        );

        const installedVersion = installedPackageJson.version;
        if (semver.satisfies(installedVersion, versionRange)) {
          return MarketplacePackageInstallStatus.Installed;
        }
        return MarketplacePackageInstallStatus.UpdateAvailable;
      }

      return undefined;
    } catch (error) {
      this.logger.warn(
        `Error occurred while computing 'installStatus' for ${packageName}`,
        error,
      );
      return undefined;
    }
  }

  public getPackageInstallStatus(
    entity: MarketplacePackage,
  ): MarketplacePackageInstallStatus | undefined {
    const packageName = entity.spec?.packageName;
    if (!packageName) {
      this.logger.warn(
        `Entity ${stringifyEntityRef(entity)} missing 'entity.spec.packageName', unable to determine 'spec.installStatus'`,
      );
      return undefined;
    }

    let installStatus: MarketplacePackageInstallStatus | undefined = undefined;
    for (const customPath of this.customPaths) {
      const status = this.isPackageInstalled(
        packageName,
        customPath,
        entity.spec?.version,
      );
      if (status) {
        installStatus = status;
        break;
      }
    }

    return installStatus ?? MarketplacePackageInstallStatus.NotInstalled;
  }
}
