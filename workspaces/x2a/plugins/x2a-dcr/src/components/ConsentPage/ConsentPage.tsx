/*
 * Copyright 2025 The Backstage Authors
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
import { useParams } from 'react-router-dom';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { makeStyles, Theme } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';
import AppsIcon from '@material-ui/icons/Apps';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import BlockIcon from '@material-ui/icons/Block';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import { useConsentSession } from './useConsentSession';

const useStyles = makeStyles((theme: Theme) => ({
  card: {
    maxWidth: 600,
    margin: `${theme.spacing(4)}px auto 0`,
  },
  appHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  appIcon: {
    color: theme.palette.text.secondary,
  },
  callbackUrl: {
    fontFamily: 'monospace',
    background:
      theme.palette.type === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[100],
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    wordBreak: 'break-all',
    fontSize: '0.85rem',
    marginTop: theme.spacing(1),
  },
  completedIconSuccess: {
    color: theme.palette.success.main,
    marginBottom: theme.spacing(2),
    fontSize: 48,
  },
  completedIconDanger: {
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
    fontSize: 48,
  },
  actions: {
    justifyContent: 'flex-end',
    padding: theme.spacing(2),
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
}));

const ConsentPageLayout = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles();
  return (
    <Container maxWidth="sm">
      <Typography variant="h1" className={classes.srOnly}>
        Authorization
      </Typography>
      {children}
    </Container>
  );
};

export const ConsentPage = () => {
  const classes = useStyles();
  const { sessionId } = useParams<'sessionId'>();
  const { state, handleAction } = useConsentSession({ sessionId });
  const configApi = useApi(configApiRef);
  const appTitle = configApi.getOptionalString('app.title') ?? 'Backstage';

  if (!sessionId) {
    return (
      <ConsentPageLayout>
        <Alert severity="info">No session ID provided.</Alert>
      </ConsentPageLayout>
    );
  }

  if (state.status === 'loading') {
    return (
      <ConsentPageLayout>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </ConsentPageLayout>
    );
  }

  if (state.status === 'error') {
    return (
      <ConsentPageLayout>
        <Alert severity="error">{state.error}</Alert>
      </ConsentPageLayout>
    );
  }

  if (state.status === 'completed') {
    return (
      <ConsentPageLayout>
        <Card className={classes.card}>
          <CardContent>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              textAlign="center"
            >
              {state.action === 'approve' ? (
                <CheckCircleIcon className={classes.completedIconSuccess} />
              ) : (
                <CancelIcon className={classes.completedIconDanger} />
              )}
              <Typography variant="h5" gutterBottom>
                {state.action === 'approve'
                  ? 'Authorization Approved'
                  : 'Authorization Denied'}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {state.action === 'approve'
                  ? `You have successfully authorized the application to access your ${appTitle} account.`
                  : `You have denied the application access to your ${appTitle} account.`}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                style={{ marginTop: 8 }}
              >
                Redirecting to the application...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </ConsentPageLayout>
    );
  }

  const session = state.session;
  const isSubmitting = state.status === 'submitting';
  const appName = session.clientName ?? session.clientId;

  return (
    <ConsentPageLayout>
      <Card className={classes.card}>
        <CardContent>
          <Box className={classes.appHeader}>
            <AppsIcon className={classes.appIcon} fontSize="large" />
            <Box>
              <Typography variant="h6">{appName}</Typography>
              <Typography variant="body2" color="textSecondary">
                wants to access your {appTitle} account
              </Typography>
            </Box>
          </Box>

          <Box my={2}>
            <Divider />
          </Box>

          <Typography variant="body2" gutterBottom>
            By authorizing this application, you are granting it access to your
            {appTitle} account. The application will receive an access token
            that allows it to act on your behalf.
          </Typography>
          <Box className={classes.callbackUrl}>{session.redirectUri}</Box>
        </CardContent>

        <CardContent>
          <Alert
            severity="warning"
            icon={<VerifiedUserIcon fontSize="inherit" />}
          >
            Make sure you trust this application and recognize the callback URL
            above. Only authorize applications you trust.
          </Alert>
        </CardContent>

        <Divider />

        <CardActions className={classes.actions}>
          <Button
            variant="outlined"
            disabled={isSubmitting}
            onClick={() => handleAction('reject')}
            startIcon={<BlockIcon />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            onClick={() => handleAction('approve')}
            startIcon={<VerifiedUserIcon />}
          >
            {isSubmitting ? 'Authorizing...' : 'Authorize'}
          </Button>
        </CardActions>
      </Card>
    </ConsentPageLayout>
  );
};
