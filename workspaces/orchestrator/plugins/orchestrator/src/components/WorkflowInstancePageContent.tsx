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

import React from 'react';
import { useAsync } from 'react-use';

import { Content, InfoCard } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import { Grid, makeStyles } from '@material-ui/core';
import moment from 'moment';

import {
  AssessedProcessInstanceDTO,
  InputSchemaResponseDTO,
  ProcessInstanceDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../src/api/api';
import { VALUE_UNAVAILABLE } from '../constants';
import { WorkflowInputs } from './WorkflowInputs';
import { WorkflowProgress } from './WorkflowProgress';
import { WorkflowResult } from './WorkflowResult';
import { WorkflowRunDetail } from './WorkflowRunDetail';
import { WorkflowRunDetails } from './WorkflowRunDetails';

export const mapProcessInstanceToDetails = (
  instance: ProcessInstanceDTO,
): WorkflowRunDetail => {
  const start = instance.start ? moment(instance.start) : undefined;
  let duration: string = VALUE_UNAVAILABLE;
  if (start && instance.end) {
    const end = moment(instance.end);
    duration = moment.duration(start.diff(end)).humanize();
  }
  const started = start?.toDate().toLocaleString() ?? VALUE_UNAVAILABLE;

  return {
    id: instance.id,
    processName: instance.processName || VALUE_UNAVAILABLE,
    workflowId: instance.processId,
    start: started,
    duration,
    category: instance.category,
    state: instance.state,
    description: instance.description,
  };
};

const useStyles = makeStyles(() => ({
  topRowCard: () => ({
    height: '21rem',
    overflow: 'auto',
  }),
  bottomRowCard: {
    height: '42rem',
  },
  autoOverflow: { overflow: 'auto' },
  recommendedLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  recommendedLabel: { margin: '0 0.25rem' },
}));

export const WorkflowInstancePageContent: React.FC<{
  assessedInstance: AssessedProcessInstanceDTO;
}> = ({ assessedInstance }) => {
  const styles = useStyles();
  const orchestratorApi = useApi(orchestratorApiRef);

  const details = React.useMemo(
    () => mapProcessInstanceToDetails(assessedInstance.instance),
    [assessedInstance.instance],
  );

  const workflowdata = assessedInstance.instance?.workflowdata;
  let instanceVariables;
  if (workflowdata) {
    instanceVariables = {
      /* Since we are about to remove just the top-level property, shallow copy of the object is sufficient */
      ...workflowdata,
    };
    if (instanceVariables.hasOwnProperty('result')) {
      delete instanceVariables.result;
    }
  }
  const workflowId = assessedInstance.instance.processId;
  const instanceId = assessedInstance.instance.id;
  const {
    value,
    loading,
    error: responseError,
  } = useAsync(async (): Promise<InputSchemaResponseDTO> => {
    const res = await orchestratorApi.getWorkflowDataInputSchema(
      workflowId,
      instanceId,
    );
    return res.data;
  }, [orchestratorApi, workflowId]);

  return (
    <Content noPadding>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <InfoCard
            title="Details"
            divider={false}
            className={styles.topRowCard}
          >
            <WorkflowRunDetails
              details={details}
              assessedBy={assessedInstance.assessedBy}
            />
          </InfoCard>
        </Grid>

        <Grid item xs={6}>
          <WorkflowResult
            assessedInstance={assessedInstance}
            className={styles.topRowCard}
          />
        </Grid>

        <Grid item xs={6}>
          <WorkflowInputs
            className={styles.bottomRowCard}
            cardClassName={styles.autoOverflow}
            value={value}
            loading={loading}
            responseError={responseError}
          />
        </Grid>

        <Grid item xs={6}>
          <InfoCard
            title="Workflow progress"
            divider={false}
            className={styles.bottomRowCard}
            cardClassName={styles.autoOverflow}
          >
            <WorkflowProgress
              workflowError={assessedInstance.instance.error}
              workflowNodes={assessedInstance.instance.nodes}
              workflowStatus={assessedInstance.instance.state}
            />
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  );
};
WorkflowInstancePageContent.displayName = 'WorkflowInstancePageContent';
