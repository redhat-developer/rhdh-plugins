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

import { useState, useEffect, Fragment } from 'react';

import {
  CodeSnippet,
  WarningPanel,
  Link as BackstageLink,
} from '@backstage/core-components';
import { useUserProfile } from '@backstage/plugin-user-settings';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import { useTheme, styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import EntityCard from './EntityCard';
import { ViewMoreLink } from './ViewMoreLink';
import HomePageEntityIllustration from '../../images/homepage-entities-1.svg';
import { useEntities } from '../../hooks/useEntities';
import {
  addDismissedEntityIllustrationUsers,
  hasEntityIllustrationUserDismissed,
} from '../../utils/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { Trans } from '../Trans';

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
  const { t } = useTranslation();
  const { displayName, loading: profileLoading } = useUserProfile();
  const [isRemoveFirstCard, setIsRemoveFirstCard] = useState(false);
  const [showDiscoveryCard, setShowDiscoveryCard] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isMediumBreakpoint, setIsMediumBreakpoint] = useState(false);

  const isMd = useMediaQuery(theme.breakpoints.only('md'));

  useEffect(() => {
    if (isMd) {
      setIsMediumBreakpoint(true);
    } else {
      setIsMediumBreakpoint(false);
    }
  }, [isMd]);

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
      <WarningPanel severity="error" title={t('entities.fetchError')}>
        <CodeSnippet
          language="text"
          text={error?.toString() ?? t('entities.error')}
        />
      </WarningPanel>
    );
  } else {
    let entityCardCount = 2;
    if (isMediumBreakpoint) entityCardCount = 3;

    content = (
      <Box sx={{ padding: '8px 8px 8px 0' }}>
        <Fragment>
          <Grid container spacing={1} alignItems="stretch">
            {!isRemoveFirstCard && !profileLoading && (
              <Grid item xs={12} md={6} lg={5} key="entities illustration">
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.grey[400]}`,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'relative',
                    transition:
                      'opacity 0.5s ease-out, transform 0.5s ease-in-out',
                    opacity: showDiscoveryCard ? 1 : 0,
                    transform: showDiscoveryCard
                      ? 'translateX(0)'
                      : 'translateX(-50px)',
                  }}
                >
                  {!imgLoaded && (
                    <Skeleton
                      variant="rectangular"
                      height={300}
                      sx={{
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
                    sx={{
                      width: 'clamp(140px, 14vw, 266px)',
                    }}
                  />
                  <Box sx={{ p: 2 }}>
                    <Box>
                      <Typography variant="body2" paragraph>
                        {t('entities.description')}
                      </Typography>
                    </Box>
                    {entities?.length > 0 && (
                      <IconButton
                        onClick={handleClose}
                        aria-label={t('entities.close')}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                        }}
                      >
                        <CloseIcon style={{ width: '16px', height: '16px' }} />
                      </IconButton>
                    )}
                  </Box>
                </Card>
              </Grid>
            )}
            {entities
              ?.slice(0, isRemoveFirstCard ? 4 : entityCardCount)
              .map((item: any) => (
                <Grid
                  item
                  xs={12}
                  md={6}
                  lg={isRemoveFirstCard ? 3 : 3.5}
                  key={item.metadata.name}
                >
                  <EntityCard
                    entity={item}
                    title={item.metadata.title ?? item.metadata.name}
                    version="latest"
                    description={item.metadata.description ?? ''}
                    tags={item.metadata?.tags ?? []}
                    kind={item.kind}
                  />
                </Grid>
              ))}
            {entities?.length === 0 && (
              <Grid item md={isRemoveFirstCard ? 12 : 7}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 300,
                    border: muiTheme =>
                      `1px solid ${muiTheme.palette.grey[400]}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <CardContent>
                    <Typography sx={{ fontSize: '1.125rem', fontWeight: 500 }}>
                      {t('entities.empty')}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        mt: '20px',
                        mb: '16px',
                      }}
                    >
                      {t('entities.emptyDescription')}
                    </Typography>
                    <StyledLink to="/catalog-import" underline="none">
                      {t('entities.register')}
                    </StyledLink>
                  </CardContent>
                </Box>
              </Grid>
            )}
          </Grid>
        </Fragment>
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
        {t('entities.title')}
      </Typography>
      {content}
      {entities?.length > 0 && (
        <Box sx={{ pt: 2 }}>
          <ViewMoreLink to="/catalog">
            <Trans
              message="entities.viewAll"
              params={{ count: data?.totalItems?.toString() || '' }}
            />
          </ViewMoreLink>
        </Box>
      )}
    </Card>
  );
};
