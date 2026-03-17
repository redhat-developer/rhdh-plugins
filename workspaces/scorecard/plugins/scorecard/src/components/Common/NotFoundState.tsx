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

import { useApi, configApiRef } from '@backstage/core-plugin-api';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import notFoundSvg from '../../images/not-found.svg';
import { useTranslation } from '../../hooks/useTranslation';

export interface NotFoundStateProps {
  title?: string;
  description?: string;
  readMoreHref?: string;
  showGoBack?: boolean;
  showContactSupport?: boolean;
}

const NotFoundState: React.FC<NotFoundStateProps> = ({
  title,
  description,
  readMoreHref = 'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest',
  showGoBack = true,
  showContactSupport = true,
}) => {
  const { t } = useTranslation();
  const configApi = useApi(configApiRef);
  const supportUrl =
    configApi.getOptionalString('app.support.url') ??
    'https://access.redhat.com/documentation/red_hat_developer_hub';

  const displayTitle = title ?? t('notFound.title');
  const displayDescription =
    description ??
    t('notFound.description' as any, {
      indexFile: (
        <Typography
          component="span"
          sx={theme => ({
            fontWeight: 'bold',
            color: theme.palette.text.primary,
          })}
        >
          index.md
        </Typography>
      ),
    });

  return (
    <Box
      sx={{
        p: 4,
        height: '100%',
        maxWidth: '1592px',
        margin: 'auto',
      }}
    >
      <Grid
        container
        spacing={4}
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Grid item xs={12} md={6} sx={{ textAlign: 'left' }}>
          <Typography
            sx={theme => ({
              fontSize: '2.5rem',
              fontWeight: 400,
              color: theme.palette.text.primary,
              mb: 2,
            })}
          >
            {displayTitle}
          </Typography>

          <Typography
            sx={theme => ({
              fontSize: '1rem',
              color: theme.palette.text.secondary,
              mb: 1,
              lineHeight: 1.5,
            })}
          >
            {displayDescription}
          </Typography>

          {readMoreHref && (
            <Link
              href={readMoreHref}
              target="_blank"
              rel="noopener noreferrer"
              sx={theme => ({
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: theme.palette.primary.main,
                mb: 2,
              })}
            >
              {t('notFound.readMore')}
            </Link>
          )}

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {showGoBack && (
              <Button
                variant="outlined"
                href="/"
                rel="noopener noreferrer"
                sx={theme => ({
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                })}
              >
                {t('notFound.goBack')}
              </Button>
            )}
            {showContactSupport && (
              <Link
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={theme => ({
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: theme.palette.primary.main,
                })}
              >
                {t('notFound.contactSupport')}
                <OpenInNewIcon sx={{ width: 16, height: 16 }} />
              </Link>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
          <Box
            component="img"
            src={notFoundSvg}
            alt={t('notFound.altText')}
            sx={{
              width: '100%',
              maxWidth: '600px',
              height: 'auto',
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotFoundState;
