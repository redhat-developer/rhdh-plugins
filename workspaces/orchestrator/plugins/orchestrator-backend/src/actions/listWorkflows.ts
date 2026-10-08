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

import {
  orchestratorWorkflowPermission,
  ProcessInstanceState,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { OrchestratorService } from '../service/OrchestratorService';
import { OrchestratorFilters } from '../service/permission-rules';
import * as workflowAuth from '../service/workflowAuthorization';
import { Pagination } from '../types/pagination';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const createListWorkflowsAction = ({
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
    name: 'list-workflows',
    title: 'List Workflows',
    attributes: {
      readOnly: true,
    },
    description:
      'List the Orchestrator workflow definitions visible to the caller, ' +
      'optionally filtered by name (case-insensitive substring match) ' +
      "and/or the workflow's last run status.",
    schema: {
      input: z =>
        z.object({
          name: z
            .string()
            .optional()
            .describe(
              'Filter workflows whose name contains this substring (case-insensitive)',
            ),
          status: z
            .nativeEnum(ProcessInstanceState)
            .optional()
            .describe("Filter workflows by their last run's status"),
          limit: z
            .number()
            .int()
            .min(1)
            .max(MAX_LIMIT)
            .optional()
            .describe(
              `Maximum number of workflows to return (1-${MAX_LIMIT}, default ${DEFAULT_LIMIT})`,
            ),
          offset: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe(
              'Number of workflows to skip, for paging through results (default 0)',
            ),
        }),
      output: z =>
        z.object({
          workflows: z.array(
            z.object({
              workflowId: z.string().describe('The workflow definition ID'),
              name: z
                .string()
                .optional()
                .describe('The human-readable workflow name'),
              status: z
                .string()
                .optional()
                .describe("The workflow's last run status"),
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

      const pagination: Pagination = {
        limit: input.limit ?? DEFAULT_LIMIT,
        offset: input.offset ?? 0,
      };

      const overviews =
        (await orchestratorService.fetchWorkflowOverviews({ pagination })) ??
        [];

      const authorizedIds = new Set(
        await workflowAuth.filterAuthorizedWorkflowIds(
          credentials,
          permissions,
          overviews.map(overview => overview.workflowId),
          conditionTransformer,
          logger,
        ),
      );

      const workflows = overviews
        .filter(overview => authorizedIds.has(overview.workflowId))
        .filter(
          overview =>
            !input.name ||
            overview.name?.toLowerCase().includes(input.name.toLowerCase()),
        )
        .filter(
          overview => !input.status || overview.lastRunStatus === input.status,
        )
        .map(overview => ({
          workflowId: overview.workflowId,
          name: overview.name,
          status: overview.lastRunStatus,
        }));

      return { output: { workflows } };
    },
  });
};
