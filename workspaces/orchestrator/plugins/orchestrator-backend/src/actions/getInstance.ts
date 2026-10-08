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
import { NotFoundError } from '@backstage/errors';
import { ConditionTransformer } from '@backstage/plugin-permission-node';

import { orchestratorWorkflowPermission } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { mapToProcessInstanceDTO } from '../service/api/mapping/V2Mappings';
import { OrchestratorService } from '../service/OrchestratorService';
import { OrchestratorFilters } from '../service/permission-rules';
import * as workflowAuth from '../service/workflowAuthorization';

export const createGetInstanceAction = ({
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
    name: 'get-instance',
    title: 'Get Workflow Instance',
    attributes: {
      readOnly: true,
    },
    description:
      'Fetch a single Orchestrator workflow run (instance) by its instance ID, ' +
      'returning its workflow name, status, start time, end time, and output data.',
    schema: {
      input: z =>
        z.object({
          instanceId: z
            .string()
            .describe('The workflow instance (process) ID to fetch'),
        }),
      output: z =>
        z.object({
          instanceId: z.string().describe('The workflow instance ID'),
          workflowId: z.string().describe('The workflow definition ID'),
          workflowName: z
            .string()
            .optional()
            .describe('The human-readable workflow name'),
          status: z.string().optional().describe('The instance status'),
          startTime: z
            .string()
            .optional()
            .describe('When the instance started, as an ISO timestamp'),
          endTime: z
            .string()
            .optional()
            .describe('When the instance ended, as an ISO timestamp'),
          output: z
            .record(z.string(), z.unknown())
            .optional()
            .describe('The workflow output data'),
        }),
    },
    action: async ({ input, credentials }) => {
      const rawInstance = await orchestratorService.fetchInstance({
        instanceId: input.instanceId,
      });

      if (!rawInstance) {
        throw new NotFoundError(`Instance "${input.instanceId}" not found`);
      }

      const instance = mapToProcessInstanceDTO(rawInstance);
      const workflowId = instance.processId;

      await workflowAuth.authorizeWorkflowAccess(
        credentials,
        workflowId,
        orchestratorWorkflowPermission,
        conditionTransformer,
        permissions,
        logger,
      );

      await workflowAuth.assertInstanceOwnership(
        credentials,
        permissions,
        userInfo,
        instance,
        input.instanceId,
      );

      return {
        output: {
          instanceId: instance.id,
          workflowId: instance.processId,
          workflowName: instance.processName,
          status: instance.state,
          startTime: instance.start,
          endTime: instance.end,
          output: instance.workflowdata as Record<string, unknown> | undefined,
        },
      };
    },
  });
};
