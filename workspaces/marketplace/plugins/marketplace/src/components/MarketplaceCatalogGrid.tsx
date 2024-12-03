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
import { useNavigate } from 'react-router-dom';

import {
  useQueryParamState,
  ItemCardGrid,
  Link,
  LinkButton,
} from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { MarketplacePluginEntry } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { usePlugins } from '../hooks/usePlugins';
import { detailsRouteRef, rootRouteRef } from '../routes';

const Icon = ({ entry }: { entry: MarketplacePluginEntry }) =>
  entry.metadata.icon ? (
    <CardMedia
      image={entry.metadata.icon}
      sx={{ width: 80, height: 80, flexShrink: 0 }}
    />
  ) : null;

const EntrySkeleton = ({
  animation,
}: {
  animation?: 'pulse' | 'wave' | false;
}) => (
  <Card variant="outlined">
    <CardContent>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <Skeleton
            variant="rectangular"
            animation={animation}
            sx={{ width: '80px', height: '80px', mr: 2 }}
          />
          <Stack spacing={0.5}>
            <Skeleton animation={animation}>
              <Typography variant="subtitle1">Entry name</Typography>
            </Skeleton>
            <Skeleton animation={animation}>
              <Typography variant="subtitle2">by someone</Typography>
            </Skeleton>
            <Skeleton animation={animation}>
              <Typography variant="subtitle2">Category</Typography>
            </Skeleton>
          </Stack>
        </Stack>
        <div>
          <Skeleton animation={animation} />
          <Skeleton animation={animation} />
          <Skeleton animation={animation} />
        </div>
      </Stack>
    </CardContent>
    <CardActions sx={{ p: 2, justifyContent: 'flex-start' }}>
      <Skeleton animation={animation}>Read more</Skeleton>
    </CardActions>
  </Card>
);

// TODO: add link around card
const Entry = ({ entry }: { entry: MarketplacePluginEntry }) => {
  const navigate = useNavigate();
  const getIndexPath = useRouteRef(rootRouteRef);
  const getDetailsPath = useRouteRef(detailsRouteRef);

  const detailsPath = getDetailsPath({ name: entry.metadata.name });
  const withSearchParameter = (name: string, value: string) =>
    `${getIndexPath()}?${encodeURIComponent(name)}=${encodeURIComponent(
      value,
    )}`;

  return (
    <Card
      variant="outlined"
      sx={{
        '&:hover': { backgroundColor: 'background.default', cursor: 'pointer' },
      }}
      onClick={() => navigate(detailsPath)}
    >
      <CardContent sx={{ backgroundColor: 'transparent' }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <Icon entry={entry} />
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" style={{ fontWeight: '500' }}>
                {entry.metadata.title}
              </Typography>
              {entry.metadata.developer ? (
                <Typography
                  variant="subtitle2"
                  style={{ fontWeight: 'normal' }}
                >
                  {' by '}
                  <Link
                    to={withSearchParameter(
                      'developer',
                      entry.metadata.developer,
                    )}
                    color="primary"
                    onClick={e => e.stopPropagation()}
                  >
                    {entry.metadata.developer}
                  </Link>
                </Typography>
              ) : null}
              {entry.metadata.categories &&
              entry.metadata.categories.length > 0 ? (
                <Typography
                  variant="subtitle2"
                  style={{ fontWeight: 'normal' }}
                >
                  <LinkButton
                    to={withSearchParameter(
                      'category',
                      entry.metadata.categories[0],
                    )}
                    variant="outlined"
                    style={{ fontWeight: 'normal', padding: '2px 6px' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {entry.metadata.categories[0]}
                  </LinkButton>
                </Typography>
              ) : null}
            </Stack>
          </Stack>

          {entry.metadata.abstract ? (
            <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
              {entry.metadata.abstract}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
      <CardActions sx={{ pl: 2, pr: 2, pb: 2, justifyContent: 'flex-start' }}>
        <Link to={detailsPath} onClick={e => e.stopPropagation()}>
          Read more
        </Link>
      </CardActions>
    </Card>
  );
};

export const MarketplaceCatalogGrid = () => {
  const plugins = usePlugins();

  const [search] = useQueryParamState<string | undefined>('q');

  const filteredEntries = React.useMemo(() => {
    if (!search || !plugins.data) {
      return plugins.data;
    }
    const lowerCaseSearch = search.toLocaleLowerCase('en-US');
    return plugins.data.filter(entry => {
      const lowerCaseValue = entry.metadata.title.toLocaleLowerCase('en-US');
      return lowerCaseValue.includes(lowerCaseSearch);
    });
  }, [search, plugins.data]);

  return (
    <ItemCardGrid>
      {plugins.isLoading ? (
        <>
          <EntrySkeleton />
          <EntrySkeleton />
          <EntrySkeleton />
          <EntrySkeleton />
        </>
      ) : null}
      {filteredEntries?.map(entry => (
        <Entry key={entry.metadata.name} entry={entry} />
      ))}
    </ItemCardGrid>
  );
};
