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
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';

import noScorecardsSvg from '../../images/no-scorecards.svg';
import { useTranslation } from '../../hooks/useTranslation';

const NoScorecardsState: React.FC = () => {
  const { t } = useTranslation();

  const configApi = useApi(configApiRef);
  const supportUrl =
    configApi.getOptionalString('app.support.url') ??
    'https://access.redhat.com/documentation/red_hat_developer_hub';

  return (
    <Box sx={{ p: 4, height: '100%', maxWidth: '1592px', margin: 'auto' }}>
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
              fontWeight: 300,
              color: theme.palette.text.primary,
              mb: 2,
            })}
          >
            {t('emptyState.title')}
          </Typography>

          <Typography
            sx={theme => ({
              fontSize: '1rem',
              color: theme.palette.text.secondary,
              mb: 3,
              lineHeight: 1.5,
            })}
          >
            {t('emptyState.description')}
          </Typography>

          <Button
            color="primary"
            variant="contained"
            size="large"
            component="a"
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={
              <OpenInNewOutlinedIcon sx={{ width: 16, height: 16, ml: 1 }} />
            }
          >
            {t('emptyState.button')}
          </Button>
        </Grid>

        <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
          <Box
            component="img"
            src={noScorecardsSvg}
            alt={t('emptyState.altText')}
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

export default NoScorecardsState;
