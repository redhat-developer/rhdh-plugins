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
import type { ReactNode } from 'react';

import { useState, useEffect } from 'react';

import {
  CodeSnippet,
  WarningPanel,
  Link as BackstageLink,
} from '@backstage/core-components';
import { useUserProfile } from '@backstage/plugin-user-settings';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import { useTheme, styled } from '@mui/material/styles';
import useResizeObserver from 'use-resize-observer';

import EntityCard from './EntityCard';
import { ViewMoreLink } from './ViewMoreLink';
import HomePageEntityIllustration from '../../images/homepage-entities-1.svg';
import { useEntities } from '../../hooks/useEntities';
import {
  addDismissedEntityIllustrationUsers,
  hasEntityIllustrationUserDismissed,
} from '../../utils/utils';

const StyledLink = styled(BackstageLink)(({ theme }) => ({
  textDecoration: 'none',
  padding: theme.spacing(1, 1.5),
  fontSize: '16px',
  display: 'inline-flex',
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: 4,
}));

export const EntitySection = () => {
  const theme = useTheme();
  const { displayName, loading: profileLoading } = useUserProfile();
  const [isRemoveFirstCard, setIsRemoveFirstCard] = useState(false);
  const [showDiscoveryCard, setShowDiscoveryCard] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);

  const [imgCardWidth, setImgCardWidth] = useState('100%');
  const [cardWidth, setCardWidth] = useState('100%');

  const { ref, width = 1 } = useResizeObserver();
  const gap = 16;

  useEffect(() => {
    if (width >= 900 && !isRemoveFirstCard && !profileLoading) {
      setImgCardWidth(`calc(42%)`);
      setCardWidth(`calc((56% - ${gap}px) / 2)`);
    } else if (width >= 900) {
      setCardWidth(`calc((100% - ${gap * 3}px) / 4)`);
    } else if (width > 600) {
      setImgCardWidth(`calc((100% - ${gap * 2}px) / 2)`);
      setCardWidth(`calc((100% - ${gap * 2}px) / 2)`);
    } else if (width <= 600) {
      setImgCardWidth(`calc(100%)`);
      setCardWidth(`calc((100%))`);
    }
  }, [profileLoading, isRemoveFirstCard, width, gap]);

  useEffect(() => {
    const isUserDismissedEntityIllustration =
      hasEntityIllustrationUserDismissed(displayName);
    setIsRemoveFirstCard(isUserDismissedEntityIllustration);
  }, [displayName]);

  const handleClose = () => {
    setShowDiscoveryCard(false);
    setTimeout(() => {
      addDismissedEntityIllustrationUsers(displayName);
      setIsRemoveFirstCard(true);
    }, 500);
  };

  const { data, error, isLoading } = useEntities({
    kind: ['Component', 'API', 'Resource', 'System'],
  });

  const entities = data?.items ?? [];

  let content: ReactNode;

  if (isLoading) {
    content = (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  } else if (!data) {
    content = (
      <WarningPanel severity="error" title="Could not fetch data.">
        <CodeSnippet
          language="text"
          text={error?.toString() ?? 'Unknown error'}
        />
      </WarningPanel>
    );
  } else {
    content = (
      <Box
        ref={ref}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${gap}px`,
          justifyContent: 'space-between',
          pt: 2,
        }}
      >
        {!isRemoveFirstCard && !profileLoading && (
          <Box
            sx={{
              flex: `0 0 ${imgCardWidth}`,
              minWidth: 0,
            }}
          >
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.grey[400]}`,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                position: 'relative',
                opacity: showDiscoveryCard ? 1 : 0,
                transform: showDiscoveryCard
                  ? 'translateX(0)'
                  : 'translateX(-50px)',
                transition: 'opacity 0.5s ease-out, transform 0.5s ease-in-out',
              }}
            >
              {!imgLoaded && (
                <Skeleton
                  variant="rectangular"
                  height={300}
                  sx={{ borderRadius: 3, width: 'clamp(46%, 46%, 80%)' }}
                />
              )}
              <Box
                component="img"
                src={HomePageEntityIllustration}
                onLoad={() => setImgLoaded(true)}
                alt=""
                height={300}
                sx={{ width: 'clamp(46%, 46%, 80%)' }}
              />
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" paragraph>
                  Browse the Systems, Components, Resources, and APIs that are
                  available in your organization.
                </Typography>
                {entities?.length > 0 && (
                  <IconButton
                    onClick={handleClose}
                    aria-label="close"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    <CloseIcon sx={{ width: 16, height: 16 }} />
                  </IconButton>
                )}
              </Box>
            </Card>
          </Box>
        )}

        {entities?.slice(0, isRemoveFirstCard ? 4 : 2).map((item: any) => (
          <Box
            key={item.metadata.name}
            sx={{
              flex: `0 0 ${cardWidth}`,
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <EntityCard
              entity={item}
              title={item.spec?.profile?.displayName ?? item.metadata.name}
              version="latest"
              description={item.metadata.description ?? ''}
              tags={item.metadata?.tags ?? []}
              kind={item.kind}
            />
          </Box>
        ))}

        {entities?.length === 0 && (
          <Box sx={{ flex: `1 1 ${cardWidth}` }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 300,
                border: muiTheme => `1px solid ${muiTheme.palette.grey[400]}`,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <CardContent>
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 500 }}>
                  No software catalog added yet
                </Typography>
                <Typography
                  sx={{ fontSize: '0.875rem', fontWeight: 400, mt: 2, mb: 2 }}
                >
                  Once software catalogs are added, this space will showcase
                  relevant content tailored to your experience.
                </Typography>
                <StyledLink to="/catalog-import" underline="none">
                  Register a component
                </StyledLink>
              </CardContent>
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        padding: '24px',
        border: muitheme => `1px solid ${muitheme.palette.grey[300]}`,
        overflow: 'auto',
        '$::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none',
      }}
    >
      <Typography
        variant="h3"
        sx={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: '500',
          fontSize: '1.5rem',
        }}
      >
        Explore Your Software Catalog
      </Typography>
      {content}
      {entities?.length > 0 && (
        <Box sx={{ pt: 2 }}>
          <ViewMoreLink to="/catalog">
            View all {data?.totalItems ?? ''} catalog entities
          </ViewMoreLink>
        </Box>
      )}
    </Card>
  );
};
