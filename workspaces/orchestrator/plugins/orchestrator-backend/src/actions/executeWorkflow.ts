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
  UserInfoService,
} from '@backstage/backend-plugin-api';
import type { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { InputError, ServiceUnavailableError } from '@backstage/errors';
import { ConditionTransformer } from '@backstage/plugin-permission-node';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { orchestratorWorkflowUsePermission } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { OrchestratorService } from '../service/OrchestratorService';
import { OrchestratorFilters } from '../service/permission-rules';
import { resolveWorkflowDefinition } from '../service/resolveWorkflowDefinition';
import * as workflowAuth from '../service/workflowAuthorization';

const PENDING_STATUS = 'PENDING';

export const createExecuteWorkflowAction = ({
  actionsRegistry,
  permissions,
  userInfo,
  orchestratorService,
  conditionTransformer,
  logger,
}: {
  actionsRegistry: ActionsRegistryService;
  permissions: PermissionsService;
  userInfo: UserInfoService;
  orchestratorService: OrchestratorService;
  conditionTransformer: ConditionTransformer<OrchestratorFilters>;
  logger: LoggerService;
}) => {
  actionsRegistry.register({
    name: 'execute-workflow',
    title: 'Execute Workflow',
    attributes: {
      readOnly: false,
      destructive: true,
    },
    description:
      'Execute (start a run of) an Orchestrator workflow with the given ' +
      'inputs, returning the new instance ID and its initial status. ' +
      'Call get-workflow-schema first to learn what inputs the workflow ' +
      'expects.',
    schema: {
      input: z =>
        z.object({
          workflowId: z
            .string()
            .describe('The workflow definition ID to execute'),
          inputs: z
            .record(z.string(), z.unknown())
            .describe(
              "The workflow's input parameters, validated against its " +
                'input schema (see get-workflow-schema)',
            ),
        }),
      output: z =>
        z.object({
          instanceId: z.string().describe('The new workflow instance ID'),
          status: z.string().describe('The instance status after execution'),
        }),
    },
    action: async ({ input, credentials }) => {
      const { workflowId, inputs } = input;

      await workflowAuth.authorizeWorkflowAccess(
        credentials,
        workflowId,
        orchestratorWorkflowUsePermission,
        conditionTransformer,
        permissions,
        logger,
      );

      const { serviceUrl, definition } = await resolveWorkflowDefinition(
        orchestratorService,
        workflowId,
      );

      if (definition.dataInputSchema) {
        const infoWithSchema =
          await orchestratorService.fetchWorkflowInfoOnService({
            definitionId: workflowId,
            serviceUrl,
          });

        if (infoWithSchema?.inputSchema) {
          const ajv = addFormats(new Ajv({ allErrors: true, strict: false }));
          const validate = ajv.compile(infoWithSchema.inputSchema);

          if (!validate(inputs)) {
            throw new InputError(
              `Invalid inputs for workflow "${workflowId}": ${ajv.errorsText(
                validate.errors,
              )}`,
            );
          }
        }
      }

      const { userEntityRef: initiatorEntity } =
        await userInfo.getUserInfo(credentials);

      const executionResponse = await orchestratorService.executeWorkflow({
        definitionId: workflowId,
        serviceUrl,
        inputData: {
          workflowdata: inputs,
          initiatorEntity,
        },
        // MCP actions have no raw bearer token to pass through; workflows
        // that call back into Backstage as the user are a known Phase 1
        // limitation (see plan section 5).
        backstageToken: undefined,
      });

      if (!executionResponse) {
        throw new ServiceUnavailableError(
          `Failed to execute workflow "${workflowId}"`,
        );
      }

      const instanceId = executionResponse.id;

      // Best-effort: report the real initial status if the instance is
      // already indexed; fall back to a generic PENDING status rather than
      // failing the whole action on a timing race.
      let status: string = PENDING_STATUS;
      try {
        const instance = await orchestratorService.fetchInstance({
          instanceId,
        });
        if (instance?.state) {
          status = instance.state;
        }
      } catch (error) {
        logger.warn(
          `Failed to fetch initial status for instance "${instanceId}": ${error}`,
        );
      }

      return { output: { instanceId, status } };
    },
  });
};
