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

import fs from 'fs';
import path from 'path';
import semver from 'semver';
import { Entity } from '@backstage/catalog-model';
import { CatalogProcessor } from '@backstage/plugin-catalog-node';
import {
  InstallStatus,
  MARKETPLACE_API_VERSION,
  MarketplaceKinds,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

/**
 * @public
 */
export class LocalPluginInstallStatusProcessor implements CatalogProcessor {
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
    return 'LocalPluginInstallStatusProcessor';
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
  ): Boolean {
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
          return true;
        }
        // Get installed package from node_modules
        const packagePath = path.resolve(nodeModulesPath, 'package.json');
        const installedPackageJson = JSON.parse(
          fs.readFileSync(packagePath, 'utf8'),
        );

        const installedVersion = installedPackageJson.version;
        if (semver.satisfies(installedVersion, versionRange)) {
          return true;
        }
        return false;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  isJSON(str: string) {
    if (typeof str !== 'string') {
      return false;
    }

    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      return false;
    }
  }

  async preProcessEntity(entity: MarketplacePlugin): Promise<Entity> {
    if (
      entity.apiVersion === MARKETPLACE_API_VERSION &&
      entity.kind === MarketplaceKinds.plugin
    ) {
      let installStatus: InstallStatus = InstallStatus.NotInstalled;

      if (entity?.spec?.packages?.length) {
        const somePackagesInstalled = entity.spec.packages.some(
          marketplacePackageOrString => {
            const npmPackage =
              typeof marketplacePackageOrString === 'string'
                ? {
                    name: marketplacePackageOrString,
                  }
                : marketplacePackageOrString;

            const versions = npmPackage?.version?.split(',');
            return versions
              ? versions?.every(version =>
                  this.customPaths.some(cpath =>
                    this.isPackageInstalled(npmPackage?.name, cpath, version),
                  ),
                )
              : this.customPaths.some(cpath =>
                  this.isPackageInstalled(npmPackage?.name, cpath),
                );
          },
        );

        installStatus = somePackagesInstalled
          ? InstallStatus.Installed
          : InstallStatus.NotInstalled;
      }

      return {
        ...entity,
        spec: {
          ...entity.spec,
          installStatus,
        },
      };
    }

    return entity;
  }
}
