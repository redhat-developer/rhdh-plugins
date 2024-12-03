/*
 * Copyright 2024 The Backstage Authors
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

import { MarketplacePluginEntry } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { usePlugins } from '../hooks/usePlugins';
import { rootRouteRef } from '../routes';

const Icon = ({ entry }: { entry: MarketplacePluginEntry }) =>
  entry.metadata.icon ? (
    <CardMedia
      image={entry.metadata.icon}
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

const EntryContent = ({ entry }: { entry: MarketplacePluginEntry }) => {
  const getIndexPath = useRouteRef(rootRouteRef);

  const withSearchParameter = (name: string, value: string) =>
    `${getIndexPath()}?${encodeURIComponent(name)}=${encodeURIComponent(
      value,
    )}`;

  return (
    <Content>
      <Stack direction="row" spacing={2}>
        <Icon entry={entry} />
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" style={{ fontWeight: '500' }}>
            {entry.metadata.title}
          </Typography>
          {entry.metadata.developer ? (
            <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
              {' by '}
              <Link
                to={withSearchParameter('developer', entry.metadata.developer)}
                color="primary"
              >
                {entry.metadata.developer}
              </Link>
            </Typography>
          ) : null}
          {entry.metadata.categories?.map(category => (
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

          <LinkButton to="install" color="primary" variant="contained">
            Install
          </LinkButton>
        </Grid>
        <Grid item md={10}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            About
          </Typography>
          {entry.metadata.abstract ? (
            <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
              {entry.metadata.abstract}
            </Typography>
          ) : null}
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

export const MarketplaceEntryDetailDrawer = () => {
  const params = useParams();
  const navigate = useNavigate();
  const getIndexPath = useRouteRef(rootRouteRef);

  const entryName = params['*'];

  const open = !!entryName;
  const handleClose = () => navigate(getIndexPath());

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={handleClose}
      PaperProps={{ sx: { minWidth: '300px', width: '55vw' } }}
    >
      {/* params:
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
