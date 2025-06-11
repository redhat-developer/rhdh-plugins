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

import {
  CodeSnippet,
  WarningPanel,
  Link as BackstageLink,
} from '@backstage/core-components';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import TemplateCard from './TemplateCard';
import { useEntities } from '../../hooks/useEntities';
import { ViewMoreLink } from './ViewMoreLink';

const StyledLink = styled(BackstageLink)(({ theme }) => ({
  textDecoration: 'none',
  padding: theme.spacing(1, 1.5),
  fontSize: '16px',
  display: 'inline-flex',
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: 4,
}));

export const TemplateSection = () => {
  const {
    data: templates,
    error,
    isLoading,
  } = useEntities({ kind: 'Template' });

  const params = new URLSearchParams({
    'filters[kind]': 'template',
    limit: '20',
  });
  const catalogTemplatesLink = `/catalog?${params.toString()}`;

  let content: React.ReactNode;

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
  } else if (!templates) {
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
      <Box sx={{ padding: '8px 8px 8px 0' }}>
        <React.Fragment>
          <Grid container spacing={1} alignItems="stretch">
            {templates?.items.map((item: any) => (
              <Grid item xs={12} md={3} key={item.title}>
                <TemplateCard
                  link={`/create/templates/${item.metadata.namespace}/${item.metadata.name}`}
                  title={item.metadata.title}
                  description={item.metadata.description}
                  kind="Template"
                />
              </Grid>
            ))}
            {templates?.items.length === 0 && (
              <Grid item xs={12} md={12}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: muiTheme =>
                      `1px solid ${muiTheme.palette.grey[400]}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <CardContent
                    sx={{
                      margin: '1rem',
                    }}
                  >
                    <Typography sx={{ fontSize: '1.125rem', fontWeight: 500 }}>
                      No templates added yet
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        mt: '20px',
                        mb: '16px',
                      }}
                    >
                      Once templates are added, this space will showcase
                      relevant content tailored to your experience.
                    </Typography>
                    <StyledLink to="/catalog-import" underline="none">
                      Register a template
                    </StyledLink>
                  </CardContent>
                </Box>
              </Grid>
            )}
          </Grid>
          <Box sx={{ pt: 2 }}>
            {templates?.items.length > 0 && (
              <ViewMoreLink to={catalogTemplatesLink} underline="always">
                View all {templates?.totalItems ? templates?.totalItems : ''}{' '}
                templates
              </ViewMoreLink>
            )}
          </Box>
        </React.Fragment>
      </Box>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        padding: '24px',
        border: muiTheme => `1px solid ${muiTheme.palette.grey[300]}`,
        overflow: 'auto',
        '$::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none',
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
        Explore Templates
      </Typography>
      {content}
    </Card>
  );
};
