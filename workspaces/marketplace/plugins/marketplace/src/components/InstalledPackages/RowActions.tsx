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

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRouteRef } from '@backstage/core-plugin-api';
import { Link } from '@backstage/core-components';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';

import { MarketplacePackageInstallStatus } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { useTranslation } from '../../hooks/useTranslation';
import { packageInstallRouteRef, packageRouteRef } from '../../routes';
import { usePackageConfig } from '../../hooks/usePackageConfig';
import { downloadPackageYAML } from '../../utils/downloadPackageYaml';
import { usePluginConfigurationPermissions } from '../../hooks/usePluginConfigurationPermissions';
import { useEnablePlugin } from '../../hooks/useEnablePlugin';
import { useInstallationContext } from '../InstallationContext';

export type InstalledPackageRow = {
  displayName: string;
  packageName: string;
  parentPlugin?: string;
  installStatus?: MarketplacePackageInstallStatus;
  role?: string;
  version?: string;
  hasEntity: boolean;
  missingDynamicArtifact: boolean;
  namespace?: string;
  name?: string;
};

export const DownloadPackageYaml = ({
  pkg,
  isProductionEnv,
}: {
  pkg: InstalledPackageRow;
  isProductionEnv: boolean;
}) => {
  const { t } = useTranslation();
  const pkgConfig = usePackageConfig(pkg.namespace!, pkg.name!);
  const packageConfigPermission = usePluginConfigurationPermissions(
    pkg.namespace!,
    pkg.parentPlugin ?? '',
  );

  const disabledIcon = (
    <Box component="span" display="inline-flex">
      <IconButton
        size="small"
        disabled
        sx={{ color: theme => theme.palette.action.disabled }}
      >
        <FileDownloadOutlinedIcon />
      </IconButton>
    </Box>
  );

  if (isProductionEnv) {
    return (
      <Tooltip
        title={t('installedPackages.table.tooltips.packageProductionDisabled')}
      >
        {disabledIcon}
      </Tooltip>
    );
  }
  const disabled =
    !pkg.hasEntity || packageConfigPermission.data?.read !== 'ALLOW';

  if (disabled) {
    return (
      <Tooltip
        title={
          pkg.hasEntity
            ? t('installedPackages.table.tooltips.noDownloadPermissions')
            : t('installedPackages.table.tooltips.enableActions')
        }
      >
        {disabledIcon}
      </Tooltip>
    );
  }

  return (
    <Tooltip title={t('installedPackages.table.tooltips.downloadPackage')}>
      <IconButton
        size="small"
        sx={{ color: theme => theme.palette.text.primary }}
        onClick={async () => {
          await downloadPackageYAML(
            pkgConfig.data?.configYaml ?? '',
            pkg.name!,
          );
        }}
      >
        <FileDownloadOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

export const EditPackage = ({
  pkg,
  isProductionEnv,
  isInstallationEnabled,
}: {
  pkg: InstalledPackageRow;
  isProductionEnv: boolean;
  isInstallationEnabled: boolean;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getPackagePath = useRouteRef(packageInstallRouteRef);
  const [searchParams] = useSearchParams();
  const packageConfigPermission = usePluginConfigurationPermissions(
    pkg.namespace!,
    pkg.parentPlugin ?? '',
  );

  const disabledEditIcon = (
    <Box component="span" display="inline-flex">
      <IconButton
        size="small"
        disabled
        sx={{ color: theme => theme.palette.action.disabled }}
      >
        <EditIcon />
      </IconButton>
    </Box>
  );

  if (!pkg.hasEntity) {
    return (
      <Tooltip title={t('installedPackages.table.tooltips.enableActions')}>
        {disabledEditIcon}
      </Tooltip>
    );
  }
  const packagePath = getPackagePath({
    namespace: pkg.namespace!,
    name: pkg.name!,
  });
  const searchParamString = searchParams.size > 0 ? `?${searchParams}` : '';
  const packagePathWithSearchParams = `${packagePath}${searchParamString}`;

  const viewIcon = (
    <IconButton
      size="small"
      sx={{ color: theme => theme.palette.text.primary }}
      onClick={() =>
        navigate(packagePathWithSearchParams, {
          state: { editAction: true, viewOnly: true },
        })
      }
    >
      View
    </IconButton>
  );

  if (packageConfigPermission.data?.write !== 'ALLOW') {
    return (
      <Tooltip title={t('installedPackages.table.tooltips.noEditPermissions')}>
        {disabledEditIcon}
      </Tooltip>
    );
  }

  if (pkg.missingDynamicArtifact) {
    return (
      <Tooltip
        title={t('tooltips.missingDynamicArtifact' as any, { type: 'package' })}
      >
        {viewIcon}
      </Tooltip>
    );
  }

  if (isProductionEnv) {
    return (
      <Tooltip
        title={t('installedPackages.table.tooltips.packageProductionDisabled')}
      >
        {viewIcon}
      </Tooltip>
    );
  }

  if (!isInstallationEnabled) {
    return (
      <Tooltip
        title={t('installedPackages.table.tooltips.installationDisabled')}
      >
        {viewIcon}
      </Tooltip>
    );
  }

  return (
    <Tooltip title={t('installedPackages.table.tooltips.editPackage')}>
      <IconButton
        size="small"
        sx={{ color: theme => theme.palette.text.primary }}
        onClick={() =>
          navigate(packagePathWithSearchParams, { state: { editAction: true } })
        }
      >
        <EditIcon />
      </IconButton>
    </Tooltip>
  );
};

export const TogglePackage = ({
  pkg,
  isProductionEnv,
  isInstallationEnabled,
}: {
  pkg: InstalledPackageRow;
  isProductionEnv: boolean;
  isInstallationEnabled: boolean;
}) => {
  const { t } = useTranslation();
  const { installedPackages, setInstalledPackages } = useInstallationContext();
  const { mutateAsync: enablePlugin } = useEnablePlugin(true);
  const packageConfigPermission = usePluginConfigurationPermissions(
    pkg.namespace!,
    pkg.parentPlugin ?? '',
  );
  const [isPackageEnabled, setIsPackageEnabled] = useState(
    pkg.installStatus === MarketplacePackageInstallStatus.Installed ||
      pkg.installStatus === MarketplacePackageInstallStatus.UpdateAvailable,
  );
  const disabledIcon = (
    <Box component="span" display="inline-flex">
      <IconButton size="small" disabled>
        {isPackageEnabled ? <Switch checked disabled /> : <Switch disabled />}
      </IconButton>
    </Box>
  );

  if (isProductionEnv) {
    return (
      <Tooltip
        title={t('installedPackages.table.tooltips.packageProductionDisabled')}
      >
        {disabledIcon}
      </Tooltip>
    );
  }

  if (!isInstallationEnabled) {
    return (
      <Tooltip
        title={t('installedPackages.table.tooltips.installationDisabled')}
      >
        {disabledIcon}
      </Tooltip>
    );
  }

  if (!pkg.hasEntity || packageConfigPermission.data?.write !== 'ALLOW') {
    return (
      <Tooltip
        title={
          pkg.hasEntity
            ? t('installedPackages.table.tooltips.noTogglePermissions')
            : t('installedPackages.table.tooltips.enableActions')
        }
      >
        {disabledIcon}
      </Tooltip>
    );
  }

  if (pkg.missingDynamicArtifact) {
    return (
      <Tooltip
        title={t('tooltips.missingDynamicArtifact' as any, { type: 'package' })}
      >
        {disabledIcon}
      </Tooltip>
    );
  }

  const handleToggle = async () => {
    const newValue = !isPackageEnabled;

    try {
      const res = await enablePlugin({
        namespace: pkg.namespace ?? 'default',
        name: pkg.name!,
        disabled: !newValue,
      });

      if (res?.status === 'OK') {
        setIsPackageEnabled(newValue);
        const updated = {
          ...installedPackages,
          [pkg.packageName ?? pkg.name]: isPackageEnabled
            ? t('install.packageDisabled')
            : t('install.packageEnabled'),
        };
        setInstalledPackages(updated);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[Package Toggle] Package toggle responded with non-OK status:`,
          (res as any)?.error?.message ?? res,
        );
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(
        `[Package Toggle] Failed to toggle package}:`,
        err?.error?.message ?? err,
      );
    }
  };

  return (
    <Tooltip
      title={
        isPackageEnabled
          ? t('installedPackages.table.tooltips.disablePackage')
          : t('installedPackages.table.tooltips.enablePackage')
      }
    >
      <IconButton
        size="small"
        sx={{ color: theme => theme.palette.text.primary }}
        onClick={handleToggle}
      >
        {isPackageEnabled ? <Switch checked /> : <Switch />}
      </IconButton>
    </Tooltip>
  );
};

export const UninstallPackage = ({ pkg }: { pkg: InstalledPackageRow }) => {
  const { t } = useTranslation();
  if (!pkg.hasEntity || pkg.missingDynamicArtifact) {
    return (
      <Tooltip
        title={
          !pkg.hasEntity
            ? t('installedPackages.table.tooltips.enableActions')
            : t('tooltips.missingDynamicArtifact' as any, { type: 'package' })
        }
      >
        <IconButton
          size="small"
          disabled
          sx={{ color: theme => theme.palette.action.disabled }}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <IconButton
      size="small"
      sx={{ color: theme => theme.palette.text.primary }}
      onClick={() => {}}
    >
      <DeleteIcon />
    </IconButton>
  );
};

export const PackageName = ({ pkg }: { pkg: InstalledPackageRow }) => {
  const packagePath = useRouteRef(packageRouteRef);

  if (!pkg.hasEntity) return <>{pkg.displayName}</>;
  return (
    <Link to={packagePath({ namespace: pkg.namespace!, name: pkg.name! })}>
      {pkg.displayName}
    </Link>
  );
};
