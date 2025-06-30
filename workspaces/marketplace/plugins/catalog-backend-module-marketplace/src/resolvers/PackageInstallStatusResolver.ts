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
  MarketplacePackage,
  MarketplacePackageInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { DynamicPackageInstallStatusResolver } from './DynamicPackageInstallStatusResolver';
import { LocalPackageInstallStatusResolver } from './LocalPackageInstallStatusResolver';

/**
 * @public
 */
export class PackageInstallStatusResolver {
  private readonly dynamicPackageInstallStatusResolver: DynamicPackageInstallStatusResolver;
  private readonly localPackageInstallStatusResolver: LocalPackageInstallStatusResolver;

  constructor(deps: {
    dynamicPackageInstallStatusResolver: DynamicPackageInstallStatusResolver;
    localPackageInstallStatusResolver: LocalPackageInstallStatusResolver;
  }) {
    this.dynamicPackageInstallStatusResolver =
      deps.dynamicPackageInstallStatusResolver;
    this.localPackageInstallStatusResolver =
      deps.localPackageInstallStatusResolver;
  }

  public getPackageInstallStatus(
    pkg: MarketplacePackage,
  ): MarketplacePackageInstallStatus | undefined {
    if (pkg.spec?.installStatus) {
      return pkg.spec.installStatus;
    }
    const dynamicInstallStatus =
      this.dynamicPackageInstallStatusResolver.getPackageInstallStatus(pkg);
    if (
      dynamicInstallStatus &&
      dynamicInstallStatus !== MarketplacePackageInstallStatus.NotInstalled
    ) {
      return dynamicInstallStatus;
    }

    return this.localPackageInstallStatusResolver.getPackageInstallStatus(pkg);
  }
}
