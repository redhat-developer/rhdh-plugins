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

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useTranslation } from '../hooks/useTranslation';

const LLAMA_STACK_CONFIGURE_DOCS_URL =
  'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/html/interacting_with_red_hat_developer_lightspeed_for_red_hat_developer_hub/developer-lightspeed#proc-installing-and-configuring-lightspeed_developer-lightspeed';
const LIGHTSPEED_BACKEND_README_URL =
  'https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/lightspeed/plugins/lightspeed-backend/README.md';

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  minHeight: '100%',
  height: '100%',
  flex: '1 1 auto',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4, 2),
  backgroundColor: theme.palette.background.default,
}));

const Panel = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  width: '100%',
  maxWidth: 440,
  gap: theme.spacing(2),
}));

/**
 * Shown while the models list is loading for an authorized user.
 */
export const LightspeedChatModelsLoading = () => {
  const { t } = useTranslation();
  return (
    <Root
      data-testid="lightspeed-models-loading"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      <CircularProgress aria-hidden />
    </Root>
  );
};

/**
 * Shown when LCORE / Llama Stack is up but no LLM models are registered.
 */
export const LcoreNotConfiguredEmptyState = () => {
  const { t } = useTranslation();

  return (
    <Root data-testid="lightspeed-lcore-not-configured">
      <Panel component="section" aria-labelledby="lightspeed-lcore-empty-title">
        <SmartToyOutlinedIcon
          sx={{ fontSize: 64, color: 'text.secondary' }}
          aria-hidden
          focusable={false}
        />
        <Typography
          id="lightspeed-lcore-empty-title"
          variant="h5"
          component="h2"
        >
          {t('lcore.notConfigured.title')}
        </Typography>
        <Typography
          variant="body1"
          component="p"
          sx={{ lineHeight: 1.5, color: 'text.secondary' }}
        >
          {t('lcore.notConfigured.description')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            mt: 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            target="_blank"
            rel="noopener noreferrer"
            href={LLAMA_STACK_CONFIGURE_DOCS_URL}
          >
            {t('lcore.notConfigured.developerLightspeedDocs')} &nbsp;{' '}
            <OpenInNewIcon fontSize="small" aria-hidden />
          </Button>
          <Link
            sx={theme => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing(0.5),
              fontSize: theme.typography.body1.fontSize,
              fontWeight: 500,
            })}
            component="a"
            color="primary"
            href={LIGHTSPEED_BACKEND_README_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('lcore.notConfigured.backendDocs')}
            <OpenInNewIcon fontSize="small" aria-hidden />
          </Link>
        </Box>
      </Panel>
    </Root>
  );
};

type ModelsLoadErrorEmptyStateProps = {
  onRetry: () => void;
};

/**
 * Shown when the models API fails (distinct from "no models configured").
 */
export const ModelsLoadErrorEmptyState = ({
  onRetry,
}: ModelsLoadErrorEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <Root data-testid="lightspeed-models-load-error">
      <Panel
        component="section"
        aria-labelledby="lightspeed-models-error-title"
      >
        <ErrorOutlineIcon
          sx={{ fontSize: 64, color: 'warning.main' }}
          aria-hidden
          focusable={false}
        />
        <Typography
          id="lightspeed-models-error-title"
          variant="h5"
          component="h2"
        >
          {t('lcore.loadError.title')}
        </Typography>
        <Typography
          variant="body1"
          component="p"
          sx={{ lineHeight: 1.5, color: 'text.secondary' }}
        >
          {t('lcore.loadError.description')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            mt: 1,
          }}
        >
          <Button variant="contained" color="primary" onClick={() => onRetry()}>
            {t('common.retry')}
          </Button>
        </Box>
      </Panel>
    </Root>
  );
};
