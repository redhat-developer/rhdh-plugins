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

import type { Response } from 'express';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import type { NormalizedStreamEvent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { createWithRoute } from './routeWrapper';
import type { RouteContext, FlushableResponse } from './types';
import type { KagentiProvider } from '../providers/kagenti';
import { KagentiStreamNormalizer } from '../providers/kagenti/stream/KagentiStreamNormalizer';

function safeInt(val: unknown): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

function clampLimit(
  raw: number | undefined,
  defaultLimit: number,
  maxLimit: number,
): number {
  const val = raw ?? defaultLimit;
  return Math.min(Math.max(1, val), maxLimit);
}

function setupSse(res: Response, logger: LoggerService) {
  res.setHeader('Content-Encoding', 'identity');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const disconnected = { current: false };
  const abortController = new AbortController();
  res.on('close', () => {
    disconnected.current = true;
    abortController.abort();
    logger.debug('Client disconnected from Kagenti sandbox stream');
  });
  return { disconnected, abortController };
}

function writeSse(
  res: Response,
  event: NormalizedStreamEvent,
  disconnected: { current: boolean },
) {
  if (!disconnected.current) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    (res as FlushableResponse).flush?.();
  }
}

async function handleSseStream(
  res: Response,
  logger: LoggerService,
  kagentiCfg: { verboseStreamLogging?: boolean },
  streamFn: (
    onLine: (line: string) => void,
    signal: AbortSignal,
  ) => Promise<void>,
): Promise<void> {
  const { disconnected, abortController } = setupSse(res, logger);
  const verboseLog = kagentiCfg.verboseStreamLogging ? logger : undefined;
  const normalizer = new KagentiStreamNormalizer(verboseLog);

  try {
    await streamFn((line: string) => {
      for (const event of normalizer.normalize(line)) {
        writeSse(res, event, disconnected);
      }
    }, abortController.signal);
    if (!disconnected.current) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (err) {
    if (abortController.signal.aborted) {
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`SSE stream error: ${msg}`);
    if (!disconnected.current) {
      writeSse(
        res,
        { type: 'stream.error', error: 'Stream failed', code: 'stream_error' },
        disconnected,
      );
      res.end();
    }
  }
}

/**
 * Registers Kagenti sandbox routes. Only called when sandbox feature flag is on.
 */
export function registerKagentiSandboxRoutes(ctx: RouteContext): void {
  const { router, logger, provider, sendRouteError, requireAdminAccess, getUserRef, checkIsAdmin } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  if (provider.id !== 'kagenti') {
    logger.warn(
      'registerKagentiSandboxRoutes called but provider is not kagenti, skipping',
    );
    return;
  }
  const kagenti = provider as KagentiProvider;

  const sandbox = kagenti.getSandboxClient();
  if (!sandbox) {
    logger.warn('Sandbox client not available, skipping sandbox routes');
    return;
  }

  const kagentiCfg = kagenti.getConfig();
  const { defaultLimit, maxLimit } = kagentiCfg.pagination;

  function validateNamespaceParam(
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) {
    const ns = req.params.namespace;
    if (ns) {
      try {
        kagenti.validateNamespace(ns);
      } catch (err) {
        sendRouteError(res, err, 'Namespace validation', 'Namespace access denied', undefined, 403);
        return;
      }
    }
    next();
  }

  // Register non-namespaced routes BEFORE the namespace validation middleware
  router.get(
    '/kagenti/sandbox/defaults',
    withRoute(
      'GET /kagenti/sandbox defaults',
      'Failed to get sandbox defaults',
      async (_req, res) => {
        const result = await sandbox.getSandboxDefaults();
        res.json(result);
      },
    ),
  );

  router.use('/kagenti/sandbox/:namespace', validateNamespaceParam);

  // -- Sessions ---------------------------------------------------------------

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

  // -- Sandbox Agents ---------------------------------------------------------

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

  // -- Sandbox Chat -----------------------------------------------------------

  router.post(
    '/kagenti/sandbox/:namespace/chat',
    withRoute(
      'POST /kagenti/sandbox chat',
      'Failed to send sandbox chat',
      async (req, res) => {
        if (!req.body?.message || typeof req.body.message !== 'string') {
          throw new InputError('message is required and must be a string');
        }
        const result = await sandbox.sandboxChat(
          req.params.namespace,
          req.body.message,
          {
            sessionId: req.body.session_id,
            agentName: req.body.agent_name,
            skill: req.body.skill ?? kagentiCfg.sandbox.defaultSkill,
          },
        );
        res.json(result);
      },
    ),
  );

  router.post('/kagenti/sandbox/:namespace/chat/stream', (req, res) => {
    if (!req.body?.message || typeof req.body.message !== 'string') {
      res.status(400).json({ error: 'message is required and must be a string' });
      return;
    }
    logger.debug('POST /kagenti/sandbox chat/stream');
    handleSseStream(res, logger, kagentiCfg, (onLine, signal) =>
      sandbox.sandboxChatStream(
        req.params.namespace,
        req.body.message,
        {
          sessionId: req.body.session_id,
          agentName: req.body.agent_name,
          skill: req.body.skill ?? kagentiCfg.sandbox.defaultSkill,
        },
        onLine,
        signal,
      ),
    );
  });

  router.get(
    '/kagenti/sandbox/:namespace/sessions/:sessionId/subscribe',
    (req, res) => {
      logger.debug(
        `GET /kagenti/sandbox subscribe session ${req.params.sessionId}`,
      );
      handleSseStream(res, logger, kagentiCfg, (onLine, signal) =>
        sandbox.subscribeSession(
          req.params.namespace,
          req.params.sessionId,
          onLine,
          signal,
        ),
      );
    },
  );

  // -- Sandbox Deploy ---------------------------------------------------------

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

  // -- Files ------------------------------------------------------------------

  router.get(
    '/kagenti/sandbox/:namespace/files/:agent',
    withRoute(
      'GET /kagenti/sandbox files',
      'Failed to browse files',
      async (req, res) => {
        const path = (req.query.path as string) || '/';
        const result = await sandbox.browseFiles(
          req.params.namespace,
          req.params.agent,
          path,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/files/:agent/list',
    withRoute(
      'GET /kagenti/sandbox file list',
      'Failed to list directory',
      async (req, res) => {
        const path = (req.query.path as string) || '/';
        const result = await sandbox.listDirectory(
          req.params.namespace,
          req.params.agent,
          path,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/files/:agent/content',
    withRoute(
      'GET /kagenti/sandbox file content',
      'Failed to get file content',
      async (req, res) => {
        const path = req.query.path as string;
        const result = await sandbox.getFileContent(
          req.params.namespace,
          req.params.agent,
          path,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/files/:agent/:contextId',
    withRoute(
      'GET /kagenti/sandbox context files',
      'Failed to browse context files',
      async (req, res) => {
        const path = (req.query.path as string) || '/';
        const result = await sandbox.browseContextFiles(
          req.params.namespace,
          req.params.agent,
          req.params.contextId,
          path,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/stats/:agent',
    withRoute(
      'GET /kagenti/sandbox storage stats',
      'Failed to get storage stats',
      async (req, res) => {
        const result = await sandbox.getStorageStats(
          req.params.namespace,
          req.params.agent,
        );
        res.json(result);
      },
    ),
  );

  // -- Sidecars ---------------------------------------------------------------

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

  // -- Token Usage (namespace-scoped) ------------------------------------------

  router.get(
    '/kagenti/sandbox/:namespace/token-usage/sessions/:contextId',
    withRoute(
      'GET /kagenti/token-usage session',
      'Failed to get token usage',
      async (req, res) => {
        const result = await sandbox.getSessionTokenUsage(req.params.namespace, req.params.contextId);
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
        const result = await sandbox.getSessionTreeUsage(req.params.namespace, req.params.contextId);
        res.json(result);
      },
    ),
  );

  // -- Events -----------------------------------------------------------------

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
