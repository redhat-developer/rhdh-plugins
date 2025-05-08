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
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import { Theme } from '@mui/material/styles';
import { makeStyles, useTheme } from '@material-ui/core';

import TemplateCard from './TemplateCard';
import { useTemplates } from '../../hooks/useTemplates';
import { ViewMoreLink } from './ViewMoreLink';

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

export const TemplateSection = () => {
  const theme = useTheme();
  const classes = getStyles(theme);

  const { data: templates, error, isLoading } = useTemplates();

  const params = new URLSearchParams({
    'filters[kind]': 'template',
    limit: '20',
  });
  const catalogTemplatesLink = `/catalog?${params.toString()}`;

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <div className={classes.center}>
        <CircularProgress />
      </div>
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
      <Box sx={{ padding: '20px 10px 10px 0' }}>
        <React.Fragment>
          <Grid container spacing={1} alignItems="stretch">
            {templates?.items.map((item: any) => (
              <Grid item xs={12} md={3} key={item.title}>
                <TemplateCard
                  link={`/create/templates/default/${item.metadata.name}`}
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
                    <div className={classes.title}>No templates added yet</div>
                    <div className={classes.description}>
                      Once templates are added, this space will showcase
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
                          Register a template
                        </div>
                      </Link>
                    </Box>
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
    <Box
      component={Paper}
      sx={{
        padding: '24px 24px 0 24px',
        border: muiTheme => `1px solid ${muiTheme.palette.grey[300]}`,
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
        Explore Templates
      </div>
      {content}
    </Box>
  );
};
