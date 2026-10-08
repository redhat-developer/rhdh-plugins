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

import { OrchestratorService } from '../service/OrchestratorService';
import { OrchestratorFilters } from '../service/permission-rules';
import { createExecuteWorkflowAction } from './executeWorkflow';
import { createGetInstanceAction } from './getInstance';
import { createGetWorkflowSchemaAction } from './getWorkflowSchema';
import { createListInstancesAction } from './listInstances';
import { createListWorkflowsAction } from './listWorkflows';

export { createExecuteWorkflowAction } from './executeWorkflow';
export { createGetInstanceAction } from './getInstance';
export { createGetWorkflowSchemaAction } from './getWorkflowSchema';
export { createListInstancesAction } from './listInstances';
export { createListWorkflowsAction } from './listWorkflows';

/**
 * Registers all 5 Orchestrator MCP actions (RHIDP-14041): list-workflows,
 * get-workflow-schema, execute-workflow, list-instances, get-instance.
 */
export const createOrchestratorActions = (options: {
  actionsRegistry: ActionsRegistryService;
  permissions: PermissionsService;
  userInfo: UserInfoService;
  orchestratorService: OrchestratorService;
  conditionTransformer: ConditionTransformer<OrchestratorFilters>;
  logger: LoggerService;
}) => {
  createGetInstanceAction(options);
  createListWorkflowsAction(options);
  createGetWorkflowSchemaAction(options);
  createExecuteWorkflowAction(options);
  createListInstancesAction(options);
};
