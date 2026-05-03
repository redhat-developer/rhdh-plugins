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

import { NotFoundError } from '@backstage/errors';
import { createWithRoute, notFound } from '../routeWrapper';
import type { RouteContext } from '../types';
import type { WorkflowConfigService } from '../../services/WorkflowConfigService';

export function registerVersionRoutes(
  ctx: RouteContext,
  workflowService: WorkflowConfigService,
): void {
  const { router, logger, sendRouteError, requireAdminAccess, getUserRef } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  router.get('/workflows/:id/versions', requireAdminAccess,
    withRoute(req => `List versions for workflow ${req.params.id}`, 'Failed to list workflow versions', async (req, res) => {
      res.json({ versions: await workflowService.getWorkflowVersions(req.params.id) });
    }),
  );

  router.get('/workflows/:id/versions/:version', requireAdminAccess,
    withRoute(req => `Get version ${req.params.version} of workflow ${req.params.id}`, 'Failed to get workflow version', async (req, res) => {
      try { res.json(await workflowService.getWorkflowVersion(req.params.id, parseInt(req.params.version, 10))); }
      catch (err) { if (err instanceof NotFoundError) { notFound(res, 'Workflow version'); return; } throw err; }
    }),
  );

  router.post('/workflows/:id/publish', requireAdminAccess,
    withRoute(req => `Publish workflow ${req.params.id}`, 'Failed to publish workflow', async (req, res) => {
      const user = await getUserRef(req);
      const { changelog } = req.body as { changelog?: string };
      try { res.json(await workflowService.publishWorkflow(req.params.id, user, changelog)); }
      catch (err) { if (err instanceof NotFoundError) { notFound(res, 'Workflow'); return; } throw err; }
    }),
  );

  router.post('/workflows/:id/restore/:version', requireAdminAccess,
    withRoute(req => `Restore workflow ${req.params.id} to version ${req.params.version}`, 'Failed to restore workflow version', async (req, res) => {
      const user = await getUserRef(req);
      try { res.json(await workflowService.restoreVersion(req.params.id, parseInt(req.params.version, 10), user)); }
      catch (err) { if (err instanceof NotFoundError) { notFound(res, 'Workflow version'); return; } throw err; }
    }),
  );
}
