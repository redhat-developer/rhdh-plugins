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

import { ReactNode, useCallback, useMemo, useState } from 'react';

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
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
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
import { useTranslation } from '../../hooks/useTranslation';
import { executeWorkflowRouteRef } from '../../routes';
import { buildUrl } from '../../utils/UrlUtils';
import { Trans } from '../Trans';
import {
  WorkflowDescriptionModal,
  WorkflowDescriptionModalProps,
} from './WorkflowDescriptionModal';

const useStyles = makeStyles()(theme => ({
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
}: {
  status?: ProcessInstanceStatusDTO;
  error?: ProcessInstanceErrorDTO;
  resultMessage?: WorkflowResultDTO['message'];
  executionSummary?: string[];
}) => {
  const { t } = useTranslation();
  const errorMessage = error?.message || error?.toString();
  const executionSummaryArray: string[] = executionSummary ?? [];

  const getTimeFromExecutionSummary = (
    keyword: 'started' | 'failed' | 'retriggered' | 'waiting' | 'completed',
  ): string[] => {
    const matchingMessage = executionSummaryArray.find(str =>
      str.includes(keyword),
    );
    if (!matchingMessage) return [''];

    const timeMatch = matchingMessage.match(
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/,
    );
    if (!timeMatch) return ['']; // for example 2025-06-25T16:05:18.512Z

    const formattedDate = new Date(timeMatch[1]).toLocaleString();

    return keyword === 'waiting'
      ? [formattedDate, matchingMessage]
      : [`at ${formattedDate}`];
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

  if (error) {
    if (status === ProcessInstanceStatusDTO.Completed) {
      // Backend reports "Completed" but there's also an error
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
  } else if (status === ProcessInstanceStatusDTO.Aborted) {
    // run aborted
    alertProps = {
      title: 'Run has aborted',
      message: '',
      severity: 'info',
    };
  } else if (status && finalStates.includes(status)) {
    let message = t('run.status.noAdditionalInfo');
    if (resultMessage) {
      // Workaround, an Element is still accepted by the Alert component
      message = (
        <MarkdownContent content={resultMessage} />
      ) as unknown as string;
    }

    // run completed
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
    // Running - might be waiting
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
    <Grid item xs={12} className={classes.outputGrid}>
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
    </Grid>
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
        <Grid item md={12} key="__links" className={classes.links}>
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
        </Grid>
      )}

      {(Object.keys(valuesAsObject).length > 0 || markdowns?.length > 0) && (
        <Grid item md={12} key="non__links" className={classes.values}>
          <AboutField label={t('common.values')}>
            {markdowns?.length > 0 &&
              markdowns.map(item => (
                <MarkdownContent
                  key={item.key}
                  content={item.value as string}
                />
              ))}
            {Object.keys(valuesAsObject).length > 0 && (
              <StructuredMetadataTable dense metadata={valuesAsObject} />
            )}
          </AboutField>
        </Grid>
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
  const result = instance.workflowdata?.result;

  return (
    <InfoCard
      title={t('run.results')}
      subheader={
        <ResultMessage
          status={instance.state}
          error={instance.error}
          resultMessage={result?.message}
          executionSummary={instance.executionSummary}
        />
      }
      divider={false}
      className={className}
      cardClassName={cardClassName}
    >
      <Grid container alignContent="flex-start" spacing="1rem">
        <NextWorkflows
          instanceId={instance.id}
          nextWorkflows={result?.nextWorkflows}
        />
        <WorkflowOutputs outputs={result?.outputs} />
      </Grid>
    </InfoCard>
  );
};

WorkflowResult.displayName = 'WorkflowResult';
