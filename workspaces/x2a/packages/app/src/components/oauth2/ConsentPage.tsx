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
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useApi,
  configApiRef,
  fetchApiRef,
  discoveryApiRef,
} from '@backstage/core-plugin-api';
import {
  Page,
  Header,
  Content,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Divider,
  Box,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

interface Session {
  id: string;
  clientName?: string;
  clientId: string;
  redirectUri: string;
  scopes?: string[];
}

type ConsentState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'loaded'; session: Session }
  | { status: 'submitting'; session: Session; action: 'approve' | 'reject' }
  | { status: 'completed'; action: 'approve' | 'reject' };

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: 600,
    margin: `${theme.spacing(4)}px auto`,
  },
  appHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  callbackUrl: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    wordBreak: 'break-all',
    marginTop: theme.spacing(1),
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
  },
}));

const getHeaderTitle = (state: ConsentState): string => {
  if (state.status === 'completed' && state.action === 'approve') {
    return 'Authorization Approved';
  }
  if (state.status === 'completed') {
    return 'Authorization Denied';
  }
  return 'Authorization Request';
};

export const ConsentPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const classes = useStyles();
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const appTitle = configApi.getOptionalString('app.title') ?? 'Backstage';

  const [state, setState] = useState<ConsentState>({ status: 'loading' });

  useEffect(() => {
    if (!sessionId) {
      setState({ status: 'error', error: 'No session ID provided' });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('auth');
        const response = await fetchApi.fetch(
          `${baseUrl}/v1/sessions/${sessionId}`,
        );

        if (cancelled) return;
        if (!response.ok) {
          const text = await response.text();
          setState({ status: 'error', error: text || response.statusText });
          return;
        }

        const session: Session = await response.json();
        setState({ status: 'loaded', session });
      } catch (e: unknown) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : String(e);
        setState({ status: 'error', error: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, discoveryApi, fetchApi]);

  const handleAction = useCallback(
    async (action: 'approve' | 'reject') => {
      if (state.status !== 'loaded') return;

      setState({ status: 'submitting', session: state.session, action });

      try {
        const baseUrl = await discoveryApi.getBaseUrl('auth');
        const response = await fetchApi.fetch(
          `${baseUrl}/v1/sessions/${sessionId}/${action}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' } },
        );

        if (!response.ok) {
          const text = await response.text();
          setState({ status: 'loaded', session: state.session });
          throw new Error(text || response.statusText);
        }

        const result = await response.json();
        setState({ status: 'completed', action });

        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setState({ status: 'error', error: message });
      }
    },
    [state, sessionId, discoveryApi, fetchApi],
  );

  const headerTitle = getHeaderTitle(state);

  return (
    <Page themeId="tool">
      <Header title={headerTitle} />
      <Content>
        {state.status === 'loading' && (
          <Box display="flex" justifyContent="center" height={300}>
            <Progress />
          </Box>
        )}

        {state.status === 'error' && (
          <ResponseErrorPanel
            title="Authorization Error"
            error={new Error(state.error)}
          />
        )}

        {state.status === 'completed' && (
          <Typography variant="h5" align="center" style={{ marginTop: 32 }}>
            {state.action === 'approve'
              ? `You have successfully authorized the application to access your ${appTitle} account. Redirecting...`
              : `You have denied the application access to your ${appTitle} account.`}
          </Typography>
        )}

        {(state.status === 'loaded' || state.status === 'submitting') && (
          <Card className={classes.card}>
            <CardContent>
              <Box className={classes.appHeader}>
                <Box>
                  <Typography variant="h6">
                    {state.session.clientName ?? state.session.clientId}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    wants to access your {appTitle} account
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box mt={2}>
                <Typography variant="body2">
                  This will grant the application a token to access {appTitle}{' '}
                  on your behalf. Only authorize applications you trust.
                </Typography>
                <Box className={classes.callbackUrl}>
                  {state.session.redirectUri}
                </Box>
              </Box>
            </CardContent>
            <CardActions className={classes.actions}>
              <Button
                variant="outlined"
                color="secondary"
                disabled={state.status === 'submitting'}
                onClick={() => handleAction('reject')}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={state.status === 'submitting'}
                onClick={() => handleAction('approve')}
              >
                {state.status === 'submitting' && state.action === 'approve'
                  ? 'Authorizing...'
                  : 'Authorize'}
              </Button>
            </CardActions>
          </Card>
        )}
      </Content>
    </Page>
  );
};
