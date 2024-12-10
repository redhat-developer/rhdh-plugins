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
  MarkdownContent,
} from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';

import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { MarketplacePluginEntry } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { usePlugins } from '../hooks/usePlugins';
import { detailsRouteRef, rootRouteRef } from '../routes';

const EntryContentSkeleton = () => {
  return (
    <Content>
      <Stack spacing={0.5}>
        <Skeleton>
          <Typography variant="subtitle1">Install plugin</Typography>
        </Skeleton>
        <Skeleton>
          <Typography variant="subtitle2">by someone</Typography>
        </Skeleton>
      </Stack>
      <br />
      <br />
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
        Installation
      </Typography>

      <Skeleton sx={{ width: '30%' }} />
      <Skeleton sx={{ width: '80%' }} />
      <Skeleton sx={{ width: '85%' }} />
      <Skeleton sx={{ width: '90%' }} />
      <Skeleton sx={{ width: '50%' }} />
    </Content>
  );
};

const EntryContent = ({ entry }: { entry: MarketplacePluginEntry }) => {
  const getIndexPath = useRouteRef(rootRouteRef);

  const withSearchParameter = (name: string, value: string) =>
    `${getIndexPath()}?${encodeURIComponent(name)}=${encodeURIComponent(
      value,
    )}`;

  let installMarkdown = entry.spec?.installation?.markdown ?? '';
  if (!installMarkdown.startsWith('#')) {
    installMarkdown = `# Installation\n\n${installMarkdown}`;
  }

  return (
    <Content>
      <Stack spacing={0.5}>
        <Typography variant="h2" style={{ fontWeight: '500' }}>
          Install {entry.metadata.title || entry.metadata.name}
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
      </Stack>

      <br />
      <br />

      <MarkdownContent content={installMarkdown} dialect="gfm" />
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

export const MarketplaceEntryInstallDrawer = () => {
  const params = useParams();
  const navigate = useNavigate();
  const getDetailsPath = useRouteRef(detailsRouteRef);

  // TODO: remove workaround for overlapping subroutes
  let entryName = params['*'];
  if (entryName?.includes('/')) {
    entryName = entryName.substring(0, entryName.indexOf('/'));
  }

  // TODO: remove workaround for overlapping subroutes
  const open = params['*']?.endsWith('/install');
  const handleClose = () => navigate(getDetailsPath({ name: entryName! }));

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={handleClose}
      PaperProps={{ sx: { minWidth: '300px', width: '50vw' } }}
    >
      {/* install page:
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
