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

import { CodeSnippet, WarningPanel, Link } from '@backstage/core-components';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@material-ui/core/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Theme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import { makeStyles, useTheme } from '@material-ui/core';

import EntityCard from './EntityCard';
import { ViewMoreLink } from './ViewMoreLink';
import HomePageEntityIllustration from '../../images/homepage-entities-1.svg';
import { useEntities } from '../../hooks/useEntities';

const getStyles = makeStyles((theme: Theme) => ({
  center: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    textTransform: 'none',
    padding: theme.spacing(1, 1.5),
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '16px',
    border: `1px solid ${
      theme.palette.mode === 'light' ? '#0066CC' : '#1FA7F8'
    }`,
    borderRadius: '3px',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 500,
  },
  description: {
    fontSize: '0.875rem',
    fontWeight: 400,
    marginTop: '20px',
    marginBottom: '16px',
  },
}));

export const EntitySection = () => {
  const theme = useTheme();
  const classes = getStyles(theme);
  const [isRemoveFirstCard, setIsRemoveFirstCard] = React.useState(false);
  const [showDiscoveryCard, setShowDiscoveryCard] = React.useState(true);
  const [imgLoaded, setImgLoaded] = React.useState(false);

  const isSmallScreen = useMediaQuery(theme.breakpoints.down(1280));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down(900));
  const smallScreenWidth = isExtraSmallScreen ? 266 : 180;
  const imageWidth = isSmallScreen ? smallScreenWidth : 266;

  const handleClose = () => {
    setShowDiscoveryCard(false);
    setTimeout(() => {
      setIsRemoveFirstCard(true);
    }, 500);
  };

  const { data, error, isLoading } = useEntities();
  const entities = data?.items ?? [];

  const params = new URLSearchParams({
    limit: '20',
  });
  const catalogEntityLink = `/catalog?${params.toString()}`;

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <div className={classes.center}>
        <CircularProgress />
      </div>
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
      <Box sx={{ padding: '20px 10px 10px 0' }}>
        <React.Fragment>
          <Grid container spacing={1} alignItems="stretch">
            {!isRemoveFirstCard && (
              <Grid item xs={12} md={5} key="entities illustration">
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.grey[400]}`,
                    borderRadius: 3,
                    display: 'flex',
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
                      width={imageWidth}
                      height={300}
                      sx={{ borderRadius: 3 }}
                    />
                  )}
                  <Box
                    component="img"
                    src={HomePageEntityIllustration}
                    onLoad={() => setImgLoaded(true)}
                    alt="entities illustration"
                    height={300}
                    width={imageWidth}
                  />
                  <Box sx={{ p: 2 }}>
                    <Box>
                      <Typography variant="body2" paragraph>
                        Browse the Systems, Components, Resources, and APIs that
                        are available in your organization.
                      </Typography>
                    </Box>
                    {entities?.length > 0 && (
                      <IconButton
                        onClick={handleClose}
                        aria-label="close"
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
                </Box>
              </Grid>
            )}
            {entities?.slice(0, isRemoveFirstCard ? 4 : 2).map((item: any) => (
              <Grid
                item
                xs={12}
                md={isRemoveFirstCard ? 3 : 3.5}
                key={item.metadata.name}
              >
                <EntityCard
                  link={`/catalog/default/${item.kind.toLocaleLowerCase('en-US')}/${item.metadata.name}`}
                  title={item.spec?.profile?.displayName ?? item.metadata.name}
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
                    <div className={classes.title}>
                      No software catalog added yet
                    </div>
                    <div className={classes.description}>
                      Once software catalogs are added, this space will showcase
                      relevant content tailored to your experience.
                    </div>
                    <Box>
                      <Link
                        to="/catalog-import"
                        underline="none"
                        className={classes.link}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          Register a component
                        </div>
                      </Link>
                    </Box>
                  </CardContent>
                </Box>
              </Grid>
            )}
          </Grid>
          <Box sx={{ pt: 2 }}>
            {entities?.length > 0 && (
              <ViewMoreLink to={catalogEntityLink}>
                View all {data?.totalItems ? data?.totalItems : ''} catalog
                entities
              </ViewMoreLink>
            )}
          </Box>
        </React.Fragment>
      </Box>
    );
  }

  return (
    <Box
      component={Paper}
      sx={{
        padding: '24px 24px 0 24px',
        border: muitheme => `1px solid ${muitheme.palette.grey[300]}`,
        borderRadius: 3,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '1.5rem',
          fontWeight: '500',
        }}
      >
        Explore Your Software Catalog
      </div>
      {content}
    </Box>
  );
};
