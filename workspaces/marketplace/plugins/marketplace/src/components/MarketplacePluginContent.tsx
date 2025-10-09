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

import { Fragment, useState, MouseEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Content,
  ErrorPage,
  Link,
  LinkButton,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';

import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EditIcon from '@mui/icons-material/Edit';
import MenuItem from '@mui/material/MenuItem';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';

import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import {
  isMarketplacePackage,
  MarketplacePackage,
  MarketplacePlugin,
  MarketplacePluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import {
  mapBackstageRoleToLabel,
  mapMarketplacePluginInstallStatusToButton,
  mapPackageInstallStatusToLabel,
} from '../labels';
import {
  rootRouteRef,
  pluginInstallRouteRef,
  pluginRouteRef,
  packageRouteRef,
  packageInstallRouteRef,
} from '../routes';
import { usePlugin } from '../hooks/usePlugin';
import { usePluginPackages } from '../hooks/usePluginPackages';
import { useExtensionsConfiguration } from '../hooks/useExtensionsConfiguration';
import { usePluginConfigurationPermissions } from '../hooks/usePluginConfigurationPermissions';
import { useNodeEnvironment } from '../hooks/useNodeEnvironment';
import { getPluginActionTooltipMessage } from '../utils';

import { BadgeChip } from './Badges';
import { PluginIcon } from './PluginIcon';
import { Markdown } from './Markdown';

import { Links } from './Links';
import { ActionsMenu } from './ActionsMenu';
import { useEnablePlugin } from '../hooks/useEnablePlugin';
import {
  InstallationType,
  useInstallationContext,
} from './InstallationContext';
import { useTranslation } from '../hooks/useTranslation';

const PluginMetadataSection = ({
  value,
  title,
}: {
  value: any;
  title: string;
}) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    if (value.length === 0 || typeof value[0] !== 'string') return null;
    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{ fontWeight: 500, fontSize: '1rem', mb: 0.5 }}
        >
          {title}
        </Typography>
        {value.length === 1 ? (
          <Typography variant="body2">{value[0]}</Typography>
        ) : (
          <ul style={{ paddingLeft: '20px', marginBottom: '24px' }}>
            {value.map((item, index) => (
              <li key={item || index} style={{ marginBottom: '8px' }}>
                {item}
              </li>
            ))}
          </ul>
        )}
      </Box>
    );
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{ fontWeight: 500, fontSize: '1rem', mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography variant="body2">{String(value)}</Typography>
      </Box>
    );
  }

  return null;
};

