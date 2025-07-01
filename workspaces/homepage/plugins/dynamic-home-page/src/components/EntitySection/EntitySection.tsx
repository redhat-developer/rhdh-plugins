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

import { Layouts, Responsive, WidthProvider } from 'react-grid-layout';

import EntityCard from './EntityCard';
import { ViewMoreLink } from './ViewMoreLink';
import HomePageEntityIllustration from '../../images/homepage-entities-1.svg';
import { useEntities } from '../../hooks/useEntities';
import {
  addDismissedEntityIllustrationUsers,
  hasEntityIllustrationUserDismissed,
} from '../../utils/utils';
import { CARD_BREAKPOINTS, CARD_COLUMNS } from '../../utils/constants';

const StyledLink = styled(BackstageLink)(({ theme }) => ({
  textDecoration: 'none',
  padding: theme.spacing(1, 1.5),
  fontSize: '16px',
  display: 'inline-flex',
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: 4,
}));

// eslint-disable-next-line new-cap
const ResponsiveGridLayout = WidthProvider(Responsive);

export const EntitySection = () => {
  const theme = useTheme();
  const { displayName, loading: profileLoading } = useUserProfile();
  const [isRemoveFirstCard, setIsRemoveFirstCard] = useState(false);
  const [showDiscoveryCard, setShowDiscoveryCard] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [breakPoint, setBreakPoint] = useState('xl');

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
    const handleBreakpointChange = (newBreakpoint: string) => {
      setBreakPoint(newBreakpoint);
    };

    const layouts: Layouts = {};

    Object.keys(CARD_BREAKPOINTS).forEach(breakpoint => {
      const layout = [];

      // Add illustration card if needed
      if (!isRemoveFirstCard && !profileLoading) {
        let width;

        if (breakpoint === 'sm') {
          width = 6;
        } else if (breakpoint === 'xs' || breakpoint === 'xxs') {
          width = 12;
        } else {
          width = 5;
        }
        layout.push({
          i: 'entities-illustration',
          x: 0,
          y: 0,
          w: width,
          h: 2,
        });
      }

      // Add entity cards
      // eslint-disable-next-line no-nested-ternary
      entities
        ?.slice(
          0,
          isRemoveFirstCard
            ? 4
            : breakPoint === 'sm' || breakPoint === 'xs' || breakPoint === 'xxs'
              ? 3
              : 2,
        )
        .forEach((_item, index) => {
          let xPosition;
          let yPosition;
          let width;

          if (breakPoint === 'sm') {
            if (isRemoveFirstCard) {
              xPosition = (index % 2) * 6;
              yPosition = Math.floor(index / 2);
            } else {
              xPosition = ((index + 1) % 2) * 6;
              yPosition = Math.floor((index + 1) / 2);
            }
            width = 6;
          } else if (breakPoint === 'xs' || breakPoint === 'xxs') {
            xPosition = 0;
            yPosition = index;
            width = 12;
          } else {
            if (isRemoveFirstCard) {
              xPosition = index * 3;
              width = 3;
            } else {
              if (index === 0) {
                xPosition = 5;
              } else {
                xPosition = 8.5;
              }
              width = 3.5;
            }
            yPosition = 0;
          }

          layout.push({
            i: `entity-${index}`,
            x: xPosition,
            y: yPosition,
            w: width,
            h: 2,
          });
        });

      // Empty state
      if (entities?.length === 0) {
        layout.push({
          i: 'empty',
          x: 5,
          y: 0,
          w: isRemoveFirstCard ? 12 : 7,
          h: 2,
        });
      }

      layouts[breakpoint] = layout;
    });

    content = (
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={CARD_BREAKPOINTS}
        cols={CARD_COLUMNS}
        containerPadding={[16, 16]}
        margin={[10, 10]}
        onBreakpointChange={handleBreakpointChange}
        isResizable={false}
        isDraggable={false}
      >
        {!isRemoveFirstCard && !profileLoading && (
          <div key="entities-illustration">
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
                  style={{
                    borderRadius: 3,
                    width: 'clamp(140px, 14vw, 266px)',
                  }}
                />
              )}
              <Box
                component="img"
                src={HomePageEntityIllustration}
                onLoad={() => setImgLoaded(true)}
                alt=""
                height={300}
                sx={{ width: 'clamp(140px, 14vw, 266px)' }}
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
                    style={{ position: 'absolute', top: '8px', right: '8px' }}
                  >
                    <CloseIcon style={{ width: '16px', height: '16px' }} />
                  </IconButton>
                )}
              </Box>
            </Card>
          </div>
        )}

        {(() => {
          let entityCardCount = 2;
          if (isRemoveFirstCard) {
            entityCardCount = 4;
          } else if (['sm', 'xs', 'xxs'].includes(breakPoint)) {
            entityCardCount = 3;
          }

          return entities
            ?.slice(0, entityCardCount)
            .map((item: any, index: number) => (
              <div key={`entity-${index}`}>
                <EntityCard
                  entity={item}
                  title={item.spec?.profile?.displayName ?? item.metadata.name}
                  version="latest"
                  description={item.metadata.description ?? ''}
                  tags={item.metadata?.tags ?? []}
                  kind={item.kind}
                />
              </div>
            ));
        })()}

        {entities?.length === 0 && (
          <div key="empty">
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
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    mt: '20px',
                    mb: '16px',
                  }}
                >
                  Once software catalogs are added, this space will showcase
                  relevant content tailored to your experience.
                </Typography>
                <StyledLink to="/catalog-import" underline="none">
                  Register a component
                </StyledLink>
              </CardContent>
            </Box>
          </div>
        )}
      </ResponsiveGridLayout>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        padding: '24px',
        border: muitheme => `1px solid ${muitheme.palette.grey[300]}`,
        overflow: 'auto',
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
            View all {data?.totalItems ? data?.totalItems : ''} catalog entities
          </ViewMoreLink>
        </Box>
      )}
    </Card>
  );
};
