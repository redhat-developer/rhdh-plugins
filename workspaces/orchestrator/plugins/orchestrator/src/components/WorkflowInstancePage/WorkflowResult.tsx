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

import { ReactNode, useCallback, useMemo, useReducer, useState } from 'react';

import {
  InfoCard,
  Link,
  MarkdownContent,
  StructuredMetadataTable,
} from '@backstage/core-components';
import { RouteFunc, useApi, useRouteRef } from '@backstage/core-plugin-api';
import { AboutField } from '@backstage/plugin-catalog';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { makeStyles } from 'tss-react/mui';

import {
  ProcessInstanceDTO,
  ProcessInstanceErrorDTO,
  ProcessInstanceStatusDTO,
  QUERY_PARAM_INSTANCE_ID,
  WorkflowOverviewDTO,
  WorkflowResultDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { useLogsEnabled } from '../../hooks/useLogsEnabled';
import { useTranslation } from '../../hooks/useTranslation';
import { executeWorkflowRouteRef } from '../../routes';
import { formatDuration } from '../../utils/DurationUtils';
import {
  extractSsoReauthorizeUrl,
  isSamlSsoError,
} from '../../utils/ErrorUtils';
import { formatMetadataForDisplay } from '../../utils/formatMetadataForDisplay';
import { buildUrl } from '../../utils/UrlUtils';
import { Trans } from '../Trans';
import { SamlSsoExpiredDialog } from '../ui/SamlSsoExpiredDialog';
import {
  WorkflowDescriptionModal,
  WorkflowDescriptionModalProps,
} from './WorkflowDescriptionModal';
import { WorkflowLogsDialog } from './WorkflowLogsDialog';

const useStyles = makeStyles()(theme => ({
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
  },
  outputGrid: {
    '& h2': {
      textTransform: 'none',
      fontSize: 'small',
    },
  },
  links: {
    padding: '0px',
  },
  values: {
    minWidth: 0,
    maxWidth: '100%',
    overflowX: 'auto',
    '& table': {
      tableLayout: 'fixed',
      width: '100%',
    },
    '& td': {
      wordBreak: 'break-word',
      whiteSpace: 'normal',
    },
    '& tr > td': {
      paddingLeft: '0px',
    },
  },
  errorIcon: {
    color: theme.palette.error.main,
  },
}));

const finalStates: ProcessInstanceStatusDTO[] = [
  ProcessInstanceStatusDTO.Error,
  ProcessInstanceStatusDTO.Completed,
  ProcessInstanceStatusDTO.Suspended,
];

