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

import type {
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import type { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { ConditionTransformer } from '@backstage/plugin-permission-node';

import { orchestratorWorkflowPermission } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { OrchestratorService } from '../service/OrchestratorService';
import { OrchestratorFilters } from '../service/permission-rules';
import { resolveWorkflowDefinition } from '../service/resolveWorkflowDefinition';
import * as workflowAuth from '../service/workflowAuthorization';

export const createGetWorkflowSchemaAction = ({
  actionsRegistry,
  permissions,
  orchestratorService,
  conditionTransformer,
  logger,
}: {
  actionsRegistry: ActionsRegistryService;
  permissions: PermissionsService;
  orchestratorService: OrchestratorService;
  conditionTransformer: ConditionTransformer<OrchestratorFilters>;
  logger: LoggerService;
}) => {
  actionsRegistry.register({
    name: 'get-workflow-schema',
    title: 'Get Workflow Input Schema',
    attributes: {
      readOnly: true,
    },
    description:
      'Fetch the input JSON schema (required and optional parameters) for an ' +
      'Orchestrator workflow definition. Call this before execute-workflow ' +
      'to learn what inputs the workflow accepts.',
    schema: {
      input: z =>
        z.object({
          workflowId: z
            .string()
            .describe('The workflow definition ID to fetch the schema for'),
        }),
      output: z =>
        z.object({
          workflowId: z.string().describe('The workflow definition ID'),
          inputSchema: z
            .record(z.string(), z.unknown())
            .describe(
              "The workflow's input JSON schema, or an empty object if the " +
                'workflow does not declare one',
            ),
        }),
    },
    action: async ({ input, credentials }) => {
      const { workflowId } = input;

      await workflowAuth.authorizeWorkflowAccess(
        credentials,
        workflowId,
        orchestratorWorkflowPermission,
        conditionTransformer,
        permissions,
        logger,
      );

      const { serviceUrl, definition } = await resolveWorkflowDefinition(
        orchestratorService,
        workflowId,
      );

      if (!definition.dataInputSchema) {
        return { output: { workflowId, inputSchema: {} } };
      }

      const infoWithSchema =
        await orchestratorService.fetchWorkflowInfoOnService({
          definitionId: workflowId,
          serviceUrl,
        });

      return {
        output: {
          workflowId,
          inputSchema:
            (infoWithSchema?.inputSchema as Record<string, unknown>) ?? {},
        },
      };
    },
  });
};
