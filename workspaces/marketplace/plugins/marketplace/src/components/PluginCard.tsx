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

import { Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ItemCardGrid, Link } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import {
  MarketplacePlugin,
  MarketplacePluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { rootRouteRef, pluginRouteRef } from '../routes';
import { BadgeTriange } from './Badges';
import { CategoryLinkButton } from './CategoryLinkButton';
import { PluginIcon } from './PluginIcon';
import { useTranslation } from '../hooks/useTranslation';

export interface PluginCardSkeletonProps {
  animation?: 'pulse' | 'wave' | false;
}

export const PluginCardGrid = ItemCardGrid;

const renderInstallStatus = (
  installStatus?: MarketplacePluginInstallStatus,
) => {
  if (
    !installStatus ||
    installStatus === MarketplacePluginInstallStatus.NotInstalled
  ) {
    return null;
  }

  switch (installStatus) {
    case MarketplacePluginInstallStatus.Installed:
    case MarketplacePluginInstallStatus.UpdateAvailable:
      return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <CheckCircleOutlineIcon sx={{ fontSize: '16px', color: '#3E8635' }} />
          <Typography variant="body2">Installed</Typography>
        </Stack>
      );

    case MarketplacePluginInstallStatus.Disabled:
      return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography
            variant="body2"
            sx={{ fontSize: '16px', color: '#6A6E73', fontWeight: 'bold' }}
          >
            --
          </Typography>
          <Typography variant="body2">Disabled</Typography>
        </Stack>
      );

    default:
      return null;
  }
};

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
  const { t } = useTranslation();
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
        position: 'relative',
        '&:hover': { backgroundColor: 'background.default', cursor: 'pointer' },
      }}
      onClick={() => navigate(pluginPath)}
    >
      <BadgeTriange plugin={plugin} />
      <CardContent sx={{ backgroundColor: 'transparent' }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ minHeight: '120px', alignItems: 'center' }}
          >
            <PluginIcon plugin={plugin} size={80} />
            <Stack spacing={0.5} sx={{ justifyContent: 'center' }}>
              <Typography variant="subtitle1" style={{ fontWeight: '500' }}>
                {plugin.metadata.title ?? plugin.metadata.name}
              </Typography>

              {plugin.spec?.authors ? (
                <Typography
                  variant="subtitle2"
                  style={{ fontWeight: 'normal' }}
                >
                  {plugin.spec.authors.map((author, index) => (
                    <Fragment key={author.name}>
                      {index > 0 ? t('common.comma') : t('common.by')}
                      <Link
                        key={author.name}
                        to={withFilter('author', author.name)}
                        color="primary"
                        onClick={e => e.stopPropagation()}
                      >
                        {author.name}
                      </Link>
                    </Fragment>
                  ))}
                </Typography>
              ) : null}

              {plugin.spec?.categories && plugin.spec.categories.length > 0 ? (
                <Typography
                  variant="subtitle2"
                  style={{ fontWeight: 'normal' }}
                >
                  <CategoryLinkButton
                    categoryName={plugin.spec.categories[0]}
                    to={withFilter('category', plugin.spec.categories[0])}
                    onClick={e => e.stopPropagation()}
                  />
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
            {plugin.metadata.description ?? t('common.noDescriptionAvailable')}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions
        sx={{
          pl: 2,
          pr: 2,
          pb: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link to={pluginPath} onClick={e => e.stopPropagation()}>
          {t('common.readMore')}
        </Link>
        {renderInstallStatus(plugin.spec?.installStatus)}
      </CardActions>
    </Card>
  );
};
