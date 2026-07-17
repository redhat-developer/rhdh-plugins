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

/** Sandbox agent list and pod inspection routes. */
export function registerSandboxAgentRoutes(ctx: SandboxRouteCtx): void {
  const { router, sandbox, withRoute } = ctx;

  router.get(
    '/kagenti/sandbox/:namespace/agents',
    withRoute(
      'GET /kagenti/sandbox agents',
      'Failed to list sandbox agents',
      async (req, res) => {
        const result = await sandbox.listSandboxAgents(req.params.namespace);
        res.json({ agents: Array.isArray(result) ? result : [] });
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/agents/:name/pod-status',
    withRoute(
      'GET /kagenti/sandbox pod status',
      'Failed to get pod status',
      async (req, res) => {
        const result = await sandbox.getAgentPodStatus(
          req.params.namespace,
          req.params.name,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/agents/:name/metrics',
    withRoute(
      'GET /kagenti/sandbox pod metrics',
      'Failed to get pod metrics',
      async (req, res) => {
        const result = await sandbox.getPodMetrics(
          req.params.namespace,
          req.params.name,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/agents/:name/events',
    withRoute(
      'GET /kagenti/sandbox pod events',
      'Failed to get pod events',
      async (req, res) => {
        const result = await sandbox.getPodEvents(
          req.params.namespace,
          req.params.name,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/agent-card/:agent',
    withRoute(
      'GET /kagenti/sandbox agent card',
      'Failed to get sandbox agent card',
      async (req, res) => {
        const result = await sandbox.getSandboxAgentCard(
          req.params.namespace,
          req.params.agent,
        );
        res.json(result);
      },
    ),
  );
}

/** Sandbox create / delete / config / update routes. */
export function registerSandboxDeployRoutes(ctx: SandboxRouteCtx): void {
  const { router, sandbox, withRoute, requireAdminAccess } = ctx;

  router.post(
    '/kagenti/sandbox/:namespace/create',
    requireAdminAccess,
    withRoute(
      'POST /kagenti/sandbox create',
      'Failed to create sandbox',
      async (req, res) => {
        const result = await sandbox.createSandbox(
          req.params.namespace,
          req.body,
        );
        res.json(result);
      },
    ),
  );

  router.delete(
    '/kagenti/sandbox/:namespace/:name',
    requireAdminAccess,
    withRoute(
      'DELETE /kagenti/sandbox',
      'Failed to delete sandbox',
      async (req, res) => {
        const result = await sandbox.deleteSandbox(
          req.params.namespace,
          req.params.name,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/:name/config',
    withRoute(
      'GET /kagenti/sandbox config',
      'Failed to get sandbox config',
      async (req, res) => {
        const result = await sandbox.getSandboxConfig(
          req.params.namespace,
          req.params.name,
        );
        res.json(result);
      },
    ),
  );

  router.put(
    '/kagenti/sandbox/:namespace/:name',
    withRoute(
      'PUT /kagenti/sandbox update',
      'Failed to update sandbox',
      async (req, res) => {
        const result = await sandbox.updateSandbox(
          req.params.namespace,
          req.params.name,
          req.body,
        );
        res.json(result);
      },
    ),
  );
}

/** Per-session token usage routes. */
export function registerSandboxTokenUsageRoutes(ctx: SandboxRouteCtx): void {
  const { router, sandbox, withRoute } = ctx;

  router.get(
    '/kagenti/sandbox/:namespace/token-usage/sessions/:contextId',
    withRoute(
      'GET /kagenti/token-usage session',
      'Failed to get token usage',
      async (req, res) => {
        const result = await sandbox.getSessionTokenUsage(
          req.params.namespace,
          req.params.contextId,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/token-usage/sessions/:contextId/tree',
    withRoute(
      'GET /kagenti/token-usage tree',
      'Failed to get token usage tree',
      async (req, res) => {
        const result = await sandbox.getSessionTreeUsage(
          req.params.namespace,
          req.params.contextId,
        );
        res.json(result);
      },
    ),
  );
}

/** Namespace events and paginated tasks. */
export function registerSandboxEventsRoutes(ctx: SandboxRouteCtx): void {
  const { router, sandbox, withRoute, defaultLimit, maxLimit } = ctx;

  router.get(
    '/kagenti/sandbox/:namespace/events',
    withRoute(
      'GET /kagenti/sandbox events',
      'Failed to get events',
      async (req, res) => {
        const result = await sandbox.getEvents(
          req.params.namespace,
          req.query.context_id as string,
          {
            taskId: req.query.task_id as string | undefined,
            fromIndex: safeInt(req.query.from_index),
            limit: clampLimit(safeInt(req.query.limit), defaultLimit, maxLimit),
          },
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/tasks/paginated',
    withRoute(
      'GET /kagenti/sandbox paginated tasks',
      'Failed to get paginated tasks',
      async (req, res) => {
        const result = await sandbox.getPaginatedTasks(
          req.params.namespace,
          req.query.context_id as string,
          {
            limit: clampLimit(safeInt(req.query.limit), defaultLimit, maxLimit),
            beforeId: req.query.before_id as string | undefined,
          },
        );
        res.json(result);
      },
    ),
  );
}
