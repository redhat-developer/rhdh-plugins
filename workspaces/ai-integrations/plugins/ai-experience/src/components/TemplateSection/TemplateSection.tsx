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
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import CardWrapper from './CardWrapper';
import { AI_TEMPLATES } from '../../utils/constants';

export const TemplateSection = () => {
  return (
    <React.Fragment>
      <Grid container>
        {AI_TEMPLATES.slice(0, 4).map(item => (
          <Grid item xs={12} md={3} key={item.title}>
            <CardWrapper
              title={item.title}
              description={item.description}
              tag={item.tag}
            />
          </Grid>
        ))}
      </Grid>
      <Box sx={{ pt: 2 }}>
        <Link href="#" underline="always">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            View all {AI_TEMPLATES.length} templates
          </Typography>
        </Link>
      </Box>
    </React.Fragment>
  );
};
