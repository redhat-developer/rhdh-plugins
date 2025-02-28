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

import { useTheme, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import FilterListIcon from '@mui/icons-material/FilterList';

/**
 * This is a local copy of https://github.com/backstage/backstage/blob/master/plugins/catalog-react/src/components/CatalogFilterLayout/CatalogFilterLayout.tsx
 */
export const FilterLayout = (props: { children: React.ReactNode }) => {
  return <Grid container>{props.children}</Grid>;
};

const Filter = (props: { children: React.ReactNode }) => {
  const theme = useTheme();
  const isScreenSmallerThanBreakpoint = useMediaQuery((t: Theme) =>
    t.breakpoints.down('lg'),
  );
  const [isDrawerOpen, setDrawerOpen] = React.useState<boolean>(false);

  if (isScreenSmallerThanBreakpoint) {
    return (
      <>
        <Button
          style={{ marginTop: theme.spacing(1), marginLeft: theme.spacing(1) }}
          onClick={() => setDrawerOpen(true)}
          startIcon={<FilterListIcon />}
        >
          Filters
        </Button>
        <Drawer
          open={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          anchor="left"
          disableAutoFocus
          keepMounted
          variant="temporary"
        >
          <Box m={2}>
            <Typography
              variant="h6"
              component="h2"
              style={{ marginBottom: theme.spacing(1) }}
            >
              Filters
            </Typography>
            {props.children}
          </Box>
        </Drawer>
      </>
    );
  }

  return (
    <Grid item lg={2}>
      {props.children}
    </Grid>
  );
};

const Content = (props: { children: React.ReactNode }) => {
  return (
    <Grid item xs={12} lg={10}>
      {props.children}
    </Grid>
  );
};

FilterLayout.Filter = Filter;
FilterLayout.Content = Content;
