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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from 'react-use';

import {
  InfoCard,
  Progress,
  ResponseErrorPanel,
  useQueryParamState,
} from '@backstage/core-components';
import {
  useApi,
  useRouteRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import type { JsonObject } from '@backstage/types';

import { Grid } from '@material-ui/core';
import { JSONSchema7 } from 'json-schema';

import {
  InputSchemaResponseDTO,
  QUERY_PARAM_ASSESSMENT_INSTANCE_ID,
  QUERY_PARAM_INSTANCE_ID,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';
import { OrchestratorForm } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-react';

import { orchestratorApiRef } from '../../api';
import {
  executeWorkflowRouteRef,
  workflowInstanceRouteRef,
} from '../../routes';
import { getErrorObject } from '../../utils/ErrorUtils';
import { BaseOrchestratorPage } from '../BaseOrchestratorPage';
import JsonTextAreaForm from './JsonTextAreaForm';
import { getSchemaUpdater } from './schemaUpdater';

export const ExecuteWorkflowPage = () => {
  const orchestratorApi = useApi(orchestratorApiRef);
  const { workflowId } = useRouteRefParams(executeWorkflowRouteRef);
  const [isExecuting, setIsExecuting] = useState(false);
  const [updateError, setUpdateError] = React.useState<Error>();
  const [instanceId] = useQueryParamState<string>(QUERY_PARAM_INSTANCE_ID);
  const [assessmentInstanceId] = useQueryParamState<string>(
    QUERY_PARAM_ASSESSMENT_INSTANCE_ID,
  );
  const navigate = useNavigate();
  const instanceLink = useRouteRef(workflowInstanceRouteRef);
  const {
    value,
    loading,
    error: responseError,
  } = useAsync(async (): Promise<InputSchemaResponseDTO> => {
    const res = await orchestratorApi.getWorkflowDataInputSchema(
      workflowId,
      assessmentInstanceId || instanceId,
    );
    return res.data;
  }, [orchestratorApi, workflowId]);

  const [schema, setSchema] = useState<JSONSchema7 | undefined>();
  useEffect(() => {
    setSchema(value?.inputSchema);
  }, [value]);
  const updateSchema = useMemo(
    () => getSchemaUpdater(schema, setSchema),
    [schema],
  );

  const initialFormData = value?.data ?? {};
  const {
    value: workflowName,
    loading: workflowNameLoading,
    error: workflowNameError,
  } = useAsync(async (): Promise<string> => {
    const res = await orchestratorApi.getWorkflowOverview(workflowId);
    return res.data.name || '';
  }, [orchestratorApi, workflowId]);

  const handleExecute = useCallback(
    async (parameters: JsonObject) => {
      setUpdateError(undefined);
      try {
        setIsExecuting(true);
        const response = await orchestratorApi.executeWorkflow({
          workflowId,
          parameters,
          businessKey: assessmentInstanceId,
        });
        navigate(instanceLink({ instanceId: response.data.id }));
      } catch (err) {
        setUpdateError(getErrorObject(err));
      } finally {
        setIsExecuting(false);
      }
    },
    [orchestratorApi, workflowId, navigate, instanceLink, assessmentInstanceId],
  );

  const error = responseError || workflowNameError;
  let pageContent;

  if (loading || workflowNameLoading) {
    pageContent = <Progress />;
  } else if (error) {
    pageContent = <ResponseErrorPanel error={error} />;
  } else {
    pageContent = (
      <Grid container spacing={2} direction="column" wrap="nowrap">
        {updateError && (
          <Grid item>
            <ResponseErrorPanel error={updateError} />
          </Grid>
        )}
        <Grid item>
          <InfoCard title="Run workflow">
            {!!schema ? (
              <OrchestratorForm
                schema={schema}
                updateSchema={updateSchema}
                handleExecute={handleExecute}
                isExecuting={isExecuting}
                isDataReadonly={!!assessmentInstanceId}
                initialFormData={initialFormData}
              />
            ) : (
              <JsonTextAreaForm
                handleExecute={handleExecute}
                isExecuting={isExecuting}
              />
            )}
          </InfoCard>
        </Grid>
      </Grid>
    );
  }

  return (
    <BaseOrchestratorPage
      noPadding={workflowNameLoading}
      title={workflowName}
      type="Workflows"
      typeLink="/orchestrator"
    >
      {pageContent}
    </BaseOrchestratorPage>
  );
};
