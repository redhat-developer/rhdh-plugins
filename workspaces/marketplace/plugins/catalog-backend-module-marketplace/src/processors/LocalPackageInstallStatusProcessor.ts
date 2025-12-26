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
import { CatalogProcessor } from '@backstage/plugin-catalog-node';
import {
  isMarketplacePackage,
  MarketplacePackage,
  MarketplacePackageInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

/**
 * @public
 */
export class LocalPackageInstallStatusProcessor implements CatalogProcessor {
  private workspacesPath = this.findWorkspacesPath();
  private customPaths;

  /**
   *
   * @param paths - pass the workspaces to find the installed packages. Defaults to backstage default workspaces ['packages/app', 'packages/backend']
   */
  constructor(paths?: string[]) {
    this.customPaths =
      paths ??
      ['packages/app', 'packages/backend']?.map(
        cpath => `${this.workspacesPath}/${cpath}/package.json`,
      );
  }

  getProcessorName(): string {
    return 'LocalPackageInstallStatusProcessor';
  }

  findWorkspacesPath(startPath = process.cwd()) {
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
  ): MarketplacePackageInstallStatus | null {
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
        dependencies?.[packageName] || devDependencies?.[packageName];

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

      return null;
    } catch (error) {
      console.warn(
        `Error occurred while processing local install status of ${packageName}`,
        error,
      );
      return null;
    }
  }

  async preProcessEntity(
    entity: MarketplacePackage,
  ): Promise<MarketplacePackage> {
    if (isMarketplacePackage(entity)) {
      if (entity.spec?.packageName && !entity.spec.installStatus) {
        const packageName = entity.spec.packageName;
        const version = entity.spec.version;

        let installStatus: MarketplacePackageInstallStatus | undefined =
          undefined;

        this.customPaths.forEach(customPaths => {
          if (!installStatus) {
            const status = this.isPackageInstalled(
              packageName,
              customPaths,
              version,
            );
            if (status) {
              installStatus = status;
            }
          }
        });

        if (!installStatus) {
          installStatus = MarketplacePackageInstallStatus.NotInstalled;
        }

        return {
          ...entity,
          spec: {
            ...entity.spec,
            installStatus,
          },
        };
      }
    }

    return entity;
  }
}
