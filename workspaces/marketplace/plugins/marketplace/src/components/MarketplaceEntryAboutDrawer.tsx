/*
 * Copyright Red Hat, Inc.
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
import { useParams, useNavigate } from 'react-router-dom';

import {
  Content,
  ErrorPanel,
  Link,
  LinkButton,
  MarkdownContent,
} from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';

import CardMedia from '@mui/material/CardMedia';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import {
  InstallStatus,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { usePlugins } from '../hooks/usePlugins';
import { installRouteRef, rootRouteRef } from '../routes';

const Icon = ({ entry }: { entry: MarketplacePlugin }) =>
  entry.spec?.icon ? (
    <CardMedia
      image={entry.spec.icon}
      sx={{ width: 80, height: 80, flexShrink: 0 }}
    />
  ) : null;

const EntryContentSkeleton = () => {
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

const EntryContent = ({ entry }: { entry: MarketplacePlugin }) => {
  const getIndexPath = useRouteRef(rootRouteRef);
  const getInstallPath = useRouteRef(installRouteRef);

  const withSearchParameter = (name: string, value: string) =>
    `${getIndexPath()}?${encodeURIComponent(name)}=${encodeURIComponent(
      value,
    )}`;

  let readme = entry.spec?.description ?? entry.metadata.description ?? '';
  if (!readme.startsWith('#')) {
    readme = `# About\n\n${readme}`;
  }

  return (
    <Content>
      <Stack direction="row" spacing={2}>
        <Icon entry={entry} />
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" style={{ fontWeight: '500' }}>
            {entry.metadata.title || entry.metadata.name}
          </Typography>
          {entry.spec?.developer ? (
            <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
              {' by '}
              <Link
                to={withSearchParameter('developer', entry.spec.developer)}
                color="primary"
              >
                {entry.spec.developer}
              </Link>
            </Typography>
          ) : null}
          {entry.spec?.categories?.map(category => (
            <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
              <LinkButton
                to={withSearchParameter('category', category)}
                variant="outlined"
                style={{ fontWeight: 'normal', padding: '2px 6px' }}
              >
                {category}
              </LinkButton>
            </Typography>
          ))}
        </Stack>
      </Stack>

      <br />
      <br />

      <Grid container>
        <Grid item md={2}>
          {entry.spec?.highlights && entry.spec?.highlights.length > 0 ? (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Highlights
              </Typography>
              <ol>
                {entry.spec.highlights.map(highlight => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ol>
            </>
          ) : null}

          <LinkButton
            disabled={entry.spec?.installStatus === InstallStatus.Installed}
            to={getInstallPath({ name: entry.metadata.name })}
            color="primary"
            variant="contained"
          >
            {entry.spec?.installStatus !== InstallStatus.Installed
              ? 'Install'
              : InstallStatus.Installed}
          </LinkButton>
        </Grid>
        <Grid item md={10}>
          <MarkdownContent content={readme} dialect="gfm" />
        </Grid>
      </Grid>
    </Content>
  );
};

const Entry = ({ entryName }: { entryName: string }) => {
  const plugins = usePlugins();
  const entry = plugins.data?.find(e => e.metadata.name === entryName);

  if (plugins.isLoading) {
    return <EntryContentSkeleton />;
  } else if (!entry) {
    return (
      <Content>
        <ErrorPanel
          error={new Error(`Entry with name ${entryName} not found!`)}
        />
      </Content>
    );
  }
  return <EntryContent entry={entry} />;
};

export const MarketplaceEntryAboutDrawer = () => {
  const params = useParams();
  const navigate = useNavigate();
  const getIndexPath = useRouteRef(rootRouteRef);

  // TODO: remove workaround for overlapping subroutes
  let entryName = params['*'];
  if (entryName?.includes('/')) {
    entryName = entryName.substring(0, entryName.indexOf('/'));
  }

  const open = !!entryName;
  const handleClose = () => navigate(getIndexPath());

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={handleClose}
      PaperProps={{ sx: { minWidth: '300px', width: '55vw' } }}
    >
      {/* about page:
      <pre>
        {JSON.stringify(params, null, 2)}
      </pre> */}
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: theme => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      {entryName ? <Entry entryName={entryName} /> : null}
    </Drawer>
  );
};
