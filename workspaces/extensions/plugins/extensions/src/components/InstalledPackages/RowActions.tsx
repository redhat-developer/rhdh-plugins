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

import { forwardRef, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRouteRef } from '@backstage/core-plugin-api';
import { Link } from '@backstage/core-components';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import Tooltip, {
  tooltipClasses,
  type TooltipProps,
} from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { ExtensionsPackageInstallStatus } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { useTranslation } from '../../hooks/useTranslation';
import { packageInstallRouteRef, installedPackageRouteRef } from '../../routes';
import { usePackageConfig } from '../../hooks/usePackageConfig';
import { usePackage } from '../../hooks/usePackage';
import { downloadPackageYAML } from '../../utils/downloadPackageYaml';
import { apiErrorMessage } from '../../utils';
import { CATALOG_ENTITY_DOCS_URL } from '../../consts';
import { usePluginConfigurationPermissions } from '../../hooks/usePluginConfigurationPermissions';
import { useEnablePlugin } from '../../hooks/useEnablePlugin';
import { useInstallationContext } from '../InstallationContext';

/**
 * MUI Light tooltip — white surface with shadow for rich content.
 * @see https://v5.mui.com/material-ui/react-tooltip/#customization
 */
const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[2],
    fontSize: theme.typography.body2.fontSize,
    maxWidth: 280,
    padding: theme.spacing(1.5),
  },
}));

/**
 * Forwards ref + DOM listeners so Tooltip works with disabled controls.
 * @see https://v5.mui.com/material-ui/react-tooltip/#custom-child-element
 */
const TooltipChild = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement> & { children: ReactNode }
>(function TooltipChild({ children, ...props }, ref) {
  return (
    <Box component="span" display="inline-flex" ref={ref} {...props}>
      {children}
    </Box>
  );
});

const MissingCatalogEntityTooltip = ({
  children,
}: {
  children: ReactElement;
}) => {
  const { t } = useTranslation();
  const title: ReactNode = (
    <Box>
      <Typography
        variant="subtitle2"
        component="div"
        sx={{ fontWeight: 600, mb: 0.5 }}
      >
        {t('installedPackages.table.tooltips.enableActionsTitle')}
      </Typography>
      <Typography
        variant="body2"
        component="div"
        color="text.secondary"
        sx={{ mb: 1.5 }}
      >
        {t('installedPackages.table.tooltips.enableActions')}
      </Typography>
      <MuiLink
        href={CATALOG_ENTITY_DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        variant="body2"
        underline="hover"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
        }}
        onClick={event => event.stopPropagation()}
      >
        {t('installedPackages.table.tooltips.enableActionsDocsLink')}
        <OpenInNewIcon sx={{ fontSize: '1rem' }} />
      </MuiLink>
    </Box>
  );

  return (
    <LightTooltip title={title} describeChild>
      <TooltipChild>{children}</TooltipChild>
    </LightTooltip>
  );
};

export type InstalledPackageRow = {
  displayName: string;
  packageName: string;
  parentPlugin?: string;
  installStatus?: ExtensionsPackageInstallStatus;
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
  onError,
}: {
  pkg: InstalledPackageRow;
  isProductionEnv: boolean;
  onError?: (error: string) => void;
}) => {
  const { t } = useTranslation();
  const pkgConfig = usePackageConfig(pkg.namespace!, pkg.name!);
  const packageEntity = usePackage(pkg.namespace!, pkg.name!);
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
    if (!pkg.hasEntity) {
      return (
        <MissingCatalogEntityTooltip>
          {disabledIcon}
        </MissingCatalogEntityTooltip>
      );
    }
    return (
      <Tooltip
        title={t('installedPackages.table.tooltips.noDownloadPermissions')}
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
          try {
            const configYaml = pkgConfig.data?.configYaml ?? '';
            if (!configYaml) {
              const dynamicArtifact =
                packageEntity.data?.spec?.dynamicArtifact ??
                `./dynamic-plugins/dist/${pkg.packageName}`;
              const minimalYaml = `plugins:
  - package: ${JSON.stringify(dynamicArtifact)}
    enabled: true
`;
              // eslint-disable-next-line no-console
              console.info(
                `No configuration found for package ${pkg.name}, downloaded a minimal YAML`,
              );
              await downloadPackageYAML(minimalYaml, pkg.name!);
              return;
            }
            await downloadPackageYAML(configYaml, pkg.name!);
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : apiErrorMessage(err) ||
                  (typeof err === 'object' && err !== null && 'message' in err
                    ? String((err as { message: unknown }).message)
                    : String(err)) ||
                  'Unknown error occurred';
            onError?.(
              `Failed to download package ${pkg.name}: ${errorMessage}`,
            );
          }
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
      <MissingCatalogEntityTooltip>
        {disabledEditIcon}
      </MissingCatalogEntityTooltip>
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
  onError,
}: {
  pkg: InstalledPackageRow;
  isProductionEnv: boolean;
  isInstallationEnabled: boolean;
  onError?: (error: string) => void;
}) => {
  const { t } = useTranslation();
  const { installedPackages, setInstalledPackages } = useInstallationContext();
  const { mutateAsync: enablePlugin } = useEnablePlugin(true);
  const packageConfigPermission = usePluginConfigurationPermissions(
    pkg.namespace!,
    pkg.parentPlugin ?? '',
  );
  const [isPackageEnabled, setIsPackageEnabled] = useState(
    pkg.installStatus === ExtensionsPackageInstallStatus.Installed ||
      pkg.installStatus === ExtensionsPackageInstallStatus.UpdateAvailable,
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
    if (!pkg.hasEntity) {
      return (
        <MissingCatalogEntityTooltip>
          {disabledIcon}
        </MissingCatalogEntityTooltip>
      );
    }
    return (
      <Tooltip
        title={t('installedPackages.table.tooltips.noTogglePermissions')}
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
        enabled: newValue,
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
        const errorMessage =
          apiErrorMessage(res) ?? String(res ?? 'Unknown error');
        onError?.(
          `Failed to ${isPackageEnabled ? 'disable' : 'enable'} package ${pkg.name}: ${errorMessage}`,
        );
      }
    } catch (err: unknown) {
      let fallbackMessage: string;
      if (err instanceof Error) {
        fallbackMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        fallbackMessage = String((err as { message: unknown }).message);
      } else {
        fallbackMessage = String(err);
      }
      const errorMessage =
        (apiErrorMessage(err) ?? fallbackMessage) || 'Unknown error';
      onError?.(
        `Failed to ${isPackageEnabled ? 'disable' : 'enable'} package ${pkg.name}: ${errorMessage}`,
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
    if (!pkg.hasEntity) {
      return (
        <MissingCatalogEntityTooltip>
          <IconButton
            size="small"
            disabled
            sx={{ color: theme => theme.palette.action.disabled }}
          >
            <DeleteIcon />
          </IconButton>
        </MissingCatalogEntityTooltip>
      );
    }
    return (
      <Tooltip
        title={t('tooltips.missingDynamicArtifact' as any, { type: 'package' })}
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
  const packagePath = useRouteRef(installedPackageRouteRef);
  const [searchParams] = useSearchParams();

  if (!pkg.hasEntity) return <>{pkg.displayName}</>;

  const path = packagePath({ namespace: pkg.namespace!, name: pkg.name! });
  const searchParamString = searchParams.size > 0 ? `?${searchParams}` : '';

  return <Link to={`${path}${searchParamString}`}>{pkg.displayName}</Link>;
};
