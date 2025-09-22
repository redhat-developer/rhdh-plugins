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
  ExtensionsPluginInstallStatus,
  ExtensionsPackageInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

export const mapBackstageRoleToLabel: Record<string, string> = {
  'backend-plugin': 'Backend',
  'backend-plugin-module': 'Backend module',
  'frontend-plugin': 'Frontend',
};

export const mapExtensionsPluginInstallStatusToLabel: Record<
  ExtensionsPluginInstallStatus,
  string
> = {
  [ExtensionsPluginInstallStatus.NotInstalled]: 'Not installed',
  [ExtensionsPluginInstallStatus.Installed]: 'Installed',
  [ExtensionsPluginInstallStatus.Disabled]: 'Disabled',
  [ExtensionsPluginInstallStatus.PartiallyInstalled]: 'Partially installed',
  [ExtensionsPluginInstallStatus.UpdateAvailable]: 'Update available',
};

export const mapExtensionsPluginInstallStatusToButton: Record<
  ExtensionsPluginInstallStatus,
  string
> = {
  [ExtensionsPluginInstallStatus.NotInstalled]: 'Install',
  [ExtensionsPluginInstallStatus.Installed]: 'Uninstall',
  [ExtensionsPluginInstallStatus.Disabled]: 'Enable',
  [ExtensionsPluginInstallStatus.PartiallyInstalled]: 'Uninstall',
  [ExtensionsPluginInstallStatus.UpdateAvailable]: 'Update',
};

export const mapExtensionsPluginInstallStatusToInstallPageButton: Record<
  ExtensionsPluginInstallStatus,
  string
> = {
  [ExtensionsPluginInstallStatus.NotInstalled]: 'Install',
  [ExtensionsPluginInstallStatus.Installed]: 'Save',
  [ExtensionsPluginInstallStatus.Disabled]: 'Save',
  [ExtensionsPluginInstallStatus.PartiallyInstalled]: 'Save',
  [ExtensionsPluginInstallStatus.UpdateAvailable]: 'Save',
};

export const mapPackageInstallStatusToLabel: Record<
  ExtensionsPackageInstallStatus,
  string
> = {
  [ExtensionsPackageInstallStatus.NotInstalled]: 'Not installed',
  [ExtensionsPackageInstallStatus.Installed]: 'Installed',
  [ExtensionsPackageInstallStatus.Disabled]: 'Disabled',
  [ExtensionsPackageInstallStatus.UpdateAvailable]: 'Update available',
};

export const mapPackageInstallStatusToButton: Record<
  ExtensionsPackageInstallStatus,
  string
> = {
  [ExtensionsPackageInstallStatus.NotInstalled]: 'Install',
  [ExtensionsPackageInstallStatus.Installed]: 'Uninstall',
  [ExtensionsPackageInstallStatus.Disabled]: 'Enable',
  [ExtensionsPackageInstallStatus.UpdateAvailable]: 'Update',
};
