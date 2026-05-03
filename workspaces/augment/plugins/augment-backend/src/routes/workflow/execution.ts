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

import { InputError, NotFoundError } from '@backstage/errors';
import { createWithRoute, notFound } from '../routeWrapper';
import type { RouteContext } from '../types';
import type { WorkflowConfigService } from '../../services/WorkflowConfigService';
import type { AdminConfigService } from '../../services/AdminConfigService';
import { ResponsesApiClient } from '../../providers/responses-api/client/ResponsesApiClient';
import { WorkflowExecutor } from '../../providers/llamastack/workflow/WorkflowExecutor';
import { resolveLlamaStackConfig } from '../resolveWorkflowConfig';

async function buildClient(ctx: RouteContext, adminConfig: AdminConfigService) {
  const { url, model, skipTls } = await resolveLlamaStackConfig(ctx, adminConfig);
  const client = new ResponsesApiClient({ baseUrl: url, skipTlsVerify: skipTls }, ctx.logger);
  return { client, defaultModel: model };
}

export function registerExecutionRoutes(
  ctx: RouteContext,
  workflowService: WorkflowConfigService,
  adminConfig: AdminConfigService,
): void {
  const { router, logger, sendRouteError, requireAdminAccess } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  router.post('/workflows/:id/run', requireAdminAccess,
    withRoute(req => `Run workflow ${req.params.id}`, 'Failed to run workflow', async (req, res) => {
      const { input } = req.body as { input: string };
      if (!input) throw new InputError('Input is required');

      try {
        const workflow = await workflowService.getWorkflow(req.params.id);
        const { client, defaultModel } = await buildClient(ctx, adminConfig);
        const executor = new WorkflowExecutor(logger, client, defaultModel);
        const result = await executor.execute(workflow, input);
        res.json({
          response: result.finalOutput,
          trace: result.trace,
          state: result.state,
          totalDurationMs: result.totalDurationMs,
        });
      } catch (err) {
        if (err instanceof NotFoundError) { notFound(res, 'Workflow'); return; }
        throw err;
      }
    }),
  );

  router.post('/workflows/:id/run/stream', requireAdminAccess, async (req, res) => {
    const { input } = req.body as { input: string };
    if (!input) { res.status(400).json({ error: 'Input is required' }); return; }

    try {
      const workflow = await workflowService.getWorkflow(req.params.id);
      const { client, defaultModel } = await buildClient(ctx, adminConfig);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const abortController = new AbortController();
      req.on('close', () => abortController.abort());

      const executor = new WorkflowExecutor(logger, client, defaultModel);
      await executor.executeStream(workflow, input,
        event => { if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`); },
        abortController.signal,
      );

      if (!res.writableEnded) { res.write('data: [DONE]\n\n'); res.end(); }
    } catch (err) {
      if (!res.headersSent) {
        if (err instanceof NotFoundError) { notFound(res, 'Workflow'); }
        else { res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' }); }
      } else if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', data: { message: err instanceof Error ? err.message : 'Unknown error' } })}\n\n`);
        res.end();
      }
    }
  });
}