const ResultMessage = ({
  status,
  error,
  resultMessage,
  executionSummary: executionSummary,
  end,
}: {
  status?: ProcessInstanceStatusDTO;
  error?: ProcessInstanceErrorDTO;
  resultMessage?: WorkflowResultDTO['message'];
  executionSummary?: string[];
  end?: string;
}) => {
  const { t } = useTranslation();
  const errorMessage = error?.message || error?.toString();
  const executionSummaryArray: string[] = executionSummary ?? [];

  const extractIsoTimestamp = (
    keyword:
      | 'started'
      | 'failed'
      | 'retriggered'
      | 'waiting'
      | 'completed'
      | 'aborted',
  ): string | undefined => {
    const matchingMessage = executionSummaryArray.find(str =>
      str.toLowerCase().includes(keyword),
    );
    if (!matchingMessage) {
      return undefined;
    }

    const timeMatch = matchingMessage.match(
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/,
    );
    return timeMatch?.[1];
  };

  const getTimeFromExecutionSummary = (
    keyword: 'started' | 'failed' | 'retriggered' | 'waiting' | 'completed',
  ): string[] => {
    const isoTime = extractIsoTimestamp(keyword);
    if (!isoTime) {
      return [''];
    }

    const formattedDate = new Date(isoTime).toLocaleString();

    if (keyword === 'waiting') {
      const matchingMessage = executionSummaryArray.find(str =>
        str.includes(keyword),
      );
      return [formattedDate, matchingMessage ?? ''];
    }
    return [formattedDate];
  };

  const getAbortTimeAgo = (): string => {
    const isoTime = extractIsoTimestamp('aborted') ?? end;
    if (!isoTime) {
      return '';
    }
    const diffMs = Date.now() - new Date(isoTime).getTime();
    if (diffMs < 0) {
      return '';
    }
    return formatDuration(diffMs, t);
  };

  const checkIfWaiting = (): ReactNode => {
    const [formattedTime, waitingMessage] =
      getTimeFromExecutionSummary('waiting');

    if (waitingMessage) {
      const nodeMatch = waitingMessage.match(/node (\S+) since/);
      const node = nodeMatch?.[1] ?? 'unknown';
      return (
        <Trans
          message="run.status.runningWaitingAtNode"
          params={{ node, formattedTime }}
        />
      );
    }
    const [startedTime] = getTimeFromExecutionSummary('started');

    if (startedTime !== '') {
      return (
        <>
          <CircularProgress size="0.75rem" />
          &nbsp;
          <Trans
            message="run.status.workflowIsRunning"
            params={{ time: startedTime }}
          />
        </>
      );
    }
    return '';
  };

  let alertProps: {
    title: ReactNode;
    message: string | undefined;
    severity: 'warning' | 'error' | 'success' | 'info';
  };

  if (status === ProcessInstanceStatusDTO.Aborted) {
    const abortTimeAgo = getAbortTimeAgo();
    alertProps = {
      title: abortTimeAgo ? (
        <Trans message="run.status.aborted" params={{ time: abortTimeAgo }} />
      ) : (
        t('run.status.abortedWithoutTime')
      ),
      message: errorMessage || '',
      severity: 'info',
    };
  } else if (error) {
    if (status === ProcessInstanceStatusDTO.Completed) {
      alertProps = {
        title: (
          <Trans
            message="run.status.completedWithMessage"
            params={{ time: getTimeFromExecutionSummary('completed') }}
          />
        ),
        message: errorMessage,
        severity: 'warning',
      };
    } else {
      alertProps = {
        title: (
          <Trans
            message="run.status.failed"
            params={{ time: getTimeFromExecutionSummary('failed') }}
          />
        ),
        message: errorMessage,
        severity: 'error',
      };
    }
  } else if (status && finalStates.includes(status)) {
    let message = t('run.status.noAdditionalInfo');
    if (resultMessage) {
      message = (
        <MarkdownContent content={resultMessage} />
      ) as unknown as string;
    }

    alertProps = {
      title: (
        <Trans
          message="run.status.completedAt"
          params={{ time: getTimeFromExecutionSummary('completed') }}
        />
      ),
      message,
      severity: 'success',
    };
  } else {
    const activeMessage = checkIfWaiting();

    alertProps = {
      title: <>{activeMessage}</>,
      message: t('run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete'),
      severity: 'info',
    };
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Alert severity={alertProps.severity}>
        <AlertTitle>{alertProps.title}</AlertTitle>
        {alertProps.message}
      </Alert>
    </Box>
  );
};

const NextWorkflows = ({
  instanceId,
  nextWorkflows,
}: {
  instanceId: string;
  nextWorkflows: WorkflowResultDTO['nextWorkflows'];
}) => {
  const { t } = useTranslation();
  const { classes } = useStyles();

  const orchestratorApi = useApi(orchestratorApiRef);
  const executeWorkflowLink: RouteFunc<{ workflowId: string }> = useRouteRef(
    executeWorkflowRouteRef,
  );

  const [
    currentOpenedWorkflowDescriptionModalID,
    setCurrentOpenedWorkflowDescriptionModalID,
  ] = useState('');

  const [currentWorkflow, setCurrentWorkflow] = useState(
    {} as WorkflowOverviewDTO,
  );
  const [workflowError, setWorkflowError] =
    useState<WorkflowDescriptionModalProps['workflowError']>();

  const runWorkflowLink = useMemo(
    () =>
      buildUrl(
        executeWorkflowLink({
          workflowId: currentOpenedWorkflowDescriptionModalID,
        }),
        {
          [QUERY_PARAM_INSTANCE_ID]: instanceId,
        },
      ),
    [currentOpenedWorkflowDescriptionModalID, executeWorkflowLink, instanceId],
  );

  const openWorkflowDescriptionModal = useCallback(
    (itemId: string) => {
      if (itemId) {
        orchestratorApi
          .getWorkflowOverview(itemId)
          .then(workflow => {
            setCurrentWorkflow(workflow.data);
          })
          .catch(error => {
            setWorkflowError({ itemId, error });
          });
        setCurrentOpenedWorkflowDescriptionModalID(itemId);
      }
    },
    [orchestratorApi],
  );

  const closeWorkflowDescriptionModal = useCallback(() => {
    setCurrentOpenedWorkflowDescriptionModalID('');
    setCurrentWorkflow({} as WorkflowOverviewDTO);
  }, []);

  if (!nextWorkflows?.length) {
    return null;
  }

  const sectionLabel =
    nextWorkflows.length === 1
      ? t('run.suggestedNextWorkflow')
      : t('run.suggestedNextWorkflows');

  return (
    <Box className={classes.outputGrid}>
      <AboutField label={sectionLabel}>
        <List dense disablePadding>
          {nextWorkflows.map(item => (
            <ListItem key={item.id} disableGutters>
              <Link
                color="primary"
                to="#"
                onClick={() => {
                  openWorkflowDescriptionModal(item.id);
                }}
              >
                {item.name}
              </Link>
            </ListItem>
          ))}
        </List>
      </AboutField>
      <WorkflowDescriptionModal
        workflow={currentWorkflow}
        workflowError={workflowError}
        runWorkflowLink={runWorkflowLink}
        open={!!currentOpenedWorkflowDescriptionModalID}
        onClose={closeWorkflowDescriptionModal}
      />
    </Box>
  );
};

