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
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ItemCardGrid, Link, LinkButton } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@material-ui/core'; // Or @mui/styles if using MUI v5 with JSS

import { MarketplacePlugin } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { rootRouteRef, pluginRouteRef } from '../routes';
import { BadgeTriange } from './Badges';
import { PluginIcon } from './PluginIcon';

export interface PluginCardSkeletonProps {
  animation?: 'pulse' | 'wave' | false;
}

export const PluginCardGrid = ItemCardGrid;

const useStyles = makeStyles(() => ({
  pluginCategoryLinkButton: {
    fontWeight: 'normal',
    padding: '2px 6px',
    '&:focus-visible': {
      border: `1px solid`,
    },
  },
}));

export const PluginCardSkeleton = ({ animation }: PluginCardSkeletonProps) => (
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
      <Skeleton animation={animation} style={{ width: 50 }} />
    </CardActions>
  </Card>
);

// orange: #EC7A08

// TODO: add link around card
export const PluginCard = ({ plugin }: { plugin: MarketplacePlugin }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const getIndexPath = useRouteRef(rootRouteRef);
  const getPluginPath = useRouteRef(pluginRouteRef);

  const pluginPath = `${getPluginPath({
    namespace: plugin.metadata.namespace!,
    name: plugin.metadata.name,
  })}${searchParams.size > 0 ? '?' : ''}${searchParams}`;

  //  + (searchParams.size > 0 ? `?${searchParams.toString()}` : '')

  const withFilter = (name: string, value: string) =>
    `${getIndexPath()}?filter=${encodeURIComponent(name)}=${encodeURIComponent(
      value,
    )}`;

  return (
    <Card
      variant="outlined"
      sx={{
        '&:hover': { backgroundColor: 'background.default', cursor: 'pointer' },
      }}
      onClick={() => navigate(pluginPath)}
    >
      <BadgeTriange plugin={plugin} />
      <CardContent sx={{ backgroundColor: 'transparent' }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <PluginIcon plugin={plugin} size={80} />
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" style={{ fontWeight: '500' }}>
                {plugin.metadata.title ?? plugin.metadata.name}
              </Typography>

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

              {plugin.spec?.categories && plugin.spec.categories.length > 0 ? (
                <Typography
                  variant="subtitle2"
                  style={{ fontWeight: 'normal' }}
                >
                  <LinkButton
                    to={withFilter(
                      'spec.categories',
                      plugin.spec.categories[0],
                    )}
                    variant="outlined"
                    className={classes.pluginCategoryLinkButton}
                    onClick={e => e.stopPropagation()}
                  >
                    {plugin.spec.categories[0]}
                  </LinkButton>
                </Typography>
              ) : null}
            </Stack>
          </Stack>

          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 'normal',
              fontStyle: plugin.metadata.description ? undefined : 'italic',
            }}
          >
            {plugin.metadata.description ?? 'no description available'}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ pl: 2, pr: 2, pb: 2, justifyContent: 'flex-start' }}>
        <Link to={pluginPath} onClick={e => e.stopPropagation()}>
          Read more
        </Link>
      </CardActions>
    </Card>
  );
};
