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

import React from 'react';

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
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';

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

import { BadgeChip } from './Badges';
import { PluginIcon } from './PluginIcon';
import { Markdown } from './Markdown';
import { usePluginPackages } from '../hooks/usePluginPackages';
import { usePluginConfigurationPermissions } from '../hooks/usePluginConfigurationPermissions';
import { Links } from './Links';

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
      <Typography variant="h5" sx={{ pt: 2 }}>
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
  const params = useRouteRefParams(pluginRouteRef);
  const getIndexPath = useRouteRef(rootRouteRef);
  const getInstallPath = useRouteRef(pluginInstallRouteRef);
  const pluginConfigPerm = usePluginConfigurationPermissions(
    params.namespace,
    params.name,
  );

  const withFilter = (name: string, value: string) =>
    `${getIndexPath()}?filter=${encodeURIComponent(name)}=${encodeURIComponent(
      value,
    )}`;

  const displayName = plugin.metadata.title ?? plugin.metadata.name;
  const about = plugin.spec?.description ?? plugin.metadata.description ?? '';

  const highlights = plugin.spec?.highlights ?? [];

  const pluginActionButton = () => {
    return (
      <Tooltip
        title={
          pluginConfigPerm.data?.read !== 'ALLOW' &&
          pluginConfigPerm.data?.write !== 'ALLOW'
            ? `You don't have permission to install plugins or view their configurations. Contact your administrator to request access or assistance.`
            : ''
        }
      >
        <div>
          <LinkButton
            to={
              pluginConfigPerm.data?.write === 'ALLOW' ||
              pluginConfigPerm.data?.read === 'ALLOW'
                ? getInstallPath({
                    namespace: plugin.metadata.namespace!,
                    name: plugin.metadata.name,
                  })
                : ''
            }
            color="primary"
            variant="contained"
            disabled={
              pluginConfigPerm.data?.read !== 'ALLOW' &&
              pluginConfigPerm.data?.write !== 'ALLOW'
            }
          >
            {pluginConfigPerm.data?.write !== 'ALLOW'
              ? 'View'
              : mapMarketplacePluginInstallStatusToButton[
                  plugin.spec?.installStatus ??
                    MarketplacePluginInstallStatus.NotInstalled
                ]}
          </LinkButton>
        </div>
      </Tooltip>
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
                    <React.Fragment key={author.name}>
                      {index > 0 ? ', ' : ' by '}
                      <Link
                        key={author.name}
                        to={withFilter('spec.authors.name', author.name)}
                        color="primary"
                        onClick={e => e.stopPropagation()}
                      >
                        {author.name}
                      </Link>
                    </React.Fragment>
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
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Highlights
                </Typography>
                <ul>
                  {highlights.map(highlight => (
                    <li key={highlight}>{highlight}</li>
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
