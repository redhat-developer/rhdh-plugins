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

import type { SandboxRouteCtx } from './sandboxRouteContext';

export function registerSandboxSidecarRoutes(ctx: SandboxRouteCtx): void {
  const { router, sandbox, kagentiCfg, withRoute } = ctx;

  router.get(
    '/kagenti/sandbox/:namespace/sessions/:contextId/sidecars',
    withRoute(
      'GET /kagenti/sandbox sidecars',
      'Failed to list sidecars',
      async (req, res) => {
        const result = await sandbox.listSidecars(
          req.params.namespace,
          req.params.contextId,
        );
        res.json({ sidecars: Array.isArray(result) ? result : [] });
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/sessions/:contextId/sidecars/:type/enable',
    withRoute(
      'POST /kagenti/sandbox sidecar enable',
      'Failed to enable sidecar',
      async (req, res) => {
        const body = {
          ...req.body,
          auto_approve:
            req.body?.auto_approve ?? kagentiCfg.sandbox.sidecar.autoApprove,
        };
        const result = await sandbox.enableSidecar(
          req.params.namespace,
          req.params.contextId,
          req.params.type,
          body,
        );
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/sessions/:contextId/sidecars/:type/disable',
    withRoute(
      'POST /kagenti/sandbox sidecar disable',
      'Failed to disable sidecar',
      async (req, res) => {
        const result = await sandbox.disableSidecar(
          req.params.namespace,
          req.params.contextId,
          req.params.type,
        );
        res.json(result);
      },
    ),
  );

  router.put(
    '/kagenti/sandbox/:namespace/sessions/:contextId/sidecars/:type/config',
    withRoute(
      'PUT /kagenti/sandbox sidecar config',
      'Failed to update sidecar config',
      async (req, res) => {
        const result = await sandbox.updateSidecarConfig(
          req.params.namespace,
          req.params.contextId,
          req.params.type,
          req.body,
        );
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/sessions/:contextId/sidecars/:type/reset',
    withRoute(
      'POST /kagenti/sandbox sidecar reset',
      'Failed to reset sidecar',
      async (req, res) => {
        const result = await sandbox.resetSidecar(
          req.params.namespace,
          req.params.contextId,
          req.params.type,
        );
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/sessions/:contextId/sidecars/:type/approve/:msgId',
    withRoute(
      'POST /kagenti/sandbox sidecar approve',
      'Failed to approve sidecar',
      async (req, res) => {
        const result = await sandbox.approveSidecar(
          req.params.namespace,
          req.params.contextId,
          req.params.type,
          req.params.msgId,
        );
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/sessions/:contextId/sidecars/:type/deny/:msgId',
    withRoute(
      'POST /kagenti/sandbox sidecar deny',
      'Failed to deny sidecar',
      async (req, res) => {
        const result = await sandbox.denySidecar(
          req.params.namespace,
          req.params.contextId,
          req.params.type,
          req.params.msgId,
        );
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/sessions/:contextId/sidecars/:type/observations',
    async (req, res) => {
      const { namespace, contextId, type } = req.params;
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      const controller = new AbortController();
      req.on('close', () => controller.abort());

      try {
        await sandbox.streamObservations(
          namespace,
          contextId,
          type,
          (line: string) => {
            res.write(`data: ${line}\n\n`);
          },
          controller.signal,
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          ctx.logger.warn(
            `streamObservations error: ${err instanceof Error ? err.message : err}`,
          );
        }
      } finally {
        res.end();
      }
    },
  );
}
