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
import { useKafkaEnabled } from '../../hooks/useKafkaEnabled';
import { useOrchestratorAuth } from '../../hooks/useOrchestratorAuth';
import { useTranslation } from '../../hooks/useTranslation';
import {
  entityInstanceRouteRef,
  entityWorkflowRouteRef,
  executeWorkflowRouteRef,
  workflowInstanceRouteRef,
  workflowRunsRouteRef,
} from '../../routes';
import { getErrorObject } from '../../utils/ErrorUtils';
import { buildUrl } from '../../utils/UrlUtils';
import { BaseOrchestratorPage } from '../ui/BaseOrchestratorPage';
import MissingSchemaNotice from './MissingSchemaNotice';
import { mergeQueryParamsIntoFormData } from './queryParamsToFormData';
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
  const kafkaEnabled = useKafkaEnabled();

  const navigate = useNavigate();
  const instanceLink = useRouteRef(workflowInstanceRouteRef);
  const entityInstanceLink = useRouteRef(entityInstanceRouteRef);
  const entityWorkflowLink = useRouteRef(entityWorkflowRouteRef);
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

  const initialFormData = useMemo(() => {
    const baseData = value?.data ?? {};
    if (!schema) {
      return baseData;
    }
    return mergeQueryParamsIntoFormData(schema, searchParams, baseData);
  }, [schema, value?.data, searchParams]);
  const {
    value: workflowName,
    loading: workflowNameLoading,
    error: workflowNameError,
  } = useAsync(async (): Promise<string> => {
    const res = await orchestratorApi.getWorkflowOverview(workflowId);
    return res.data.name || '';
  }, [orchestratorApi, workflowId]);

  const [kind, namespace, name] = targetEntity?.split(/[:\/]/) || [];

  const executeWorkflow = useCallback(
    async (parameters: JsonObject, isEvent: boolean) => {
      setUpdateError(undefined);
      try {
        setIsExecuting(true);
        const authTokens = await authenticate(authTokenDescriptors);
        const executeParameters = isEvent
          ? { ...parameters, isEvent: true }
          : parameters;
        const response = await orchestratorApi.executeWorkflow({
          workflowId,
          parameters: executeParameters,
          authTokens,
          targetEntity: targetEntity ?? undefined,
        });
        if (response.data.id === 'kafkaEvent') {
          const redirectUrl = targetEntity
            ? entityWorkflowLink({ namespace, kind, name, workflowId })
            : workflowRunsLink({ workflowId });
          navigate(buildUrl(redirectUrl, { eventTriggered: 'true' }));
          return;
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
      entityWorkflowLink,
      workflowRunsLink,
      kind,
      namespace,
      name,
    ],
  );
  const handleExecute = useCallback(
    async (parameters: JsonObject) => {
      await executeWorkflow(parameters, false);
    },
    [executeWorkflow],
  );
  const handleExecuteAsEvent = useCallback(
    async (parameters: JsonObject) => {
      await executeWorkflow(parameters, true);
    },
    [executeWorkflow],
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
                handleExecuteAsEvent={
                  kafkaEnabled ? handleExecuteAsEvent : undefined
                }
                isExecuting={isExecuting}
                initialFormData={initialFormData}
                setAuthTokenDescriptors={setAuthTokenDescriptors}
                t={t as unknown as TranslationFunction}
                executeLabel={t('common.run')}
                executeAsEventLabel={
                  kafkaEnabled ? t('workflow.buttons.runAsEvent') : undefined
                }
              />
            ) : (
              <MissingSchemaNotice
                handleExecute={handleExecute}
                handleExecuteAsEvent={
                  kafkaEnabled ? handleExecuteAsEvent : undefined
                }
                executeAsEventLabel={
                  kafkaEnabled ? t('workflow.buttons.runAsEvent') : undefined
                }
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
