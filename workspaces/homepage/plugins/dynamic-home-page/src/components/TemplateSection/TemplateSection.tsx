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
import type { ReactNode } from 'react';

import { Fragment } from 'react';

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
import { useTranslation } from '../../hooks/useTranslation';
import { Trans } from '../Trans';

const StyledLink = styled(BackstageLink)(({ theme }) => ({
  textDecoration: 'none',
  padding: theme.spacing(1, 1.5),
  fontSize: '16px',
  display: 'inline-flex',
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: 4,
}));

export const TemplateSection = () => {
  const { t } = useTranslation();
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

  let content: ReactNode;

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
      <WarningPanel severity="error" title={t('templates.fetchError')}>
        <CodeSnippet
          language="text"
          text={error?.toString() ?? t('templates.error')}
        />
      </WarningPanel>
    );
  } else {
    content = (
      <Box sx={{ padding: '8px 8px 8px 0' }}>
        <Fragment>
          <Grid container spacing={1} alignItems="stretch">
            {templates?.items.map((item: any) => (
              <Grid item xs={12} md={6} lg={3} key={item.title}>
                <TemplateCard
                  link={`/create/templates/${item.metadata.namespace}/${item.metadata.name}`}
                  title={item.metadata.title}
                  description={item.metadata.description}
                  kind={item.kind}
                  type={item.spec.type}
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
                      {t('templates.empty')}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        mt: '20px',
                        mb: '16px',
                      }}
                    >
                      {t('templates.emptyDescription')}
                    </Typography>
                    <StyledLink to="/catalog-import" underline="none">
                      {t('templates.register')}
                    </StyledLink>
                  </CardContent>
                </Box>
              </Grid>
            )}
          </Grid>
        </Fragment>
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
        {t('templates.title')}
      </Typography>
      {content}
      {templates?.items && templates?.items.length > 0 && (
        <Box sx={{ pt: 2 }}>
          <ViewMoreLink to={catalogTemplatesLink} underline="always">
            <Trans
              message="templates.viewAll"
              params={{ count: templates?.totalItems?.toString() || '' }}
            />
          </ViewMoreLink>
        </Box>
      )}
    </Card>
  );
};
