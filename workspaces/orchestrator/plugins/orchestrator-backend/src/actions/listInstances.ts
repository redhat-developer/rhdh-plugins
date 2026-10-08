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
import { ConditionTransformer } from '@backstage/plugin-permission-node';

import {
  Filter,
  orchestratorWorkflowPermission,
  ProcessInstanceState,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { mapToProcessInstanceDTO } from '../service/api/mapping/V2Mappings';
import { OrchestratorService } from '../service/OrchestratorService';
import { OrchestratorFilters } from '../service/permission-rules';
import * as workflowAuth from '../service/workflowAuthorization';
import { Pagination } from '../types/pagination';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const createListInstancesAction = ({
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
    name: 'list-instances',
    title: 'List Workflow Instances',
    attributes: {
      readOnly: true,
    },
    description:
      'List Orchestrator workflow runs (instances) visible to the caller, ' +
      'optionally filtered by status. Callers without the ' +
      "'orchestrator.instanceAdminView' permission only see instances they " +
      'initiated themselves.',
    schema: {
      input: z =>
        z.object({
          status: z
            .nativeEnum(ProcessInstanceState)
            .optional()
            .describe('Filter instances by their current status'),
          limit: z
            .number()
            .int()
            .min(1)
            .max(MAX_LIMIT)
            .optional()
            .describe(
              `Maximum number of instances to return (1-${MAX_LIMIT}, default ${DEFAULT_LIMIT})`,
            ),
          offset: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe(
              'Number of instances to skip, for paging through results (default 0)',
            ),
        }),
      output: z =>
        z.object({
          instances: z.array(
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
            }),
          ),
        }),
    },
    action: async ({ input, credentials }) => {
      await workflowAuth.assertAnyWorkflowAccess(
        credentials,
        permissions,
        orchestratorWorkflowPermission,
      );

      const allWorkflowIds = orchestratorService.getWorkflowIds();
      const authorizedWorkflowIds =
        await workflowAuth.filterAuthorizedWorkflowIds(
          credentials,
          permissions,
          allWorkflowIds,
          conditionTransformer,
          logger,
        );

      if (authorizedWorkflowIds.length === 0) {
        return { output: { instances: [] } };
      }

      const isAdminView =
        await workflowAuth.isUserAuthorizedForInstanceAdminViewPermission(
          credentials,
          permissions,
        );

      let filter: Filter | undefined = input.status
        ? { field: 'state', operator: 'EQ', value: input.status }
        : undefined;

      if (!isAdminView) {
        const initiatorEntity = await workflowAuth.resolveInitiatorEntity(
          credentials,
          userInfo,
        );
        filter = workflowAuth.buildInstanceOwnershipFilter(
          initiatorEntity,
          filter,
        );
      }

      const pagination: Pagination = {
        limit: input.limit ?? DEFAULT_LIMIT,
        offset: input.offset ?? 0,
      };

      const rawInstances = await orchestratorService.fetchInstances({
        filter,
        workflowIds: authorizedWorkflowIds,
        pagination,
      });

      const instances = rawInstances
        .map(mapToProcessInstanceDTO)
        .map(instance => ({
          instanceId: instance.id,
          workflowId: instance.processId,
          workflowName: instance.processName,
          status: instance.state,
          startTime: instance.start,
          endTime: instance.end,
        }));

      return { output: { instances } };
    },
  });
};
