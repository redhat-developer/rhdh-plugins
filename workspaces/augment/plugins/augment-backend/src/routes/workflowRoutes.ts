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

import type { NodeExecutionRecord } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { RouteContext } from './types';
import type { WorkflowConfigService } from '../services/WorkflowConfigService';
import type { AdminConfigService } from '../services/AdminConfigService';
import { registerCrudRoutes } from './workflow/crud';
import { registerVersionRoutes } from './workflow/versions';
import { registerTestSuiteRoutes } from './workflow/testSuites';
import { registerExecutionRoutes } from './workflow/execution';
import { registerEvaluationRoutes } from './evaluationRoutes';
import { ResponsesApiClient } from '../providers/responses-api/client/ResponsesApiClient';
import { WorkflowExecutor } from '../providers/llamastack/workflow/WorkflowExecutor';
import { resolveLlamaStackConfig } from './resolveWorkflowConfig';

/**
 * Registers all workflow builder REST endpoints by delegating to
 * focused sub-modules for CRUD, versioning, test suites, and execution.
 */
export function registerWorkflowRoutes(
  ctx: RouteContext,
  workflowService: WorkflowConfigService,
  adminConfig: AdminConfigService,
): void {
  registerCrudRoutes(ctx, workflowService);
  registerVersionRoutes(ctx, workflowService);
  registerTestSuiteRoutes(ctx, workflowService);
  registerExecutionRoutes(ctx, workflowService, adminConfig);

  registerEvaluationRoutes(ctx, {
    workflowService,
    adminConfig,
    runWorkflow: async (workflowId: string, input: string) => {
      const { url, model, skipTls } = await resolveLlamaStackConfig(ctx, adminConfig);
      const client = new ResponsesApiClient({ baseUrl: url, skipTlsVerify: skipTls }, ctx.logger);
      const workflow = await workflowService.getWorkflow(workflowId);
      const executor = new WorkflowExecutor(ctx.logger, client, model);
      const result = await executor.execute(workflow, input);
      return {
        response: typeof result.finalOutput === 'string' ? result.finalOutput : JSON.stringify(result.finalOutput),
        trace: result.trace as unknown as NodeExecutionRecord[],
        durationMs: result.totalDurationMs,
      };
    },
  });
}
