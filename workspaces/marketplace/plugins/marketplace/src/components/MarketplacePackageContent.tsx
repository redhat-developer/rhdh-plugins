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
import { useRouteRef } from '@backstage/core-plugin-api';

import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import {
  MarketplacePackage,
  MarketplacePackageInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { packageInstallRouteRef } from '../routes';
import { usePackages } from '../hooks/usePackages';
import { Markdown } from './Markdown';

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

const MarketplacePackageContentReal = ({
  pkg,
}: {
  pkg: MarketplacePackage;
}) => {
  // const getIndexPath = useRouteRef(rootRouteRef);
  const getInstallPath = useRouteRef(packageInstallRouteRef);

  // const withSearchParameter = (name: string, value: string) =>
  //   `${getIndexPath()}?${encodeURIComponent(name)}=${encodeURIComponent(
  //     value,
  //   )}`;

  let readme = pkg.metadata.description ?? '';
  if (!readme.startsWith('#')) {
    readme = `# About\n\n${readme}`;
  }

  return (
    <Content>
      <Stack direction="row" spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" style={{ fontWeight: '500' }}>
            {pkg.metadata.title || pkg.metadata.name}
          </Typography>
          {/* {pkg.spec?.developer ? (
            <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
              {' by '}
              <Link
                to={withSearchParameter('developer', pkg.spec.developer)}
                color="primary"
              >
                {pkg.spec.developer}
              </Link>
            </Typography>
          ) : null} */}
          {/* {pkg.spec?.categories?.map(category => (
            <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
              <LinkButton
                to={withSearchParameter('category', category)}
                variant="outlined"
                style={{ fontWeight: 'normal', padding: '2px 6px' }}
              >
                {category}
              </LinkButton>
            </Typography>
          ))} */}
        </Stack>
      </Stack>

      <br />
      <br />

      <Grid container>
        <Grid item md={2}>
          <LinkButton
            disabled={
              pkg.spec?.installStatus ===
              MarketplacePackageInstallStatus.Installed
            }
            to={getInstallPath({
              namespace: pkg.metadata.namespace!,
              name: pkg.metadata.name,
            })}
            color="primary"
            variant="contained"
          >
            {pkg.spec?.installStatus !==
            MarketplacePackageInstallStatus.Installed
              ? 'Install'
              : MarketplacePackageInstallStatus.Installed}
          </LinkButton>
        </Grid>
        <Grid item md={10}>
          <Markdown content={readme} />
        </Grid>
      </Grid>
    </Content>
  );
};

export const MarketplacePackageContent = ({
  pluginName,
}: {
  pluginName: string;
}) => {
  const packages = usePackages({});
  const pkg = packages.data?.items?.find(p => p.metadata.name === pluginName);

  if (packages.isLoading) {
    return <MarketplacePackageContentSkeleton />;
  } else if (!pkg) {
    return (
      <ErrorPage statusMessage={`Package with name ${pluginName} not found!`} />
    );
  }
  return <MarketplacePackageContentReal pkg={pkg} />;
};
