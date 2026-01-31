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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

import Grid from '@mui/material/Grid';
import type { JSONSchema7 } from 'json-schema';

import {
  AuthTokenDescriptor,
  InputSchemaResponseDTO,
  QUERY_PARAM_INSTANCE_ID,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';
import {
  OrchestratorForm,
  TranslationFunction,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-react';

import { orchestratorApiRef } from '../../api';
import { useOrchestratorAuth } from '../../hooks/useOrchestratorAuth';
import { useTranslation } from '../../hooks/useTranslation';
import {
  entityInstanceRouteRef,
  executeWorkflowRouteRef,
  workflowInstanceRouteRef,
  workflowRunsRouteRef,
} from '../../routes';
import { getErrorObject } from '../../utils/ErrorUtils';
import { BaseOrchestratorPage } from '../ui/BaseOrchestratorPage';
import MissingSchemaNotice from './MissingSchemaNotice';
import { getSchemaUpdater } from './schemaUpdater';

export const ExecuteWorkflowPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const targetEntity = searchParams.get('targetEntity');
  const orchestratorApi = useApi(orchestratorApiRef);
  const { authenticate } = useOrchestratorAuth();
  const { workflowId } = useRouteRefParams(executeWorkflowRouteRef);
  const [isExecuting, setIsExecuting] = useState(false);
  const [updateError, setUpdateError] = useState<Error>();
  const [instanceId] = useQueryParamState<string>(QUERY_PARAM_INSTANCE_ID);
  const navigate = useNavigate();
  const instanceLink = useRouteRef(workflowInstanceRouteRef);
  const entityInstanceLink = useRouteRef(entityInstanceRouteRef);
  const workflowRunsLink = useRouteRef(workflowRunsRouteRef);
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

  const [schema, setSchema] = useState<JSONSchema7 | undefined>();
  const [authTokenDescriptors, setAuthTokenDescriptors] = useState<
    AuthTokenDescriptor[]
  >([]);

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

  const [kind, namespace, name] = targetEntity?.split(/[:\/]/) || [];

  // The Kafka triggered workflows might not be available for a period of time, so it would be good to just go to that workflows runs page
  // the return value would have to have some identifier that it is not an error, but no workflow instance run id yet
  const handleExecute = useCallback(
    // eslint-disable-next-line consistent-return
    async (parameters: JsonObject) => {
      setUpdateError(undefined);
      try {
        setIsExecuting(true);
        const authTokens = await authenticate(authTokenDescriptors);
        const response = await orchestratorApi.executeWorkflow({
          workflowId,
          parameters,
          authTokens,
          targetEntity: targetEntity ?? undefined,
        });

        // Response Data id will be "kafkaEvent" if this was run as a CloudEvent and the workflow isnt ready yet
        // If this happens, just navigate to the main workflow runs page.
        if (response.data.id === 'kafkaEvent') {
          return navigate(workflowRunsLink({ workflowId: workflowId }));
        }
        const url = targetEntity
          ? entityInstanceLink({
              namespace,
              kind,
              name,
              workflowId: workflowId,
              instanceId: response.data.id,
            })
          : instanceLink({ instanceId: response.data.id });
        navigate(url);
      } catch (err) {
        setUpdateError(getErrorObject(err));
      } finally {
        setIsExecuting(false);
      }
    },
    [
      orchestratorApi,
      workflowId,
      navigate,
      instanceLink,
      authTokenDescriptors,
      authenticate,
      targetEntity,
      entityInstanceLink,
      kind,
      namespace,
      name,
      workflowRunsLink,
    ],
  );

  const error = responseError || workflowNameError;
  let pageContent;

  if (
    loading ||
    workflowNameLoading ||
    (!loading && value?.inputSchema && !schema) // wait for useEffect to setSchema
  ) {
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
          <InfoCard title={t('run.title')}>
            {!!schema ? (
              <OrchestratorForm
                schema={schema}
                updateSchema={updateSchema}
                handleExecute={handleExecute}
                isExecuting={isExecuting}
                initialFormData={initialFormData}
                setAuthTokenDescriptors={setAuthTokenDescriptors}
                t={t as unknown as TranslationFunction}
              />
            ) : (
              <MissingSchemaNotice
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
      typeLink={
        targetEntity
          ? `/catalog/${namespace}/${kind}/${name}/workflows`
          : '/orchestrator'
      }
    >
      {pageContent}
    </BaseOrchestratorPage>
  );
};
