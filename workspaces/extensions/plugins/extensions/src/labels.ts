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
import { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import { extensionsTranslationRef } from './translations';

// Translation-aware label mapping functions that replace the static mappings
export const mapBackstageRoleToLabel = (
  role: string,
  t: TranslationFunction<typeof extensionsTranslationRef.T>,
): string => {
  const roleMap: Record<string, string> = {
    'backend-plugin': t('role.backend'),
    'backend-plugin-module': t('role.backendModule'),
    'frontend-plugin': t('role.frontend'),
  };
  return roleMap[role] || role;
};

export const mapExtensionsPluginInstallStatusToLabel = (
  status: ExtensionsPluginInstallStatus,
  t: TranslationFunction<typeof extensionsTranslationRef.T>,
): string => {
  const statusMap: Record<ExtensionsPluginInstallStatus, string> = {
    [ExtensionsPluginInstallStatus.NotInstalled]: t('status.notInstalled'),
    [ExtensionsPluginInstallStatus.Installed]: t('status.installed'),
    [ExtensionsPluginInstallStatus.Disabled]: t('status.disabled'),
    [ExtensionsPluginInstallStatus.PartiallyInstalled]: t(
      'status.partiallyInstalled',
    ),
    [ExtensionsPluginInstallStatus.UpdateAvailable]: t(
      'status.updateAvailable',
    ),
  };
  return statusMap[status];
};

export const mapExtensionsPluginInstallStatusToButton = (
  status: ExtensionsPluginInstallStatus,
  t: TranslationFunction<typeof extensionsTranslationRef.T>,
): string => {
  const buttonMap: Record<ExtensionsPluginInstallStatus, string> = {
    [ExtensionsPluginInstallStatus.NotInstalled]: t('button.install'),
    [ExtensionsPluginInstallStatus.Installed]: t('button.uninstall'),
    [ExtensionsPluginInstallStatus.Disabled]: t('button.enable'),
    [ExtensionsPluginInstallStatus.PartiallyInstalled]: t('button.uninstall'),
    [ExtensionsPluginInstallStatus.UpdateAvailable]: t('button.update'),
  };
  return buttonMap[status];
};

export const mapExtensionsPluginInstallStatusToInstallPageButton = (
  status: ExtensionsPluginInstallStatus,
  t: TranslationFunction<typeof extensionsTranslationRef.T>,
): string => {
  const buttonMap: Record<ExtensionsPluginInstallStatus, string> = {
    [ExtensionsPluginInstallStatus.NotInstalled]: t('button.install'),
    [ExtensionsPluginInstallStatus.Installed]: t('button.save'),
    [ExtensionsPluginInstallStatus.Disabled]: t('button.save'),
    [ExtensionsPluginInstallStatus.PartiallyInstalled]: t('button.save'),
    [ExtensionsPluginInstallStatus.UpdateAvailable]: t('button.save'),
  };
  return buttonMap[status];
};

export const mapPackageInstallStatusToLabel = (
  status: ExtensionsPackageInstallStatus,
  t: TranslationFunction<typeof extensionsTranslationRef.T>,
): string => {
  const statusMap: Record<ExtensionsPackageInstallStatus, string> = {
    [ExtensionsPackageInstallStatus.NotInstalled]: t('status.notInstalled'),
    [ExtensionsPackageInstallStatus.Installed]: t('status.installed'),
    [ExtensionsPackageInstallStatus.Disabled]: t('status.disabled'),
    [ExtensionsPackageInstallStatus.UpdateAvailable]: t(
      'status.updateAvailable',
    ),
  };
  return statusMap[status];
};

export const mapPackageInstallStatusToButton = (
  status: ExtensionsPackageInstallStatus,
  t: TranslationFunction<typeof extensionsTranslationRef.T>,
): string => {
  const buttonMap: Record<ExtensionsPackageInstallStatus, string> = {
    [ExtensionsPackageInstallStatus.NotInstalled]: t('button.install'),
    [ExtensionsPackageInstallStatus.Installed]: t('button.uninstall'),
    [ExtensionsPackageInstallStatus.Disabled]: t('button.enable'),
    [ExtensionsPackageInstallStatus.UpdateAvailable]: t('button.update'),
  };
  return buttonMap[status];
};
