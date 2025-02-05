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
import { AuthService } from '@backstage/backend-plugin-api';
import { parseEntityRef } from '@backstage/catalog-model';
import { DiscoveryApi } from '@backstage/plugin-permission-common/index';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';

import { isAxiosError } from 'axios';

import { getOrchestratorApi, getRequestConfigOption } from './utils';

type RunWorkflowTemplateActionInput = { parameters: JsonObject };
type RunWorkflowTemplateActionOutput = { instanceUrl: string };

const getError = (err: unknown): Error => {
  if (
    isAxiosError<{ error: { message: string; name: string } }>(err) &&
    err.response?.data?.error?.message
  ) {
    const error = new Error(err.response?.data?.error?.message);
    error.name = err.response?.data?.error?.name || 'Error';
    return error;
  }
  return err as Error;
};

export const createRunWorkflowAction = (
  discoveryService: DiscoveryApi,
  authService: AuthService,
) =>
  createTemplateAction<
    RunWorkflowTemplateActionInput,
    RunWorkflowTemplateActionOutput
  >({
    id: 'orchestrator:workflow:run',
    description: 'Run a SonataFlow workflow.',
    supportsDryRun: true,
    schema: {
      input: {
        required: ['parameters'],
        type: 'object',
        properties: {
          parameters: {
            type: 'object',
            title: 'Parameters',
            description: 'The workflow parameters.',
          },
        },
      },
    },
    async handler(ctx) {
      const entity = ctx.templateInfo?.entityRef;
      if (!entity) {
        throw new Error('No template entity');
      }

      const api = await getOrchestratorApi(discoveryService);
      const reqConfigOption = await getRequestConfigOption(authService, ctx);

      // If this is a dry run, log and return
      if (ctx.isDryRun) {
        ctx.logger.info(`Dry run complete`);
        return;
      }

      try {
        const { data } = await api.executeWorkflow(
          parseEntityRef(entity).name,
          { inputData: ctx.input.parameters },
          undefined,
          reqConfigOption,
        );
        ctx.output('instanceUrl', `/orchestrator/instances/${data.id}`);
      } catch (err) {
        throw getError(err);
      }
    },
  });
