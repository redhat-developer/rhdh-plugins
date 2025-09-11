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
  MarketplacePackage,
  MarketplacePlugin,
  MarketplacePluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import {
  mapBackstageRoleToLabel,
  mapMarketplacePluginInstallStatusToButton,
  mapPackageInstallStatusToLabel,
} from '../labels';
import { rootRouteRef, pluginInstallRouteRef, pluginRouteRef } from '../routes';
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

export const MarketplacePluginContentSkeleton = () => {
  return (
    <Content>
      <Stack direction="row" spacing={2}>
        <Skeleton
          variant="rectangular"
          sx={{ width: '80px', height: '80px' }}
        />
        <Stack spacing={0.5}>
          <Skeleton>
            <Typography variant="subtitle1">Entry name</Typography>
          </Skeleton>
          <Skeleton>
            <Typography variant="subtitle2">by someone</Typography>
          </Skeleton>
          <Skeleton>
            <Typography variant="subtitle2">Category</Typography>
          </Skeleton>
        </Stack>
      </Stack>
      <br />
      <br />
      <Grid container spacing={2}>
        <Grid item md={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Highlights
          </Typography>

          <Skeleton sx={{ width: '60%' }} />
          <Skeleton sx={{ width: '40%' }} />
        </Grid>
        <Grid item md={10}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            About
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

const columns: TableColumn<MarketplacePackage>[] = [
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
          ? mapBackstageRoleToLabel[data.spec.backstage.role]
          : undefined) ??
        data.spec?.backstage?.role ??
        '-'
      );
    },
  },
  {
    title: 'Supported version',
    field: 'spec.backstage.supportedVersions',
    type: 'string',
  },
  {
    title: 'Status',
    field: 'spec.installStatus',
    type: 'string',
    render(data) {
      return data.spec?.installStatus
        ? mapPackageInstallStatusToLabel[data.spec.installStatus]
        : '-';
    },
  },
];

const PluginPackageTable = ({ plugin }: { plugin: MarketplacePlugin }) => {
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
        Versions
      </Typography>
      <Table
        columns={columns}
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
  plugin: MarketplacePlugin;
}) => {
  const extensionsConfig = useExtensionsConfiguration();
  const nodeEnvironment = useNodeEnvironment();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isPluginEnabled, setIsPluginEnabled] = useState<boolean>(false);
  const open = Boolean(anchorEl);
  const { installedPlugins, setInstalledPlugins } = useInstallationContext();

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

  const params = useRouteRefParams(pluginRouteRef);
  const getIndexPath = useRouteRef(rootRouteRef);
  const getInstallPath = useRouteRef(pluginInstallRouteRef);
  const pluginConfigPerm = usePluginConfigurationPermissions(
    params.namespace,
    params.name,
  );

  const { mutateAsync: enablePlugin } = useEnablePlugin();

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

    try {
      const res = await enablePlugin({
        namespace: plugin.metadata.namespace ?? 'default',
        name: plugin.metadata.name,
        disabled: !newValue,
      });
      if (res?.status !== 'OK') {
        // eslint-disable-next-line no-console
        console.warn(
          `[Plugin Toggle] Plugin toggle responded with non-OK status:`,
          (res as any)?.error?.message ?? res,
        );
      } else {
        const updatedPlugins: InstallationType = {
          ...installedPlugins,
          [plugin.metadata.title ?? plugin.metadata.name]:
            `Plugin ${isPluginEnabled ? 'disabled' : 'enabled'}`,
        };
        setInstalledPlugins(updatedPlugins);
        handleClose();
        navigate('/extensions');
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(
        `[Plugin Toggle] Failed to toggle plugin:`,
        err?.error?.message ?? err,
      );
    }
  };

  const withFilter = (name: string, value: string) =>
    `${getIndexPath()}?filter=${encodeURIComponent(name)}=${encodeURIComponent(
      value,
    )}`;

  const displayName = plugin.metadata.title ?? plugin.metadata.name;
  const about = plugin.spec?.description ?? plugin.metadata.description ?? '';

  const highlights = plugin.spec?.highlights ?? [];
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

    const primaryText = isPluginEnabled ? 'Disable' : 'Enable';
    const secondaryText = isPluginEnabled
      ? 'Plugin currently enabled'
      : 'Plugin currently disabled';

    const testId = isPluginEnabled ? 'disable-plugin' : 'enable-plugin';

    if (disablePluginActions) {
      return (
        <Tooltip
          title={getPluginActionTooltipMessage(isProductionEnvironment, {
            read: pluginConfigPerm.data?.read ?? 'DENY',
            write: pluginConfigPerm.data?.write ?? 'DENY',
          })}
        >
          <div>
            <Button
              color="primary"
              variant="contained"
              disabled={disablePluginActions}
              data-testId="install-disabled"
            >
              Install
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
          View
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
            Actions
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
              <ListItemText primary="Edit" secondary="Plugin configurations" />
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
        {
          mapMarketplacePluginInstallStatusToButton[
            plugin.spec?.installStatus ??
              MarketplacePluginInstallStatus.NotInstalled
          ]
        }
      </LinkButton>
    );
  };

  return (
    <Content>
      <Stack direction="column" gap={4}>
        <Stack direction="row" spacing={2} alignItems="center">
          <PluginIcon plugin={plugin} size={80} />
          <Stack spacing={1}>
            <Typography variant="h3" style={{ fontWeight: '500' }}>
              {displayName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {plugin.spec?.authors ? (
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

              <BadgeChip plugin={plugin} />
            </Stack>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid item md={3}>
            {highlights.length > 0 ? (
              <>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 500, fontSize: '1rem', mb: 0.5 }}
                >
                  Highlights
                </Typography>
                <ul style={{ paddingLeft: '20px', marginBottom: '24px' }}>
                  {highlights.map(highlight => (
                    <li key={highlight} style={{ marginBottom: '8px' }}>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {pluginActionButton()}
          </Grid>
          <Grid item md={9}>
            <Markdown title="About" content={about} />

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
