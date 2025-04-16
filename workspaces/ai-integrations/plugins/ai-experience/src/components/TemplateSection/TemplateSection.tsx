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
import { useTemplates } from '../../hooks/useTemplates';
import { ViewMoreLink } from '../Links/ViewMoreLink';

export const TemplateSection = () => {
  const { data: templates } = useTemplates();
  const params = new URLSearchParams({
    'filters[kind]': 'template',
    limit: '20',
  });
  const catalogTemplatesLink = `/catalog?${params.toString()}`;

  return (
    <React.Fragment>
      <Grid container spacing={1} alignItems="stretch">
        {templates?.items.map(item => (
          <Grid item xs={12} md={3} key={item.title}>
            <CardWrapper
              link={`/create/templates/default/${item.metadata.name}`}
              title={item.metadata.title}
              description={item.metadata.description}
              kind="Template"
            />
          </Grid>
        ))}
      </Grid>
      <Box sx={{ pt: 2 }}>
        <ViewMoreLink to={catalogTemplatesLink} underline="always">
          View all {templates?.totalItems ? templates?.totalItems : ''}{' '}
          templates
        </ViewMoreLink>
      </Box>
    </React.Fragment>
  );
};