const WorkflowOutputs = ({
  outputs,
}: {
  outputs: WorkflowResultDTO['outputs'];
}) => {
  const { t } = useTranslation();
  const { classes } = useStyles();

  if (!outputs?.length) {
    return null;
  }

  const links = outputs?.filter(item => item.format === 'link');
  const markdowns = outputs?.filter(item => item.format === 'markdown');
  const values = outputs?.filter(
    item => item.format !== 'link' && item.format !== 'markdown',
  );
  const valuesAsObject = values.reduce<{
    [key: string]: any;
  }>((data, item) => {
    let value = item.value || '';
    if (!['string', 'number', 'boolean'].includes(typeof value)) {
      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      } else if (typeof value === 'object') {
        value = `Object: ${JSON.stringify(value)}`;
      } else {
        value = 'Unexpected type';
      }
    }
    return { ...data, [item.key]: value };
  }, {});

  return (
    <>
      {links?.length > 0 && (
        <Box key="__links" className={classes.links}>
          <AboutField label={t('common.links')}>
            <List dense disablePadding>
              {links
                .filter(
                  item =>
                    item.value && item.key && typeof item.value === 'string',
                )
                .map(item => {
                  return (
                    <ListItem disableGutters key={item.key}>
                      <Link to={item.value as string}>{item.key}</Link>
                    </ListItem>
                  );
                })}
            </List>
          </AboutField>
        </Box>
      )}

      {(Object.keys(valuesAsObject).length > 0 || markdowns?.length > 0) && (
        <Box key="non__links" className={classes.values}>
          <AboutField label={t('common.values')}>
            {markdowns?.length > 0 &&
              markdowns.map(item => (
                <MarkdownContent
                  key={item.key}
                  content={item.value as string}
                />
              ))}
            {Object.keys(valuesAsObject).length > 0 && (
              <StructuredMetadataTable
                dense
                metadata={formatMetadataForDisplay(valuesAsObject)}
              />
            )}
          </AboutField>
        </Box>
      )}
    </>
  );
};

export const WorkflowResult: React.FC<{
  instance: ProcessInstanceDTO;
  className: string;
  cardClassName?: string;
}> = ({ instance, className, cardClassName }) => {
  const { t } = useTranslation();
  const { classes } = useStyles();
  const result = instance.workflowdata?.result;
  const [isLogsDialogOpen, toggleLogsDialog] = useReducer(
    state => !state,
    false,
  );
  const logsEnabled = useLogsEnabled();

  const errorObj = instance.error?.message
    ? new Error(instance.error.message)
    : undefined;
  const hasSamlError = isSamlSsoError(errorObj);
  const [isSamlDialogOpen, setIsSamlDialogOpen] = useState(hasSamlError);

  return (
    <>
      <InfoCard
        title={t('run.results')}
        divider={false}
        className={className}
        cardClassName={cardClassName}
      >
        <Box className={classes.cardContent}>
          <ResultMessage
            status={instance.state}
            error={instance.error}
            resultMessage={result?.message}
            executionSummary={instance.executionSummary}
            end={instance.end}
          />
          {logsEnabled && (
            <>
              <Divider />
              <Button
                variant="text"
                color="primary"
                onClick={toggleLogsDialog}
                disableRipple
                sx={{
                  alignSelf: 'flex-start',
                  textTransform: 'none',
                  padding: 0,
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent' },
                }}
              >
                {t('run.logs.viewLogs')}
              </Button>
              <Divider />
            </>
          )}
          <NextWorkflows
            instanceId={instance.id}
            nextWorkflows={result?.nextWorkflows}
          />
          <WorkflowOutputs outputs={result?.outputs} />
        </Box>
      </InfoCard>
      <WorkflowLogsDialog
        open={isLogsDialogOpen}
        onClose={toggleLogsDialog}
        instanceId={instance.id}
        processName={instance.processName}
      />
      <SamlSsoExpiredDialog
        open={isSamlDialogOpen}
        reauthorizeUrl={extractSsoReauthorizeUrl(errorObj)}
        onClose={() => setIsSamlDialogOpen(false)}
      />
    </>
  );
};

WorkflowResult.displayName = 'WorkflowResult';
