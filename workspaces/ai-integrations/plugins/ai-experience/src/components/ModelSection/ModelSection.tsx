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
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import CardWrapper from './CardWrapper';
import { AI_MODELS, AI_MODELS_DESCRIPTION } from '../../utils/constants';
import HomePageAiModels from '../../images/homepage-ai-models.svg';

export const ModelSection = () => {
  const [isRemoveFirstCard, setIsRemoveFirstCard] = React.useState(false);
  const [showDiscoveryCard, setShowDiscoveryCard] = React.useState(true);
  const [imgLoaded, setImgLoaded] = React.useState(false);

  const handleClose = () => {
    setShowDiscoveryCard(false);
    setTimeout(() => {
      setIsRemoveFirstCard(true);
    }, 500);
  };

  return (
    <React.Fragment>
      <Grid container>
        {!isRemoveFirstCard && (
          <Grid item xs={12} md={5} key="AI models illustration">
            <Box
              sx={{
                border: theme => `1px solid ${theme.palette.grey[400]}`,
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
                  width={266}
                  height={330}
                  sx={{ borderRadius: 3 }}
                />
              )}
              <Box
                component="img"
                src={HomePageAiModels}
                onLoad={() => setImgLoaded(true)}
                alt="AI models illustration"
                height={330}
              />
              <Box sx={{ p: 2 }}>
                <Box sx={{ width: '180px' }}>
                  <Typography variant="body2" paragraph>
                    {AI_MODELS_DESCRIPTION}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleClose}
                  aria-label="close"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <CloseIcon sx={{ width: '16px', height: '16px' }} />
                </IconButton>
              </Box>
            </Box>
          </Grid>
        )}
        {AI_MODELS.slice(0, isRemoveFirstCard ? 4 : 2).map(item => (
          <Grid item xs={12} md={isRemoveFirstCard ? 3 : 3.5} key={item.title}>
            <CardWrapper
              title={item.title}
              version={item.version}
              description={item.description}
              tags={item.tags}
            />
          </Grid>
        ))}
      </Grid>
      <Box sx={{ pt: 2 }}>
        <Link href="#" underline="always">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            View all {AI_MODELS.length} models
          </Typography>
        </Link>
      </Box>
    </React.Fragment>
  );
};
