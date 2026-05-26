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

import { safeInt, clampLimit } from './sseRouteHelpers';
import type { SandboxRouteCtx } from './sandboxRouteContext';

export function registerSandboxSessionRoutes(ctx: SandboxRouteCtx): void {
  const {
    router,
    sandbox,
    withRoute,
    requireAdminAccess,
    checkIsAdmin,
    kagentiCfg,
    defaultLimit,
    maxLimit,
  } = ctx;

  router.get(
    '/kagenti/sandbox/:namespace/sessions',
    withRoute(
      'GET /kagenti/sandbox sessions',
      'Failed to list sessions',
      async (req, res) => {
        const result = await sandbox.listSessions(req.params.namespace, {
          limit: clampLimit(safeInt(req.query.limit), defaultLimit, maxLimit),
          offset: safeInt(req.query.offset),
          search: req.query.search as string | undefined,
          agentName: req.query.agent_name as string | undefined,
        });
        const isAdmin = await checkIsAdmin(req);
        let sessions = result.items ?? [];
        if (!isAdmin) {
          sessions = sessions.filter(
            s => s.visibility !== 'private' || s.visibility === undefined,
          );
        }
        res.json({ sessions, total: result.total });
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/sessions/:contextId',
    withRoute(
      'GET /kagenti/sandbox session detail',
      'Failed to get session',
      async (req, res) => {
        const result = await sandbox.getSession(
          req.params.namespace,
          req.params.contextId,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/sessions/:contextId/chain',
    withRoute(
      'GET /kagenti/sandbox session chain',
      'Failed to get session chain',
      async (req, res) => {
        const result = await sandbox.getSessionChain(
          req.params.namespace,
          req.params.contextId,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/sessions/:contextId/history',
    withRoute(
      'GET /kagenti/sandbox session history',
      'Failed to get session history',
      async (req, res) => {
        const result = await sandbox.getSessionHistory(
          req.params.namespace,
          req.params.contextId,
        );
        res.json(result);
      },
    ),
  );

  router.delete(
    '/kagenti/sandbox/:namespace/sessions/:contextId',
    withRoute(
      'DELETE /kagenti/sandbox session',
      'Failed to delete session',
      async (req, res) => {
        await sandbox.deleteSession(req.params.namespace, req.params.contextId);
        res.status(204).send();
      },
    ),
  );

  router.put(
    '/kagenti/sandbox/:namespace/sessions/:contextId/rename',
    withRoute(
      'PUT /kagenti/sandbox session rename',
      'Failed to rename session',
      async (req, res) => {
        const result = await sandbox.renameSession(
          req.params.namespace,
          req.params.contextId,
          req.body.title,
        );
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/sessions/:contextId/kill',
    withRoute(
      'POST /kagenti/sandbox session kill',
      'Failed to kill session',
      async (req, res) => {
        const result = await sandbox.killSession(
          req.params.namespace,
          req.params.contextId,
        );
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/sessions/:contextId/approve',
    requireAdminAccess,
    withRoute(
      'POST /kagenti/sandbox session approve',
      'Failed to approve session',
      async (req, res) => {
        const result = await sandbox.approveSession(
          req.params.namespace,
          req.params.contextId,
        );
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/sessions/:contextId/deny',
    requireAdminAccess,
    withRoute(
      'POST /kagenti/sandbox session deny',
      'Failed to deny session',
      async (req, res) => {
        const result = await sandbox.denySession(
          req.params.namespace,
          req.params.contextId,
        );
        res.json(result);
      },
    ),
  );

  router.put(
    '/kagenti/sandbox/:namespace/sessions/:contextId/visibility',
    withRoute(
      'PUT /kagenti/sandbox session visibility',
      'Failed to set visibility',
      async (req, res) => {
        const result = await sandbox.setVisibility(
          req.params.namespace,
          req.params.contextId,
          req.body.visibility,
        );
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/sandbox/:namespace/cleanup',
    requireAdminAccess,
    withRoute(
      'POST /kagenti/sandbox cleanup',
      'Failed to cleanup sessions',
      async (req, res) => {
        const ttl =
          safeInt(req.query.ttl_minutes) ??
          kagentiCfg.sandbox.sessionTtlMinutes;
        const result = await sandbox.cleanupSessions(req.params.namespace, ttl);
        res.json(result);
      },
    ),
  );
}
