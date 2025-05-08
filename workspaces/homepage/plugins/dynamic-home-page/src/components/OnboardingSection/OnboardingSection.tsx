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

import { identityApiRef, useApi } from '@backstage/core-plugin-api';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import useAsync from 'react-use/lib/useAsync';

import OnboardingCard from './OnboardingCard';
import HomePageIllustration from '../../images/homepage-illustration-1.svg';
import { LEARNING_SECTION_ITEMS } from '../../utils/constants';
import useGreeting from '../../hooks/useGreeting';

export const OnboardingSection = () => {
  const greeting = useGreeting();
  const identityApi = useApi(identityApiRef);

  const { value: profile } = useAsync(() => identityApi.getProfileInfo());
  const fullName = profile?.displayName ?? '';
  const firstName = fullName.split(' ')[0];

  return (
    <Box
      component={Paper}
      sx={{
        padding: '24px 24px 0 24px',
        border: theme => `1px solid ${theme.palette.grey[300]}`,
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
        {`${greeting} ${firstName ?? 'Guest'}!`}
      </div>
      <Box sx={{ padding: '20px 10px 30px 40px' }}>
        <Grid container spacing={3}>
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
    </Box>
  );
};
