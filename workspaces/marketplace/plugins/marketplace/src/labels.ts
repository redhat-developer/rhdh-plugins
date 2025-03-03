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
  MarketplacePluginInstallStatus,
  MarketplacePackageInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

export const mapBackstageRoleToLabel: Record<string, string> = {
  'backend-plugin': 'Backend',
  'backend-plugin-module': 'Backend module',
  'frontend-plugin': 'Frontend',
};

export const mapMarketplacePluginInstallStatusToLabel: Record<
  MarketplacePluginInstallStatus,
  string
> = {
  [MarketplacePluginInstallStatus.NotInstalled]: 'Not installed',
  [MarketplacePluginInstallStatus.Installed]: 'Installed',
  [MarketplacePluginInstallStatus.PartiallyInstalled]: 'Partially installed',
  [MarketplacePluginInstallStatus.UpdateAvailable]: 'Update available',
};

export const mapMarketplacePluginInstallStatusToButton: Record<
  MarketplacePluginInstallStatus,
  string
> = {
  [MarketplacePluginInstallStatus.NotInstalled]: 'Install',
  [MarketplacePluginInstallStatus.Installed]: 'Uninstall',
  [MarketplacePluginInstallStatus.PartiallyInstalled]: 'Uninstall',
  [MarketplacePluginInstallStatus.UpdateAvailable]: 'Update',
};

export const mapPackageInstallStatusToLabel: Record<
  MarketplacePackageInstallStatus,
  string
> = {
  [MarketplacePackageInstallStatus.NotInstalled]: 'Not installed',
  [MarketplacePackageInstallStatus.Installed]: 'Installed',
  [MarketplacePackageInstallStatus.UpdateAvailable]: 'Update available',
};

export const mapPackageInstallStatusToButton: Record<
  MarketplacePackageInstallStatus,
  string
> = {
  [MarketplacePackageInstallStatus.NotInstalled]: 'Install',
  [MarketplacePackageInstallStatus.Installed]: 'Uninstall',
  [MarketplacePackageInstallStatus.UpdateAvailable]: 'Update',
};
