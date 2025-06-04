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

import React, { ReactNode } from 'react';

import {
  InfoCard,
  Link,
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
  AssessedProcessInstanceDTO,
  ProcessInstanceErrorDTO,
  ProcessInstanceStatusDTO,
  QUERY_PARAM_ASSESSMENT_INSTANCE_ID,
  WorkflowOverviewDTO,
  WorkflowResultDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../api';
import { executeWorkflowRouteRef } from '../routes';
import { buildUrl } from '../utils/UrlUtils';
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
}: {
  status?: ProcessInstanceStatusDTO;
  error?: ProcessInstanceErrorDTO;
  resultMessage?: WorkflowResultDTO['message'];
}) => {
  const errorMessage = error?.message || error?.toString();

  let statusComponent: ReactNode = <></>;

  if (error) {
    // The resultMessage won't be displayed even if it's defined when there's an error.

    if (status === ProcessInstanceStatusDTO.Completed) {
      // we are receiving confusing data from the backend - Completed but with error message
      statusComponent = (
        <Box sx={{ width: '100%' }}>
          <Alert severity="warning">
            <AlertTitle>Run completed with message</AlertTitle>
            {errorMessage}
          </Alert>
        </Box>
      );
    } else {
      statusComponent = (
        <Box sx={{ width: '100%' }}>
          <Alert severity="error">
            <AlertTitle>Run has failed</AlertTitle>
            {errorMessage}
          </Alert>
        </Box>
      );
    }
  } else if (!error && resultMessage) {
    statusComponent = (
      <Box sx={{ width: '100%' }}>
        <Alert severity="success">
          <AlertTitle>Run completed</AlertTitle>
          {resultMessage}
        </Alert>
      </Box>
    );
  } else if (!error && !resultMessage) {
    if (status === ProcessInstanceStatusDTO.Aborted) {
      statusComponent = (
        <Box sx={{ width: '100%' }}>
          <Alert severity="info">
            <AlertTitle> Run has aborted</AlertTitle>
          </Alert>
        </Box>
      );
    } else if (status && finalStates.includes(status)) {
      statusComponent = (
        <Box sx={{ width: '100%' }}>
          <Alert severity="success">
            <AlertTitle>Run completed</AlertTitle>
            The workflow provided no additional info about the status.
          </Alert>
        </Box>
      );
    } else {
      statusComponent = (
        <Box sx={{ width: '100%' }}>
          <Alert severity="info">
            <AlertTitle>
              <CircularProgress size="0.75rem" /> Workflow is Running...
            </AlertTitle>
            Results will be displayed here once the run is complete.
          </Alert>
        </Box>
      );
    }
  }
  return statusComponent;
};

const NextWorkflows = ({
  instanceId,
  nextWorkflows,
}: {
  instanceId: string;
  nextWorkflows: WorkflowResultDTO['nextWorkflows'];
}) => {
  const { classes } = useStyles();

  const orchestratorApi = useApi(orchestratorApiRef);
  const executeWorkflowLink: RouteFunc<{ workflowId: string }> = useRouteRef(
    executeWorkflowRouteRef,
  );

  const [
    currentOpenedWorkflowDescriptionModalID,
    setCurrentOpenedWorkflowDescriptionModalID,
  ] = React.useState('');

  const [currentWorkflow, setCurrentWorkflow] = React.useState(
    {} as WorkflowOverviewDTO,
  );
  const [workflowError, setWorkflowError] =
    React.useState<WorkflowDescriptionModalProps['workflowError']>();

  const runWorkflowLink = React.useMemo(
    () =>
      buildUrl(
        executeWorkflowLink({
          workflowId: currentOpenedWorkflowDescriptionModalID,
        }),
        {
          [QUERY_PARAM_ASSESSMENT_INSTANCE_ID]: instanceId,
        },
      ),
    [currentOpenedWorkflowDescriptionModalID, executeWorkflowLink, instanceId],
  );

  const openWorkflowDescriptionModal = React.useCallback(
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

  const closeWorkflowDescriptionModal = React.useCallback(() => {
    setCurrentOpenedWorkflowDescriptionModalID('');
    setCurrentWorkflow({} as WorkflowOverviewDTO);
  }, []);

  if (!nextWorkflows?.length) {
    return null;
  }

  const sectionLabel =
    nextWorkflows.length === 1
      ? 'Suggested next workflow'
      : 'Suggested next workflows';

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
  const { classes } = useStyles();

  if (!outputs?.length) {
    return null;
  }

  const links = outputs?.filter(item => item.format === 'link');
  const nonLinks = outputs?.filter(item => item.format !== 'link');
  const nonLinksAsObject = nonLinks.reduce<{
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
          <AboutField label="Links">
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

      {Object.keys(nonLinksAsObject).length > 0 && (
        <Grid item md={12} key="non__links" className={classes.values}>
          <AboutField label="Values">
            <StructuredMetadataTable dense metadata={nonLinksAsObject} />
          </AboutField>
        </Grid>
      )}
    </>
  );
};

export const WorkflowResult: React.FC<{
  assessedInstance: AssessedProcessInstanceDTO;
  className: string;
  cardClassName?: string;
}> = ({ assessedInstance, className, cardClassName }) => {
  const instance = assessedInstance.instance;
  const result = instance.workflowdata?.result;

  return (
    <InfoCard
      title="Results"
      subheader={
        <ResultMessage
          status={instance.state}
          error={instance.error}
          resultMessage={result?.message}
        />
      }
      divider={false}
      className={className}
      cardClassName={cardClassName}
    >
      <Grid container alignContent="flex-start">
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
