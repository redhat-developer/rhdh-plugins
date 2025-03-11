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

import { Content, ErrorPage, LinkButton } from '@backstage/core-components';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';

import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';

import {
  MarketplacePackage,
  MarketplacePackageInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { mapPackageInstallStatusToButton } from '../labels';
import { packageInstallRouteRef } from '../routes';
import { usePackage } from '../hooks/usePackage';
import { Links } from './Links';

const KeyValue = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  if (!value) {
    return null;
  }
  return (
    <div>
      <strong>{label}</strong>
      <br />
      {value}
    </div>
  );
};

const MarketplacePackageContentSkeleton = () => {
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
      <Grid container>
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

const MarketplacePackageContent = ({ pkg }: { pkg: MarketplacePackage }) => {
  const getInstallPath = useRouteRef(packageInstallRouteRef);

  return (
    <Content>
      <Stack direction="column" gap={4}>
        <Stack direction="row" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" style={{ fontWeight: '500' }}>
              {pkg.metadata.title ?? pkg.metadata.name}
            </Typography>
          </Stack>
        </Stack>

        <Grid container>
          <Grid item md={3}>
            <Tooltip
              title={<Typography variant="button">Coming soon!</Typography>}
              arrow
              placement="right"
            >
              <div style={{ display: 'inline-block' }}>
                <LinkButton
                  disabled
                  to={getInstallPath({
                    namespace: pkg.metadata.namespace!,
                    name: pkg.metadata.name,
                  })}
                  color="primary"
                  variant="contained"
                >
                  {
                    mapPackageInstallStatusToButton[
                      pkg.spec?.installStatus ??
                        MarketplacePackageInstallStatus.NotInstalled
                    ]
                  }
                </LinkButton>
              </div>
            </Tooltip>
          </Grid>
          <Grid item md={9}>
            <Stack gap={2}>
              <h2>Not implemented yet</h2>

              <KeyValue label="Package name:" value={pkg.spec?.packageName} />
              <KeyValue label="Version:" value={pkg.spec?.version} />
              <KeyValue
                label="Dynamic plugin path:"
                value={pkg.spec?.dynamicArtifact}
              />
              <KeyValue
                label="Backstage role:"
                value={pkg.spec?.backstage?.role}
              />
              <KeyValue
                label="Supported versions:"
                value={pkg.spec?.backstage?.supportedVersions}
              />
              <KeyValue label="Author:" value={pkg.spec?.author} />
              <KeyValue label="Support:" value={pkg.spec?.support} />
              <KeyValue label="Lifecycle:" value={pkg.spec?.lifecycle} />

              <Links entity={pkg} />

              <div>Package entity:</div>
              <pre>{JSON.stringify(pkg, null, 2)}</pre>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Content>
  );
};

export const MarketplacePackageContentLoader = () => {
  const params = useRouteRefParams(packageInstallRouteRef);
  const pkg = usePackage(params.namespace, params.name);

  if (pkg.isLoading) {
    return <MarketplacePackageContentSkeleton />;
  } else if (pkg.data) {
    return <MarketplacePackageContent pkg={pkg.data} />;
  } else if (pkg.error) {
    return <ErrorPage statusMessage={pkg.error.toString()} />;
  }
  return (
    <ErrorPage
      statusMessage={`Package ${params.namespace}/${params.name} not found!`}
    />
  );
};
