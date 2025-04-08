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

import CardWrapper from './CardWrapper';
import HomePageAiIllustration from '../../images/homepage-ai-illustration.svg';
import { LEARNING_SECTION_ITEMS } from '../../utils/constants';

export const LearnSection = () => {
  return (
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
          src={HomePageAiIllustration}
          alt="AI illustration"
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
          <CardWrapper
            title={item.title}
            description={item.description}
            buttonText={item.buttonText}
            buttonLink={item.buttonLink}
          />
        </Grid>
      ))}
    </Grid>
  );
};
