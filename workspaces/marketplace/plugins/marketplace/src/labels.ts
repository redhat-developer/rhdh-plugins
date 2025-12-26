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
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import { marketplaceTranslationRef } from './translations';

// Translation-aware label mapping functions that replace the static mappings
export const mapBackstageRoleToLabel = (
  role: string,
  t: TranslationFunction<typeof marketplaceTranslationRef.T>,
): string => {
  const roleMap: Record<string, string> = {
    'backend-plugin': t('role.backend'),
    'backend-plugin-module': t('role.backendModule'),
    'frontend-plugin': t('role.frontend'),
  };
  return roleMap[role] || role;
};

export const mapMarketplacePluginInstallStatusToLabel = (
  status: MarketplacePluginInstallStatus,
  t: TranslationFunction<typeof marketplaceTranslationRef.T>,
): string => {
  const statusMap: Record<MarketplacePluginInstallStatus, string> = {
    [MarketplacePluginInstallStatus.NotInstalled]: t('status.notInstalled'),
    [MarketplacePluginInstallStatus.Installed]: t('status.installed'),
    [MarketplacePluginInstallStatus.Disabled]: t('status.disabled'),
    [MarketplacePluginInstallStatus.PartiallyInstalled]: t(
      'status.partiallyInstalled',
    ),
    [MarketplacePluginInstallStatus.UpdateAvailable]: t(
      'status.updateAvailable',
    ),
  };
  return statusMap[status];
};

export const mapMarketplacePluginInstallStatusToButton = (
  status: MarketplacePluginInstallStatus,
  t: TranslationFunction<typeof marketplaceTranslationRef.T>,
): string => {
  const buttonMap: Record<MarketplacePluginInstallStatus, string> = {
    [MarketplacePluginInstallStatus.NotInstalled]: t('button.install'),
    [MarketplacePluginInstallStatus.Installed]: t('button.uninstall'),
    [MarketplacePluginInstallStatus.Disabled]: t('button.enable'),
    [MarketplacePluginInstallStatus.PartiallyInstalled]: t('button.uninstall'),
    [MarketplacePluginInstallStatus.UpdateAvailable]: t('button.update'),
  };
  return buttonMap[status];
};

export const mapMarketplacePluginInstallStatusToInstallPageButton = (
  status: MarketplacePluginInstallStatus,
  t: TranslationFunction<typeof marketplaceTranslationRef.T>,
): string => {
  const buttonMap: Record<MarketplacePluginInstallStatus, string> = {
    [MarketplacePluginInstallStatus.NotInstalled]: t('button.install'),
    [MarketplacePluginInstallStatus.Installed]: t('button.save'),
    [MarketplacePluginInstallStatus.Disabled]: t('button.save'),
    [MarketplacePluginInstallStatus.PartiallyInstalled]: t('button.save'),
    [MarketplacePluginInstallStatus.UpdateAvailable]: t('button.save'),
  };
  return buttonMap[status];
};

export const mapPackageInstallStatusToLabel = (
  status: MarketplacePackageInstallStatus,
  t: TranslationFunction<typeof marketplaceTranslationRef.T>,
): string => {
  const statusMap: Record<MarketplacePackageInstallStatus, string> = {
    [MarketplacePackageInstallStatus.NotInstalled]: t('status.notInstalled'),
    [MarketplacePackageInstallStatus.Installed]: t('status.installed'),
    [MarketplacePackageInstallStatus.Disabled]: t('status.disabled'),
    [MarketplacePackageInstallStatus.UpdateAvailable]: t(
      'status.updateAvailable',
    ),
  };
  return statusMap[status];
};

export const mapPackageInstallStatusToButton = (
  status: MarketplacePackageInstallStatus,
  t: TranslationFunction<typeof marketplaceTranslationRef.T>,
): string => {
  const buttonMap: Record<MarketplacePackageInstallStatus, string> = {
    [MarketplacePackageInstallStatus.NotInstalled]: t('button.install'),
    [MarketplacePackageInstallStatus.Installed]: t('button.uninstall'),
    [MarketplacePackageInstallStatus.Disabled]: t('button.enable'),
    [MarketplacePackageInstallStatus.UpdateAvailable]: t('button.update'),
  };
  return buttonMap[status];
};
