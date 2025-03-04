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
import React, { useContext, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Image from '../../assets/images/sandbox-banner-image.png';
import { Context } from './SandboxCatalogPage';

export const SandboxCatalogBanner: React.FC = () => {
  const theme = useTheme();
  const [buttonClicked] = useContext(Context);
  const [loaded, setLoaded] = React.useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = React.useState(0);

  useEffect(() => {
    if (buttonClicked) {
      setTrialDaysLeft(30);
      setLoaded(true);
    }
  }, [buttonClicked, setTrialDaysLeft]);

  return (
    <Card
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing(4),
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#0E1214',
      }}
    >
      <Grid container alignItems="center" spacing={4}>
        <Grid item xs={12} sm={12} md={2}>
          <Box>
            <img
              src={Image}
              alt="Red Hat Trial"
              style={{
                width: '100%',
                float: 'right',
                maxWidth: '207px',
                height: 'auto',
                display: 'block',
              }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={10}>
          <Box>
            {loaded ? (
              <>
                <Typography
                  variant="h1"
                  style={{ fontSize: '50px', fontWeight: 700 }}
                >
                  Welcome, Avik
                </Typography>
                <Typography
                  variant="inherit"
                  color="textPrimary"
                  style={{ fontSize: '25px', fontWeight: 400 }}
                >
                  Your free trial expires in {trialDaysLeft} days
                </Typography>
              </>
            ) : (
              <>
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
                  style={{
                    fontSize: '16px',
                    marginTop: '10px',
                    fontWeight: 400,
                  }}
                >
                  Click on "Try it" to initiate your free, no commitment 30-day
                  trial.
                </Typography>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};
