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

import {
  Box,
  Button,
  CircularProgress,
  Link,
  Typography,
} from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

import { useTranslation } from '../hooks/useTranslation';

const LLAMA_STACK_CONFIGURE_DOCS_URL =
  'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/html/interacting_with_red_hat_developer_lightspeed_for_red_hat_developer_hub/install-and-configure_interacting-with-developer-lightspeed-for-rhdh/';
const LIGHTSPEED_BACKEND_README_URL =
  'https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/lightspeed/plugins/lightspeed-backend/README.md';

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
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
    },
    panel: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      width: '100%',
      maxWidth: 440,
      gap: theme.spacing(2),
    },
    emptyStateIcon: {
      fontSize: 64,
      color: theme.palette.text.secondary,
    },
    errorIcon: {
      fontSize: 64,
      color: theme.palette.warning.main,
    },
    description: {
      lineHeight: 1.5,
      color: theme.palette.text.secondary,
    },
    actions: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      marginTop: theme.spacing(1),
    },
    backendLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      fontSize: theme.typography.body1.fontSize,
      fontWeight: 500,
    },
  }),
);

/**
 * Shown while the models list is loading for an authorized user.
 */
export const LightspeedChatModelsLoading = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  return (
    <div
      className={classes.root}
      data-testid="lightspeed-models-loading"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      <CircularProgress aria-hidden />
    </div>
  );
};

/**
 * Shown when LCORE / Llama Stack is up but no LLM models are registered.
 */
export const LcoreNotConfiguredEmptyState = () => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <div className={classes.root} data-testid="lightspeed-lcore-not-configured">
      <Box
        className={classes.panel}
        component="section"
        aria-labelledby="lightspeed-lcore-empty-title"
      >
        <SmartToyOutlinedIcon
          className={classes.emptyStateIcon}
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
          className={classes.description}
        >
          {t('lcore.notConfigured.description')}
        </Typography>
        <Box className={classes.actions}>
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
            className={classes.backendLink}
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
      </Box>
    </div>
  );
};

type ModelsLoadErrorEmptyStateProps = {
  onRetry: () => void;
};

/**
 * Shown when the models API fails (distinct from “no models configured”).
 */
export const ModelsLoadErrorEmptyState = ({
  onRetry,
}: ModelsLoadErrorEmptyStateProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <div className={classes.root} data-testid="lightspeed-models-load-error">
      <Box
        className={classes.panel}
        component="section"
        aria-labelledby="lightspeed-models-error-title"
      >
        <ErrorOutlineIcon
          className={classes.errorIcon}
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
          className={classes.description}
        >
          {t('lcore.loadError.description')}
        </Typography>
        <Box className={classes.actions}>
          <Button variant="contained" color="primary" onClick={() => onRetry()}>
            {t('common.retry')}
          </Button>
        </Box>
      </Box>
    </div>
  );
};
