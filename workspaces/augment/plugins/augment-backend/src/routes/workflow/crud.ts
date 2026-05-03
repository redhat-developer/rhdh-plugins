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

import type { WorkflowDefinition } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { InputError, NotFoundError } from '@backstage/errors';
import { createWithRoute, notFound } from '../routeWrapper';
import type { RouteContext } from '../types';
import type { WorkflowConfigService } from '../../services/WorkflowConfigService';

export function registerCrudRoutes(
  ctx: RouteContext,
  workflowService: WorkflowConfigService,
): void {
  const { router, logger, sendRouteError, requireAdminAccess, getUserRef } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  router.get('/workflows', requireAdminAccess,
    withRoute('List workflows', 'Failed to list workflows', async (_req, res) => {
      res.json({ workflows: await workflowService.listWorkflows() });
    }),
  );

  router.get('/workflows/:id', requireAdminAccess,
    withRoute(req => `Get workflow ${req.params.id}`, 'Failed to get workflow', async (req, res) => {
      try { res.json(await workflowService.getWorkflow(req.params.id)); }
      catch (err) { if (err instanceof NotFoundError) { notFound(res, 'Workflow'); return; } throw err; }
    }),
  );

  router.post('/workflows', requireAdminAccess,
    withRoute('Create workflow', 'Failed to create workflow', async (req, res) => {
      const body = req.body as Partial<WorkflowDefinition>;
      if (!body.id || !body.name) throw new InputError('Workflow must have an id and name');
      const user = await getUserRef(req);
      res.status(201).json(await workflowService.createWorkflow(body as WorkflowDefinition, user));
    }),
  );

  router.put('/workflows/:id', requireAdminAccess,
    withRoute(req => `Update workflow ${req.params.id}`, 'Failed to update workflow', async (req, res) => {
      const user = await getUserRef(req);
      try { res.json(await workflowService.updateWorkflow(req.params.id, req.body as Partial<WorkflowDefinition>, user)); }
      catch (err) { if (err instanceof NotFoundError) { notFound(res, 'Workflow'); return; } throw err; }
    }),
  );

  router.delete('/workflows/:id', requireAdminAccess,
    withRoute(req => `Delete workflow ${req.params.id}`, 'Failed to delete workflow', async (req, res) => {
      const user = await getUserRef(req);
      try { await workflowService.deleteWorkflow(req.params.id, user); res.json({ success: true }); }
      catch (err) { if (err instanceof NotFoundError) { notFound(res, 'Workflow'); return; } throw err; }
    }),
  );
}