export const MarketplacePluginContentSkeleton = () => {
  const { t } = useTranslation();

  return (
    <Content>
      <Stack direction="row" spacing={2}>
        <Skeleton
          variant="rectangular"
          sx={{ width: '80px', height: '80px' }}
        />
        <Stack spacing={0.5}>
          <Skeleton>
            <Typography variant="subtitle1">
              {t('metadata.entryName')}
            </Typography>
          </Skeleton>
          <Skeleton>
            <Typography variant="subtitle2">
              {t('metadata.bySomeone')}
            </Typography>
          </Skeleton>
          <Skeleton>
            <Typography variant="subtitle2">
              {t('metadata.category')}
            </Typography>
          </Skeleton>
        </Stack>
      </Stack>
      <br />
      <br />
      <Grid container spacing={2}>
        <Grid item md={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {t('metadata.highlights')}
          </Typography>

          <Skeleton sx={{ width: '60%' }} />
          <Skeleton sx={{ width: '40%' }} />
        </Grid>
        <Grid item md={10}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {t('metadata.about')}
          </Typography>

          <Skeleton sx={{ width: '30%' }} />
          <Skeleton sx={{ width: '80%' }} />
          <Skeleton sx={{ width: '85%' }} />
          <Skeleton sx={{ width: '90%' }} />
          <Skeleton sx={{ width: '50%' }} />
        </Grid>
      </Grid>
    </Content>
  );
};

const getColumns = (t: any): TableColumn<MarketplacePackage>[] => [
  {
    title: 'Package name',
    field: 'spec.packageName',
    type: 'string',
    width: '40%',
  },
  {
    title: 'Version',
    field: 'spec.version',
    type: 'string',
  },
  {
    title: 'Role',
    field: 'spec.backstage.role',
    type: 'string',
    render(data) {
      return (
        (data.spec?.backstage?.role
          ? mapBackstageRoleToLabel(data.spec.backstage.role, t)
          : undefined) ??
        data.spec?.backstage?.role ??
        '-'
      );
    },
  },
  {
    title: 'Backstage compatibility version',
    field: 'spec.backstage.supportedVersions',
    type: 'string',
  },
  {
    title: 'Status',
    field: 'spec.installStatus',
    type: 'string',
    render(data) {
      return data.spec?.installStatus
        ? mapPackageInstallStatusToLabel(data.spec.installStatus, t)
        : '-';
    },
  },
];

const PluginPackageTable = ({
  plugin,
}: {
  plugin: MarketplacePlugin | MarketplacePackage;
}) => {
  const { t } = useTranslation();

  const packages = usePluginPackages(
    plugin.metadata.namespace!,
    plugin.metadata.name,
  );

  if (!packages.data?.length) {
    return null;
  }

  return (
    <div>
      <Typography
        variant="h6"
        component="h3"
        sx={{ fontWeight: 500, fontSize: '1rem', mb: 0.5, pt: 2 }}
      >
        {t('metadata.versions')}
      </Typography>
      <Table
        columns={getColumns(t)}
        data={packages.data}
        options={{
          toolbar: false,
          paging: false,
          search: false,
          padding: 'dense',
        }}
        style={{ outline: 'none' }}
      />
    </div>
  );
};

export const MarketplacePluginContent = ({
  plugin,
}: {
  plugin: MarketplacePlugin | MarketplacePackage;
}) => {
  const { t } = useTranslation();
  const extensionsConfig = useExtensionsConfiguration();
  const nodeEnvironment = useNodeEnvironment();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isPluginEnabled, setIsPluginEnabled] = useState<boolean>(false);
  const open = Boolean(anchorEl);
  const { installedPlugins, setInstalledPlugins } = useInstallationContext();

  const isPackage = isMarketplacePackage(plugin);

  useEffect(() => {
    if (!plugin.spec) {
      return;
    }
    if (
      plugin.spec?.installStatus === MarketplacePluginInstallStatus.Installed ||
      plugin.spec?.installStatus ===
        MarketplacePluginInstallStatus.UpdateAvailable
    ) {
      setIsPluginEnabled(true);
    } else {
      setIsPluginEnabled(false);
    }
  }, [plugin]);
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const navigate = useNavigate();

  const params = useRouteRefParams(
    isPackage ? packageRouteRef : pluginRouteRef,
  );
  const getIndexPath = useRouteRef(rootRouteRef);
  const getInstallPath = useRouteRef(
    isPackage ? packageInstallRouteRef : pluginInstallRouteRef,
  );
  const pluginConfigPerm = usePluginConfigurationPermissions(
    params.namespace,
    isPackage ? (plugin.spec?.partOf?.[0] ?? '') : params.name,
  );

  const { mutateAsync: enablePlugin } = useEnablePlugin(isPackage);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    navigate({
      pathname: getInstallPath({
        namespace: plugin.metadata.namespace!,
        name: plugin.metadata.name,
      }),
    });
  };

  const handleToggle = async () => {
    const newValue = !isPluginEnabled;
    setIsPluginEnabled(newValue);
    const subString: string = isPackage ? 'Package' : 'Plugin';

    try {
      const res = await enablePlugin({
        namespace: plugin.metadata.namespace ?? 'default',
        name: plugin.metadata.name,
        disabled: !newValue,
      });

      if (res?.status !== 'OK') {
        // eslint-disable-next-line no-console
        console.warn(
          `[${subString} Toggle] ${subString} toggle responded with non-OK status:`,
          (res as any)?.error?.message ?? res,
        );
      } else {
        const updatedPlugins: InstallationType = {
          ...installedPlugins,
          [plugin.metadata.title ?? plugin.metadata.name]:
            `${subString} ${isPluginEnabled ? 'disabled' : 'enabled'}`,
        };
        setInstalledPlugins(updatedPlugins);
        handleClose();
        navigate(isPackage ? '/extensions' : '/extensions/installed-plugins');
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(
        `[${subString} Toggle] Failed to toggle ${subString.toLowerCase()}:`,
        err?.error?.message ?? err,
      );
    }
  };

  const withFilter = (name: string, value: string) =>
    `${getIndexPath()}?filter=${encodeURIComponent(name)}=${encodeURIComponent(
      value,
    )}`;

  const displayName = plugin.metadata.title ?? plugin.metadata.name;
  const about = isPackage
    ? ''
    : (plugin.spec?.description ?? plugin.metadata.description ?? '');

  const highlights = isPackage ? [] : (plugin.spec?.highlights ?? []);
  const isProductionEnvironment =
    nodeEnvironment?.data?.nodeEnv === 'production';

  const pluginActionButton = () => {
    const disablePluginActions =
      pluginConfigPerm.data?.read !== 'ALLOW' &&
      pluginConfigPerm.data?.write !== 'ALLOW';
    const viewOnly =
      isProductionEnvironment ||
      pluginConfigPerm.data?.write !== 'ALLOW' ||
      !extensionsConfig.data?.enabled;

    const icon = isPluginEnabled ? (
      <ToggleOnOutlinedIcon />
    ) : (
      <ToggleOffOutlinedIcon />
    );

    const primaryText = isPluginEnabled
      ? t('actions.disable')
      : t('actions.enable');
    let secondaryText = '';
    if (isPluginEnabled) {
      if (isPackage) {
        secondaryText = t('actions.packageCurrentlyEnabled');
      } else {
        secondaryText = t('actions.pluginCurrentlyEnabled');
      }
    } else {
      if (isPackage) {
        secondaryText = t('actions.packageCurrentlyDisabled');
      } else {
        secondaryText = t('actions.pluginCurrentlyDisabled');
      }
    }

    const testId = isPluginEnabled ? 'disable-plugin' : 'enable-plugin';

    if (disablePluginActions) {
      return (
        <Tooltip
          title={getPluginActionTooltipMessage(
            isProductionEnvironment,
            {
              read: pluginConfigPerm.data?.read ?? 'DENY',
              write: pluginConfigPerm.data?.write ?? 'DENY',
            },
            t,
          )}
        >
          <div>
            <Button
              color="primary"
              variant="contained"
              disabled={disablePluginActions}
              data-testId="install-disabled"
            >
              {t('actions.install')}
            </Button>
          </div>
        </Tooltip>
      );
    }

    if (viewOnly) {
      return (
        <LinkButton
          to={getInstallPath({
            namespace: plugin.metadata.namespace!,
            name: plugin.metadata.name,
          })}
          color="primary"
          variant="contained"
          data-testId="view"
        >
          {t('actions.view')}
        </LinkButton>
      );
    }

    if (
      plugin.spec?.installStatus === MarketplacePluginInstallStatus.Installed ||
      plugin.spec?.installStatus ===
        MarketplacePluginInstallStatus.UpdateAvailable ||
      plugin.spec?.installStatus === MarketplacePluginInstallStatus.Disabled
    ) {
      return (
        <>
          <Button
            variant="contained"
            disableElevation
            onClick={handleClick}
            endIcon={<KeyboardArrowDownIcon />}
            color="primary"
            data-testId="plugin-actions"
          >
            {t('actions.actions')}
          </Button>
          <ActionsMenu
            id="actions-button"
            data-testId="actions-button"
            MenuListProps={{
              'aria-labelledby': 'actions-button',
            }}
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            <MenuItem
              data-testId="edit-configuration"
              onClick={handleEdit}
              disableRipple
            >
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText
                primary={t('actions.edit')}
                secondary={
                  isMarketplacePackage(plugin)
                    ? t('actions.packageConfiguration')
                    : t('actions.pluginConfigurations')
                }
              />
            </MenuItem>
            <MenuItem
              data-testId={testId}
              onClick={handleToggle}
              disableRipple
              sx={{ minWidth: '300px' }}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={primaryText} secondary={secondaryText} />
            </MenuItem>
          </ActionsMenu>
        </>
      );
    }

    return (
      <LinkButton
        to={getInstallPath({
          namespace: plugin.metadata.namespace!,
          name: plugin.metadata.name,
        })}
        color="primary"
        variant="contained"
        data-testId="install"
      >
        {mapMarketplacePluginInstallStatusToButton(
          (plugin.spec?.installStatus as MarketplacePluginInstallStatus) ??
            MarketplacePluginInstallStatus.NotInstalled,
          t,
        )}
      </LinkButton>
    );
  };

  return (
    <Content>
      <Stack direction="column" gap={4}>
        <Stack direction="row" spacing={2} alignItems="center">
          {!isPackage && <PluginIcon plugin={plugin} size={80} />}
          <Stack spacing={1}>
            <Typography variant="h3" style={{ fontWeight: '500' }}>
              {displayName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {!isPackage && plugin.spec?.authors ? (
                <Typography
                  variant="subtitle2"
                  style={{ fontWeight: 'normal' }}
                >
                  {plugin.spec.authors.map((author, index) => (
                    <Fragment key={author.name}>
                      {index > 0 ? ', ' : ' by '}
                      <Link
                        key={author.name}
                        to={withFilter('spec.authors.name', author.name)}
                        color="primary"
                        onClick={e => e.stopPropagation()}
                      >
                        {author.name}
                      </Link>
                    </Fragment>
                  ))}
                </Typography>
              ) : null}
              {plugin.spec?.author ? (
                <Typography
                  variant="subtitle2"
                  style={{ fontWeight: 'normal' }}
                >
                  by{' '}
                  <Link
                    key={plugin.spec?.author}
                    to={withFilter('spec.author', plugin.spec?.author)}
                    color="primary"
                    onClick={e => e.stopPropagation()}
                  >
                    {plugin.spec?.author}
                  </Link>
                </Typography>
              ) : null}
              {!isPackage && <BadgeChip plugin={plugin} />}
            </Stack>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid item md={3}>
            <PluginMetadataSection
              title={t('metadata.highlights')}
              value={highlights}
            />

            {isPackage ? (
              <PluginMetadataSection
                title={t('plugin.author')}
                value={plugin.spec?.author}
              />
            ) : (
              <PluginMetadataSection
                title={
                  plugin.spec?.authors && plugin.spec.authors?.length > 1
                    ? t('plugin.authors')
                    : t('plugin.author')
                }
                value={plugin.spec?.authors?.map(author => author.name)}
              />
            )}

            <PluginMetadataSection
              title={t('plugin.tags')}
              value={plugin.metadata?.tags}
            />

            <PluginMetadataSection
              title={t('search.category')}
              value={plugin.spec?.categories}
            />

            <PluginMetadataSection
              title={t('metadata.publisher')}
              value={plugin.spec?.publisher}
            />

            <PluginMetadataSection
              title={t('metadata.supportProvider')}
              value={plugin.spec?.support?.provider}
            />

            {pluginActionButton()}
          </Grid>
          <Grid item md={9}>
            <Markdown title={t('metadata.about')} content={about} />

            <Links entity={plugin} />

            <PluginPackageTable plugin={plugin} />
          </Grid>
        </Grid>
      </Stack>
    </Content>
  );
};

export const MarketplacePluginContentLoader = () => {
  const params = useRouteRefParams(pluginRouteRef);
  const plugin = usePlugin(params.namespace, params.name);

  if (plugin.isLoading) {
    return <MarketplacePluginContentSkeleton />;
  } else if (plugin.data) {
    return <MarketplacePluginContent plugin={plugin.data} />;
  } else if (plugin.error) {
    return <ErrorPage statusMessage={plugin.error.toString()} />;
  }
  return <ErrorPage statusMessage={`Plugin ${params.name} not found!`} />;
};
