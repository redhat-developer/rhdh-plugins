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

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import CardWrapper from './CardWrapper';
import HomePageAiModels from '../../images/homepage-ai-models.svg';
import { useModels } from '../../hooks/useModels';
import { ViewMoreLink } from '../Links/ViewMoreLink';
import { useTranslation } from '../../hooks/useTranslation';

export const ModelSection = () => {
  const [isRemoveFirstCard, setIsRemoveFirstCard] = React.useState(false);
  const [showDiscoveryCard, setShowDiscoveryCard] = React.useState(true);
  const [imgLoaded, setImgLoaded] = React.useState(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down(1280));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down(900));
  const smallScreenWidth = isExtraSmallScreen ? 266 : 180;
  const imageWidth = isSmallScreen ? smallScreenWidth : 266;
  const { t } = useTranslation();

  const handleClose = () => {
    setShowDiscoveryCard(false);
    setTimeout(() => {
      setIsRemoveFirstCard(true);
    }, 500);
  };
  const { data } = useModels();
  const models = data?.items;
  const params = new URLSearchParams({
    'filters[kind]': 'resource',
    'filters[type]': 'ai-model',
    limit: '20',
  });
  const catalogModelLink = `/catalog?${params.toString()}`;

  return (
    <React.Fragment>
      <Grid container spacing={1} alignItems="stretch">
        {!isRemoveFirstCard && (
          <Grid
            item
            xs={12}
            md={5}
            key={t('accessibility.aiModelsIllustration')}
          >
            <Box
              sx={{
                border: `1px solid ${theme.palette.grey[400]}`,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                transition: 'opacity 0.5s ease-out, transform 0.5s ease-in-out',
                opacity: showDiscoveryCard ? 1 : 0,
                transform: showDiscoveryCard
                  ? 'translateX(0)'
                  : 'translateX(-50px)',
              }}
            >
              {!imgLoaded && (
                <Skeleton
                  variant="rectangular"
                  width={imageWidth}
                  height={300}
                  sx={{ borderRadius: 3 }}
                />
              )}
              <Box
                component="img"
                src={HomePageAiModels}
                onLoad={() => setImgLoaded(true)}
                alt={t('accessibility.aiModelsIllustration')}
                height={300}
                width={imageWidth}
              />
              <Box sx={{ p: 2 }}>
                <Box>
                  <Typography variant="body2" paragraph>
                    {t('sections.discoverModels')}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleClose}
                  aria-label={t('accessibility.close')}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <CloseIcon sx={{ width: '16px', height: '16px' }} />
                </IconButton>
              </Box>
            </Box>
          </Grid>
        )}
        {models?.slice(0, isRemoveFirstCard ? 4 : 2).map(item => (
          <Grid
            item
            xs={12}
            md={isRemoveFirstCard ? 3 : 3.5}
            key={item.metadata.name}
          >
            <CardWrapper
              link={`/catalog/default/resource/${item.metadata.name}`}
              title={item.spec?.profile?.displayName ?? item.metadata.name}
              version={t('common.latest')}
              description={item.metadata.description ?? ''}
              tags={item.metadata?.tags ?? []}
            />
          </Grid>
        ))}
      </Grid>
      <Box sx={{ pt: 2 }}>
        <ViewMoreLink to={catalogModelLink}>
          {t('sections.viewAllModels' as any, {
            count: data?.totalItems ? data?.totalItems.toString() : '',
          })}
        </ViewMoreLink>
      </Box>
    </React.Fragment>
  );
};
