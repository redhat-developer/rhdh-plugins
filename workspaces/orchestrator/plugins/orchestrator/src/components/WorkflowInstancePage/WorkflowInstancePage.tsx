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

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from 'react-use';

import {
  ContentHeader,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import {
  useApi,
  useRouteRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import { JsonObject } from '@backstage/types';

import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Close from '@mui/icons-material/Close';
import Error from '@mui/icons-material/Error';
import Start from '@mui/icons-material/Start';
import SwipeRightAltOutlined from '@mui/icons-material/SwipeRightAltOutlined';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import {
  AuthTokenDescriptor,
  isJsonObject,
  orchestratorWorkflowUsePermission,
  orchestratorWorkflowUseSpecificPermission,
  ProcessInstanceDTO,
  ProcessInstanceStatusDTO,
  QUERY_PARAM_INSTANCE_ID,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { SHORT_REFRESH_INTERVAL } from '../../constants';
import { useOrchestratorAuth } from '../../hooks/useOrchestratorAuth';
import { usePermissionArrayDecision } from '../../hooks/usePermissionArray';
import usePolling from '../../hooks/usePolling';
import {
  entityInstanceRouteRef,
  entityWorkflowRouteRef,
  executeWorkflowRouteRef,
  workflowInstanceRouteRef,
} from '../../routes';
import { deepSearchObject } from '../../utils/deepSearchObject';
import { isNonNullable } from '../../utils/TypeGuards';
import { buildUrl } from '../../utils/UrlUtils';
import { BaseOrchestratorPage } from '../BaseOrchestratorPage';
import { InfoDialog } from '../InfoDialog';
import { WorkflowInstancePageContent } from './WorkflowInstancePageContent';

const useStyles = makeStyles()(theme => ({
  abortButton: {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.getContrastText(theme.palette.error.dark),
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
      filter: 'brightness(90%)',
    },
  },
  modalText: {
    marginBottom: theme.spacing(2),
  },
  errorColor: {
    color: theme.palette.error.dark,
  },
  menu: {
    // workaround for theme issue in RHDH
    '& ul': {
      display: 'flex',
      flexDirection: 'column',
      '& li': {
        padding: '6px 16px',
        justifyContent: 'left',
      },
    },
  },
}));

export type AbortConfirmationDialogActionsProps = {
  handleSubmit: () => void;
  handleCancel: () => void;
  isAborting: boolean;
  canAbort: boolean;
};

const AbortConfirmationDialogContent = ({
  canAbort,
}: {
  canAbort: boolean;
}) => {
  const { classes } = useStyles();
  return (
    <div>
      <Box className={classes.modalText}>
        <Typography variant="h6">
          Are you sure you want to abort this workflow run? <br /> <br />
          Aborting will stop all in-progress and pending steps immediately. Any
          incomplete tasks will not be saved.
        </Typography>
      </Box>
      {!canAbort && (
        <Box sx={{ width: '100%' }}>
          <Alert severity="info">
            <AlertTitle>Run completed</AlertTitle>
            It is not possible to abort the run as it has already been
            completed.
          </Alert>
        </Box>
      )}
    </div>
  );
};

const AbortConfirmationDialogActions = (
  props: AbortConfirmationDialogActionsProps,
) => {
  const { classes } = useStyles();
  return (
    <>
      <Button
        onClick={props.handleSubmit}
        variant="contained"
        className={classes.abortButton}
        startIcon={props.isAborting ? <CircularProgress size="1rem" /> : null}
        disabled={props.isAborting || !props.canAbort}
      >
        Abort
      </Button>
      <Button
        onClick={props.handleCancel}
        variant="outlined"
        color="primary"
        disabled={props.isAborting}
      >
        Cancel
      </Button>
    </>
  );
};

// For re-trigger, the wizard is not rendered, so there is no place where to instantiate the AuthRequester widget.
// Let's parse the data input schema and try to find & interpret it.
const getAuthTokenDescriptors = async (
  dataInputSchema: JsonObject | undefined,
): Promise<AuthTokenDescriptor[] | undefined> => {
  if (!dataInputSchema) {
    return undefined;
  }

  const authRequester = deepSearchObject(
    dataInputSchema,
    (obj: JsonObject): boolean => {
      const uiWidget = obj['ui:widget'];
      const uiProps = obj['ui:props'];

      const authTokenDescriptors = isJsonObject(uiProps)
        ? uiProps.authTokenDescriptors
        : undefined;
      return (
        uiWidget === 'AuthRequester' && Array.isArray(authTokenDescriptors)
      );
    },
  );
  if (!authRequester) {
    return undefined;
  }

  const uiProps = (authRequester as JsonObject)['ui:props'] as JsonObject;
  return uiProps.authTokenDescriptors as AuthTokenDescriptor[];
};

export const WorkflowInstancePage = () => {
  const { classes } = useStyles();

  const navigate = useNavigate();
  const orchestratorApi = useApi(orchestratorApiRef);
  const { authenticate } = useOrchestratorAuth();
  const executeWorkflowLink = useRouteRef(executeWorkflowRouteRef);
  const { instanceId } = useRouteRefParams(workflowInstanceRouteRef);
  const entityWorkflowLink = useRouteRef(entityWorkflowRouteRef);
  const { kind, name, namespace } = useRouteRefParams(entityInstanceRouteRef);
  let entityRef: string | undefined = undefined;
  if (kind && namespace && name) {
    entityRef = `${kind}:${namespace}/${name}`;
  }
  const [isAbortConfirmationDialogOpen, setIsAbortConfirmationDialogOpen] =
    useState(false);

  const [isAborting, setIsAborting] = React.useState(false);
  const [isAbortSnackbarOpen, setIsAbortSnackbarOpen] = React.useState(false);
  const [abortError, setAbortError] = React.useState('');

  const [isRetrigger, setIsRetrigger] = React.useState(false);
  const [isRetriggerSnackbarOpen, setIsRetriggerSnackbarOpen] =
    React.useState(false);
  const [retriggerError, setRetriggerError] = React.useState('');

  const handleAbortBarClose = () => {
    setIsAbortSnackbarOpen(false);
  };
  const handleRerunBarClose = () => {
    setIsRetriggerSnackbarOpen(false);
  };

  const fetchInstance = React.useCallback(async () => {
    if (!instanceId) {
      return undefined;
    }
    const res = await orchestratorApi.getInstance(instanceId);
    return res.data;
  }, [instanceId, orchestratorApi]);

  const { loading, error, value, restart } = usePolling<
    ProcessInstanceDTO | undefined
  >(
    fetchInstance,
    SHORT_REFRESH_INTERVAL,
    (curValue: ProcessInstanceDTO | undefined) =>
      !!curValue &&
      (curValue.state === ProcessInstanceStatusDTO.Active ||
        curValue.state === ProcessInstanceStatusDTO.Pending ||
        !curValue.state),
  );

  const workflowId = value?.processId;
  const permittedToUse = usePermissionArrayDecision(
    workflowId
      ? [
          orchestratorWorkflowUsePermission,
          orchestratorWorkflowUseSpecificPermission(workflowId),
        ]
      : [orchestratorWorkflowUsePermission],
  );

  const { value: inputSchema, error: inputSchemaError } =
    useAsync(async (): Promise<JsonObject | undefined> => {
      if (!workflowId) {
        return undefined;
      }

      const res = await orchestratorApi.getWorkflowDataInputSchema(
        workflowId,
        instanceId,
      );
      return res.data?.inputSchema;
    }, [orchestratorApi, workflowId]);

  const canAbort =
    value?.state === ProcessInstanceStatusDTO.Active ||
    value?.state === ProcessInstanceStatusDTO.Error;

  const canRerun =
    value?.state === ProcessInstanceStatusDTO.Completed ||
    value?.state === ProcessInstanceStatusDTO.Aborted ||
    value?.state === ProcessInstanceStatusDTO.Error;

  const toggleAbortConfirmationDialog = React.useCallback(() => {
    setIsAbortConfirmationDialogOpen(prev => !prev);
  }, []);

  const handleAbort = React.useCallback(async () => {
    if (value) {
      setIsAborting(true);

      try {
        await orchestratorApi.abortWorkflowInstance(value.id);
        restart();
      } catch (e) {
        setAbortError(`Abort failed: ${(e as Error).message}`);
        setIsAbortSnackbarOpen(true);
      } finally {
        setIsAborting(false);
        toggleAbortConfirmationDialog();
      }
    }
  }, [orchestratorApi, restart, value, toggleAbortConfirmationDialog]);

  const handleRerun = React.useCallback(() => {
    if (!value) {
      return;
    }
    const routeUrl = !entityRef
      ? executeWorkflowLink({
          workflowId: value.processId,
        })
      : `${executeWorkflowLink({ workflowId: value.processId })}?targetEntity=${entityRef}`;

    const urlToNavigate = buildUrl(routeUrl, {
      [QUERY_PARAM_INSTANCE_ID]: value.id,
    });
    navigate(urlToNavigate);
  }, [value, navigate, executeWorkflowLink, entityRef]);

  const handleRetrigger = async () => {
    if (value) {
      setIsRetrigger(true);
      try {
        const authTokenDescriptors = await getAuthTokenDescriptors(inputSchema);
        let authTokens = undefined;
        if (authTokenDescriptors && authTokenDescriptors.length > 0) {
          authTokens = await authenticate(authTokenDescriptors);
        }
        await orchestratorApi.retriggerInstance(
          value.processId,
          value.id,
          authTokens,
        );
        restart();
      } catch (retriggerInstanceError) {
        if (retriggerInstanceError.toString().includes('Failed Node ID')) {
          setRetriggerError(`Run failed again`);
        } else {
          setRetriggerError(
            `Retrigger failed: ${(retriggerInstanceError as Error).message}`,
          );
        }
        setIsRetriggerSnackbarOpen(true);
      } finally {
        setIsRetrigger(false);
      }
    }
  };

  const anchorRef = useRef(null);
  const [openRerunMenu, setOpenRerunMenu] = useState(false);

  const handleClick = () => {
    setOpenRerunMenu(prev => !prev);
  };

  const handleCloseMenu = () => {
    setOpenRerunMenu(false);
  };

  const handleOptionClick = (option: 'retrigger' | 'rerun') => {
    handleCloseMenu();
    if (option === 'rerun') handleRerun();
    else if (option === 'retrigger') handleRetrigger();
  };

  const combinedError: Error | undefined = error || inputSchemaError;

  return (
    <BaseOrchestratorPage
      title={value?.id}
      type={value?.processName}
      typeLink={
        entityRef
          ? entityWorkflowLink({
              namespace,
              kind,
              name,
              workflowId: value?.processId ?? '',
            })
          : `/orchestrator/workflows/${workflowId}`
      }
    >
      {loading ? <Progress /> : null}
      {combinedError ? <ResponseErrorPanel error={combinedError} /> : null}
      {!loading && isNonNullable(value) ? (
        <>
          <ContentHeader title="">
            <InfoDialog
              title="Abort workflow run?"
              titleIcon={<Error className={classes.errorColor} />}
              onClose={toggleAbortConfirmationDialog}
              open={isAbortConfirmationDialogOpen}
              dialogActions={
                <AbortConfirmationDialogActions
                  handleCancel={toggleAbortConfirmationDialog}
                  handleSubmit={handleAbort}
                  isAborting={isAborting}
                  canAbort={canAbort}
                />
              }
            >
              <AbortConfirmationDialogContent canAbort={canAbort} />
            </InfoDialog>
            <Grid container item justifyContent="flex-end" spacing={1}>
              <Grid item>
                {canAbort && (
                  <Tooltip
                    title="user not authorized to abort workflow"
                    disableHoverListener={permittedToUse.allowed}
                  >
                    <Button
                      variant="outlined"
                      color="primary"
                      disabled={!permittedToUse.allowed}
                      onClick={toggleAbortConfirmationDialog}
                    >
                      Abort
                    </Button>
                  </Tooltip>
                )}
              </Grid>
              <Grid item>
                <Tooltip
                  title="user not authorized to execute workflow"
                  disableHoverListener={permittedToUse.allowed}
                >
                  <Button
                    ref={anchorRef}
                    variant="contained"
                    color="primary"
                    startIcon={
                      isRetrigger ? <CircularProgress size="1rem" /> : null
                    }
                    disabled={!permittedToUse.allowed || !canRerun}
                    onClick={
                      value?.state === ProcessInstanceStatusDTO.Error
                        ? handleClick
                        : handleRerun
                    }
                    endIcon={
                      value?.state === ProcessInstanceStatusDTO.Error ? (
                        <ArrowDropDown />
                      ) : null
                    }
                    style={{ color: 'white' }}
                  >
                    {value.state === ProcessInstanceStatusDTO.Active ? (
                      <>
                        <CircularProgress color="inherit" size="0.75rem" />
                        &nbsp;Running...
                      </>
                    ) : (
                      'Run again'
                    )}
                  </Button>
                </Tooltip>

                <Menu
                  anchorEl={anchorRef.current}
                  open={openRerunMenu}
                  onClose={handleCloseMenu}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  className={classes.menu}
                >
                  <MenuItem onClick={() => handleOptionClick('rerun')}>
                    <Start />
                    Entire workflow
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleOptionClick('retrigger')}
                    disabled={!inputSchema}
                  >
                    <SwipeRightAltOutlined />
                    From failure point
                  </MenuItem>
                </Menu>
              </Grid>
            </Grid>
          </ContentHeader>
          <Snackbar
            open={isAbortSnackbarOpen}
            onClose={handleAbortBarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              severity="error"
              action={
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={handleAbortBarClose}
                >
                  <Close fontSize="small" />
                </IconButton>
              }
            >
              {abortError}
            </Alert>
          </Snackbar>
          <Snackbar
            open={isRetriggerSnackbarOpen}
            onClose={handleRerunBarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              severity="error"
              action={
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={handleRerunBarClose}
                >
                  <Close fontSize="small" />
                </IconButton>
              }
            >
              {retriggerError}
            </Alert>
          </Snackbar>
          <WorkflowInstancePageContent instance={value} />
        </>
      ) : null}
    </BaseOrchestratorPage>
  );
};
WorkflowInstancePage.displayName = 'WorkflowInstancePage';
