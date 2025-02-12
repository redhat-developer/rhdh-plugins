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
import { Box, Typography, Card, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Image from '../../assets/images/sandbox-banner-image.png';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(4),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
  },
  image: {
    width: '100%',
    float: 'right',
    maxWidth: '207px',
    height: 'auto',
    display: 'block',
  },
}));

export const SandboxCatalogBanner: React.FC = () => {
  const classes = useStyles();

  return (
    <Card className={classes.root} elevation={0}>
      <Grid container alignItems="center" spacing={4}>
        <Grid item xs={12} sm={12} md={2}>
          <Box>
            <img src={Image} alt="Red Hat Trial" className={classes.image} />
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={10}>
          <Box>
            <Typography
              variant="h1"
              style={{ fontSize: '50px', fontWeight: 700 }}
            >
              Try Red Hat products
            </Typography>
            <Typography
              variant="inherit"
              color="textPrimary"
              style={{ fontSize: '25px', fontWeight: 400 }}
            >
              Explore, experiment, and see what's possible
            </Typography>
            <Typography
              color="textPrimary"
              style={{ fontSize: '16px', marginTop: '10px' }}
            >
              Click on "Try it" to initiate your free, no commitment 30-day
              trial.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};
