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

import { useUserProfile } from '@backstage/plugin-user-settings';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';

import OnboardingCard from './OnboardingCard';
import HomePageIllustration from '../../images/homepage-illustration-1.svg';
import { LEARNING_SECTION_ITEMS } from '../../utils/constants';
import useGreeting from '../../hooks/useGreeting';

export const OnboardingSection = () => {
  const greeting = useGreeting();
  const { displayName } = useUserProfile();

  const fullName = displayName ?? '';
  const firstName = fullName.split(' ')[0];

  const content = (
    <Box>
      <Grid container margin="auto">
        <Grid
          item
          xs={12}
          md={6}
          lg={3}
          display="flex"
          justifyContent="left"
          alignItems="center"
        >
          <Box
            component="img"
            src={HomePageIllustration}
            alt="Homepage illustration"
            sx={{
              width: 'clamp(200px, 20vw, 280px)',
            }}
          />
        </Grid>
        {LEARNING_SECTION_ITEMS.map(item => (
          <Grid
            item
            xs={12}
            md={6}
            lg={3}
            key={item.title}
            display="flex"
            justifyContent="left"
            alignItems="center"
          >
            <OnboardingCard
              title={item.title}
              description={item.description}
              buttonText={item.buttonText}
              buttonLink={item.buttonLink}
              target={item.target}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Card
      elevation={0}
      sx={{
        padding: '24px',
        border: muiTheme => `1px solid ${muiTheme.palette.grey[300]}`,
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
        {`${greeting} ${firstName ?? 'Guest'}!`}
      </Typography>
      {content}
    </Card>
  );
};
