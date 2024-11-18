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

import {
  useQueryParamState,
  ItemCardGrid,
  Link,
  LinkButton,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useQuery } from '@tanstack/react-query';

import { MarketplacePluginEntry } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { MarketplaceApiRef } from '../api';

const EntrySkeleton = ({
  animation,
}: {
  animation?: 'pulse' | 'wave' | false;
}) => (
  <Card variant="outlined">
    <CardContent>
      <Stack direction="row" sx={{ mb: 2 }}>
        <Skeleton
          variant="rectangular"
          animation={animation}
          sx={{ width: '80px', height: '80px', mr: 2 }}
        />
        <Box>
          <Skeleton animation={animation}>
            <Typography variant="subtitle1">Entry name</Typography>
          </Skeleton>
          <Skeleton animation={animation}>
            <Typography variant="subtitle2">by someone</Typography>
          </Skeleton>
          <Skeleton animation={animation}>
            <Typography variant="subtitle2">Category</Typography>
          </Skeleton>
        </Box>
      </Stack>
      <Skeleton animation={animation} />
      <Skeleton animation={animation} />
      <Skeleton animation={animation} />
    </CardContent>
    <CardActions sx={{ p: 2, justifyContent: 'flex-start' }}>
      <Skeleton animation={animation}>
        <Link to="/">Read more</Link>
      </Skeleton>
    </CardActions>
  </Card>
);

const Entry = ({ entry }: { entry: MarketplacePluginEntry }) => (
  <Card variant="outlined">
    <CardContent>
      <Stack direction="row" sx={{ mb: 2 }}>
        <Box
          sx={{ width: '80px', height: '80px', mr: 2, backgroundColor: 'gray' }}
        >
          ICON
        </Box>
        <Box>
          <Typography variant="subtitle1" style={{ fontWeight: '500' }}>
            {entry.metadata.name}
          </Typography>
          {entry.metadata.developer ? (
            <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
              {' by '}
              <Link to="/" color="primary">
                {entry.metadata.developer}
              </Link>
            </Typography>
          ) : null}
          {entry.metadata.categories && entry.metadata.categories.length > 0 ? (
            <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
              <LinkButton
                to="/"
                variant="outlined"
                style={{ fontWeight: 'normal', padding: '2px 6px' }}
              >
                {entry.metadata.categories[0]}
              </LinkButton>
            </Typography>
          ) : null}
        </Box>
      </Stack>

      {entry.metadata.abstract ? (
        <Typography variant="subtitle2" style={{ fontWeight: 'normal' }}>
          {entry.metadata.abstract}
        </Typography>
      ) : null}
    </CardContent>
    <CardActions sx={{ p: 2, justifyContent: 'flex-start' }}>
      <Link to="/">Read more</Link>
    </CardActions>
  </Card>
);

export const MarketplaceCatalogGrid = () => {
  const marketplaceApi = useApi(MarketplaceApiRef);

  const [search] = useQueryParamState<string | undefined>('q');

  const query = useQuery({
    queryKey: ['plugins'],
    queryFn: () => marketplaceApi.getPlugins(),
  });

  const filteredEntries = React.useMemo(() => {
    if (!search || !query.data) {
      return query.data;
    }
    const lowerCaseSearch = search.toLocaleLowerCase('en-US');
    return query.data.filter(entry => {
      const lowerCaseValue = entry.metadata.title.toLocaleLowerCase('en-US');
      return lowerCaseValue.includes(lowerCaseSearch);
    });
  }, [search, query.data]);

  return (
    <ItemCardGrid>
      {query.isLoading ? (
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
