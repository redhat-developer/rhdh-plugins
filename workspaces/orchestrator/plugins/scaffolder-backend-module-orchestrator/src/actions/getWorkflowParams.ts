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
import { DiscoveryApi } from '@backstage/plugin-permission-common';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';

import { isAxiosError } from 'axios';
import { dump } from 'js-yaml';

import { getOrchestratorApi, getRequestConfigOption } from './utils';

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

const indentString = (str: string, indent: number) =>
  indent ? str.replace(/^/gm, ' '.repeat(indent)) : str;

export function createGetWorkflowParamsAction(
  discoveryService: DiscoveryApi,
  authService: AuthService,
) {
  return createTemplateAction({
    id: 'orchestrator:workflow:get_params',
    description: 'Collect parameters of a SonataFlow workflow.',
    supportsDryRun: false,
    schema: {
      input: {
        workflow_id: z => z.string().describe('Workflow Id'),
        indent: z => z.number().optional().describe('Number of indents'),
      },
    },
    async handler(ctx) {
      const workflowId = ctx.input?.workflow_id;
      if (!workflowId) {
        throw new Error('Missing workflow_id required input parameter.');
      }

      const api = await getOrchestratorApi(discoveryService);
      const reqConfigOption = await getRequestConfigOption(authService, ctx);

      try {
        const { data: workflow } = await api.getWorkflowOverviewById(
          workflowId,
          reqConfigOption,
        );
        if (!workflow) {
          throw new Error(`Can not find workflow ${workflowId}`);
        }

        const { data: inputSchemaWrapper } =
          await api.getWorkflowInputSchemaById(
            workflowId,
            undefined,
            reqConfigOption,
          );
        const inputSchema: JsonObject | undefined =
          inputSchemaWrapper.inputSchema;

        ctx.output('title', workflow.name || workflowId);
        ctx.output('description', workflow.description || '');

        if (inputSchema?.properties) {
          let parametersYaml = dump(
            [
              // scaffolder expects an array on the top-level
              inputSchema,
            ],
            { indent: 2 },
          );
          parametersYaml = indentString(parametersYaml, ctx.input?.indent || 0);
          parametersYaml = `\n${parametersYaml}`;

          ctx.output('parameters', parametersYaml);
        } else {
          ctx.output('parameters', '{}');
        }
      } catch (err) {
        throw getError(err);
      }
    },
  });
}
