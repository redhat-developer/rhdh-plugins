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

import type { WorkflowTestSuite } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { createWithRoute } from '../routeWrapper';
import type { RouteContext } from '../types';
import type { WorkflowConfigService } from '../../services/WorkflowConfigService';

export function registerTestSuiteRoutes(
  ctx: RouteContext,
  workflowService: WorkflowConfigService,
): void {
  const { router, logger, sendRouteError, requireAdminAccess, getUserRef } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  router.get('/workflows/:id/test-suites', requireAdminAccess,
    withRoute(req => `List test suites for workflow ${req.params.id}`, 'Failed to list test suites', async (req, res) => {
      res.json({ testSuites: await workflowService.getTestSuites(req.params.id) });
    }),
  );

  router.put('/workflows/:id/test-suites/:suiteId', requireAdminAccess,
    withRoute(req => `Save test suite ${req.params.suiteId}`, 'Failed to save test suite', async (req, res) => {
      const user = await getUserRef(req);
      const suite = req.body as WorkflowTestSuite;
      suite.id = req.params.suiteId;
      suite.workflowId = req.params.id;
      res.json(await workflowService.saveTestSuite(suite, user));
    }),
  );

  router.delete('/workflows/:id/test-suites/:suiteId', requireAdminAccess,
    withRoute(req => `Delete test suite ${req.params.suiteId}`, 'Failed to delete test suite', async (req, res) => {
      const user = await getUserRef(req);
      await workflowService.deleteTestSuite(req.params.suiteId, user);
      res.json({ success: true });
    }),
  );

  router.get('/workflows/:id/evaluations', requireAdminAccess,
    withRoute(req => `List evaluations for workflow ${req.params.id}`, 'Failed to list evaluations', async (req, res) => {
      res.json({ evaluations: await workflowService.getEvaluations(req.params.id) });
    }),
  );
}
