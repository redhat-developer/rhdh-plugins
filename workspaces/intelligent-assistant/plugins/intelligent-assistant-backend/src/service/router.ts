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

import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import type {
  AuthService,
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { NotAllowedError } from '@backstage/errors';
import type { BasicPermission } from '@backstage/plugin-permission-common';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';

import express, { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import {
  lightspeedChatAccessPermission,
  lightspeedChatUsePermission,
  lightspeedConversationsAccessPermission,
  lightspeedMcpManagePermission,
  lightspeedMcpReadPermission,
  lightspeedPermissions,
} from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import { Readable } from 'node:stream';

import {
  DEFAULT_LIGHTSPEED_SERVICE_HOST,
  DEFAULT_LIGHTSPEED_SERVICE_PORT,
  EXPRESS_JSON_BODY_LIMIT,
} from './constant';
import { McpUserSettingsStore } from './mcp-server-store';
import {
  McpServerAuth,
  McpServerResponse,
  McpServerStatus,
  McpValidationResult,
} from './mcp-server-types';
import { McpServerValidator } from './mcp-server-validator';
import { createPermissionMiddleware } from './middleware/createPermissionMiddleware';
import { createRateLimitMiddleware } from './middleware/createRateLimitMiddleware';
import {
  createIdentityMiddleware,
  getIdentity,
} from './middleware/getIdentity';
import { VectorStoresOperator } from './notebooks/VectorStoresOperator';
import { userPermissionAuthorization } from './permission';
import { createTokenEncryptor } from './token-encryption';
import { QueryRequestBody, RouterOptions } from './types';
import { handleLCSFetchError, rewriteProxyPath } from './utils';
import { validateCompletionsRequest } from './validation';

/**
 * MCP Server authentication modes for lightspeed.mcpServers entries.
 *
 *  - `'dcr'` — Dynamic Client Registration.  The Lightspeed backend mints a
 *    short-lived Backstage plugin-request token carrying the current user's
 *    identity.  This token is forwarded to the MCP server via LCORE's
 *    MCP-HEADERS, and the MCP Actions backend validates it against the
 *    Backstage Permission Framework (RBAC).  Use this for Backstage-internal
 *    MCP servers (e.g. `@backstage/plugin-mcp-actions-backend`).
 *    A static `token` field is **ignored** when `auth: dcr` is set.
 *
 *  - (absent / undefined) — Legacy static-token mode.  The token is resolved
 *    from the user's DB override first, then from the `token` field in
 *    app-config.  If neither exists, the server is omitted from MCP-HEADERS.
 *    Users can also set their own tokens via the Lightspeed UI.
 */
interface StaticMcpServer {
  name: string;
  token?: string;
  auth?: McpServerAuth;
}

/**
 * Build MCP-HEADERS for LCS.  Format matches the LCS "client"/"oauth" auth
 * model:  `{ "server-name": { "Authorization": "<token>" } }`
 *
 * For each admin-configured server:
 *
 *  1. If `auth: 'dcr'`, a Backstage plugin-request token is minted on behalf
 *     of the authenticated user.  Any static token is ignored.
 *
 *  2. Otherwise, the user's personal token (DB) takes precedence over the
 *     admin default from app-config.  If neither exists, the server is
 *     excluded from MCP-HEADERS (LCORE will skip it or return 401).
 *
 * Servers the user has disabled are always excluded.
 */
async function buildMcpHeaders(
  servers: StaticMcpServer[],
  store: McpUserSettingsStore,
  userEntityRef: string,
  options?: {
    dcrAuth?: { authService: AuthService; credentials: BackstageCredentials };
    logger?: LoggerService;
  },
): Promise<string> {
  const headers: Record<string, { Authorization: string }> = {};
  const userSettings = await store.listByUser(userEntityRef);
  const settingsMap = new Map(userSettings.map(s => [s.server_name, s]));

  for (const server of servers) {
    const setting = settingsMap.get(server.name);
    const enabled = setting ? Boolean(setting.enabled) : true;
    if (!enabled) continue;

    if (server.auth === 'dcr') {
      if (options?.dcrAuth) {
        try {
          const { token } =
            await options.dcrAuth.authService.getPluginRequestToken({
              onBehalfOf: options.dcrAuth.credentials,
              targetPluginId: 'mcp-actions',
            });
          headers[server.name] = { Authorization: `${token}` };
        } catch (err) {
          options?.logger?.error(
            `Failed to mint DCR token for MCP server '${server.name}': ${err}`,
          );
        }
      } else {
        options?.logger?.warn(
          `MCP server '${server.name}' has auth: dcr but AuthService is not available; skipping`,
        );
      }
    } else {
      // Static token: user's personal token (DB) > admin default (app-config).
      // If neither exists, the server is excluded from MCP-HEADERS.
      const token = setting?.token || server.token;
      if (token) {
        headers[server.name] = { Authorization: `${token}` };
      }
    }
  }

  return Object.keys(headers).length > 0 ? JSON.stringify(headers) : '';
}

/**
 * @public
 * The lightspeed backend router
 */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, database, httpAuth, auth, userInfo, permissions } =
    options;

  const router = Router();
  router.use(express.json());

  const port =
    config.getOptionalNumber('intelligent-assistant.servicePort') ??
    DEFAULT_LIGHTSPEED_SERVICE_PORT;
  const system_prompt = config.getOptionalString(
    'intelligent-assistant.systemPrompt',
  );
  const lcsBaseUrl = `http://${DEFAULT_LIGHTSPEED_SERVICE_HOST}:${port}`;

  const apiProxy = createProxyMiddleware({
    target: lcsBaseUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      const userEntityRef = (req as any).userEntityRef;
      const newPath = rewriteProxyPath(path, userEntityRef);

      if (newPath !== path) {
        logger.info(`Rewriting path from ${path} to ${newPath}`);
      }
      return newPath;
    },
  });

  const vectorStoresOperator = VectorStoresOperator.getInstance(
    lcsBaseUrl,
    logger,
  );
  // Parse admin-configured MCP servers from app-config.
  //
  // Each entry supports:
  //   name  (required)  — unique identifier, must match the name in lightspeed-stack.yaml
  //   auth  (optional)  — authentication mode:
  //                         'dcr'  = the backend mints a per-user Backstage token (for
  //                                  Backstage-internal MCP servers with DCR/OAuth enabled)
  //                         absent = legacy static-token mode (see `token` below)
  //   token (optional)  — static fallback token from app-config.  Ignored when auth: dcr.
  //                        Users can also set personal tokens via the Lightspeed UI.
  //
  // URLs come from LCS (GET /v1/mcp-servers), not from app-config.
  const mcpServersConfig = config.getOptionalConfigArray(
    'intelligent-assistant.mcpServers',
  );
  const staticServers: StaticMcpServer[] = [];
  if (mcpServersConfig) {
    for (const mcpServer of mcpServersConfig) {
      const authValue = mcpServer.getOptionalString('auth')?.toLowerCase();
      if (authValue && authValue !== 'dcr') {
        logger.warn(
          `MCP server '${mcpServer.getString('name')}' has unsupported auth value '${authValue}'; ` +
            `only 'dcr' is supported — falling back to static-token mode`,
        );
      }
      staticServers.push({
        name: mcpServer.getString('name'),
        token: mcpServer.getOptionalString('token'),
        auth: authValue === 'dcr' ? 'dcr' : undefined,
      });
    }
  }

  // Initialize database-backed store for per-user preferences and validator
  const dbClient = await database.getClient();
  const encryptor = createTokenEncryptor(config, logger);
  const settingsStore = new McpUserSettingsStore(dbClient, encryptor, logger);
  const mcpValidator = new McpServerValidator(logger);

  // URL cache populated from LCS GET /v1/mcp-servers.
  // The canonical URL for each MCP server lives in LCS config, not app-config.
  const lcsUrlCache = new Map<string, string>();

  async function refreshLcsUrlCache(): Promise<void> {
    try {
      const response = await fetch(`${lcsBaseUrl}/v1/mcp-servers`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        logger.warn(
          `Failed to fetch MCP server URLs from LCS: HTTP ${response.status}`,
        );
        return;
      }
      const data = (await response.json()) as {
        servers: Array<{ name: string; url: string }>;
      };
      for (const s of data.servers) {
        lcsUrlCache.set(s.name, s.url);
      }
      logger.info(`Cached ${lcsUrlCache.size} MCP server URL(s) from LCS`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to fetch MCP server URLs from LCS: ${msg}`);
    }
  }

  function resolveServerUrl(serverName: string): string | undefined {
    return lcsUrlCache.get(serverName);
  }

  // Best-effort URL cache on startup (non-blocking)
  refreshLcsUrlCache().catch(() => {});

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  const permissionIntegrationRouter = createPermissionIntegrationRouter({
    permissions: lightspeedPermissions,
  });
  router.use(permissionIntegrationRouter);

  const identityMiddleware = createIdentityMiddleware(
    httpAuth,
    userInfo,
    logger,
  );
  router.use((req, res, next) => {
    // Middleware mounts to notebooks router independently
    // so we skip it here
    if (req.path.startsWith('/notebooks')) {
      return next();
    }
    return identityMiddleware(req, res, next);
  });

  const authorizer = userPermissionAuthorization(permissions);

  function requirePermission(permission: BasicPermission) {
    return createPermissionMiddleware(authorizer, permission, logger);
  }

  const expensiveRateLimiter = createRateLimitMiddleware(
    config,
    'expensive',
    logger,
  );
  const generalRateLimiter = createRateLimitMiddleware(
    config,
    'general',
    logger,
  );

  // ─── MCP Server Management Endpoints ────────────────────────────────
  // All MCP servers are admin-configured (static). Users can view the
  // list, toggle servers on/off, and provide personal access tokens.

  router.get(
    '/mcp-servers',
    generalRateLimiter,
    requirePermission(lightspeedMcpReadPermission),
    async (req, res) => {
      try {
        const { userEntityRef } = getIdentity(req);

        const userSettings = await settingsStore.listByUser(userEntityRef);
        const settingsMap = new Map(userSettings.map(s => [s.server_name, s]));

        const hasAllUrls = staticServers.every(s => lcsUrlCache.has(s.name));
        if (!hasAllUrls) {
          await refreshLcsUrlCache();
        }

        const servers: McpServerResponse[] = staticServers.map(server => {
          const setting = settingsMap.get(server.name);
          return {
            name: server.name,
            url: resolveServerUrl(server.name),
            enabled: setting ? Boolean(setting.enabled) : true,
            status: setting?.status ?? 'unknown',
            toolCount: setting?.tool_count ?? 0,
            // DCR servers always have a token (minted per-request); static servers check DB + config.
            hasToken:
              server.auth === 'dcr' || !!(setting?.token || server.token),
            hasUserToken: !!setting?.token,
            hasOrgToken: server.auth !== 'dcr' && !!server.token,
            auth: server.auth,
          };
        });

        res.json({ servers });
      } catch (error) {
        logger.error(`Error listing MCP servers: ${error}`);
        res.status(500).json({ error: 'Failed to list MCP servers' });
      }
    },
  );

  router.post(
    '/mcp-servers/validate',
    generalRateLimiter,
    requirePermission(lightspeedMcpReadPermission),
    async (req, res) => {
      try {
        const { url, token } = req.body;
        if (!url || !token) {
          res.status(400).json({ error: 'url and token are required' });
          return;
        }

        // SSRF protection: only allow URLs registered in LCS
        let knownUrls = new Set(lcsUrlCache.values());
        if (!knownUrls.has(url)) {
          await refreshLcsUrlCache();
          knownUrls = new Set(lcsUrlCache.values());
        }
        if (!knownUrls.has(url)) {
          res.status(400).json({
            error:
              'URL not recognized — only MCP server URLs registered in LCS are allowed',
          });
          return;
        }

        const result = await mcpValidator.validate(url, token);
        res.json(result);
      } catch (error) {
        logger.error(`Error validating MCP credentials: ${error}`);
        res.status(500).json({ error: 'Validation failed' });
      }
    },
  );

  router.post(
    '/mcp-servers/:name/validate',
    generalRateLimiter,
    requirePermission(lightspeedMcpManagePermission),
    async (req, res) => {
      try {
        const { userEntityRef, credentials } = getIdentity(req);

        const { name } = req.params;
        const server = staticServers.find(s => s.name === name);
        if (!server) {
          res.status(404).json({
            error: `MCP server '${name}' is not configured — it must be defined in the Lightspeed Stack config and listed under intelligent-assistant.mcpServers in app-config`,
          });
          return;
        }
        // Resolve URL: LCS cache → fresh LCS fetch
        let serverUrl = resolveServerUrl(server.name);
        if (!serverUrl) {
          await refreshLcsUrlCache();
          serverUrl = resolveServerUrl(server.name);
        }
        if (!serverUrl) {
          res
            .status(400)
            .json({ error: 'Server has no URL — not found in LCS or config' });
          return;
        }

        let effectiveToken: string | undefined;
        if (server.auth === 'dcr') {
          try {
            const { token: dcrToken } = await auth.getPluginRequestToken({
              onBehalfOf: credentials,
              targetPluginId: 'mcp-actions',
            });
            effectiveToken = dcrToken;
          } catch (err) {
            logger.error(
              `Failed to mint DCR token for server '${name}': ${err}`,
            );
            res.status(502).json({
              error: `Failed to mint authentication token for DCR server '${name}' — check Backstage auth configuration`,
            });
            return;
          }
        } else {
          const setting = await settingsStore.get(name, userEntityRef);
          effectiveToken = setting?.token || server.token;
        }
        if (!effectiveToken) {
          res
            .status(400)
            .json({ error: 'No token available — provide one first' });
          return;
        }

        const validation = await mcpValidator.validate(
          serverUrl,
          effectiveToken,
        );
        const status: McpServerStatus = validation.valid
          ? 'connected'
          : 'error';

        await settingsStore.updateStatus(
          name,
          userEntityRef,
          status,
          validation.toolCount,
        );

        res.json({
          name,
          status,
          toolCount: validation.toolCount,
          validation,
        });
      } catch (error) {
        logger.error(`Error validating MCP server: ${error}`);
        res.status(500).json({ error: 'Validation failed' });
      }
    },
  );

  router.patch(
    '/mcp-servers/:name',
    generalRateLimiter,
    requirePermission(lightspeedMcpManagePermission),
    async (req, res) => {
      try {
        const { userEntityRef } = getIdentity(req);

        const { name } = req.params;
        const server = staticServers.find(s => s.name === name);
        if (!server) {
          res.status(404).json({
            error: `MCP server '${name}' is not configured — it must be defined in the Lightspeed Stack config and listed under intelligent-assistant.mcpServers in app-config`,
          });
          return;
        }

        const body = (req.body ?? {}) as {
          enabled?: boolean;
          token?: string | null;
        };
        const hasEnabledField = Object.prototype.hasOwnProperty.call(
          body,
          'enabled',
        );
        const hasTokenField = Object.prototype.hasOwnProperty.call(
          body,
          'token',
        );
        const { enabled, token } = body;
        if (!hasEnabledField && !hasTokenField) {
          res.status(400).json({
            error: 'At least one of enabled or token must be provided',
          });
          return;
        }

        const setting = await settingsStore.upsert(name, userEntityRef, {
          enabled: hasEnabledField ? enabled : undefined,
          token: hasTokenField ? token : undefined,
        });

        let validation: McpValidationResult | undefined;
        let serverUrl = resolveServerUrl(server.name);
        if (token && !serverUrl) {
          await refreshLcsUrlCache();
          serverUrl = resolveServerUrl(server.name);
        }
        if (token && serverUrl) {
          validation = await mcpValidator.validate(serverUrl, token);
          const newStatus: McpServerStatus = validation.valid
            ? 'connected'
            : 'error';
          await settingsStore.updateStatus(
            name,
            userEntityRef,
            newStatus,
            validation.toolCount,
          );
          setting.status = newStatus;
          setting.tool_count = validation.toolCount;
        }

        const result: Record<string, unknown> = {
          server: {
            name: server.name,
            url: resolveServerUrl(server.name),
            enabled: Boolean(setting.enabled),
            status: setting.status,
            toolCount: setting.tool_count,
            hasToken:
              server.auth === 'dcr' || !!(setting.token || server.token),
            hasUserToken: !!setting.token,
            hasOrgToken: server.auth !== 'dcr' && !!server.token,
            auth: server.auth,
          },
        };
        if (validation) result.validation = validation;
        res.json(result);
      } catch (error) {
        logger.error(`Error updating MCP server settings: ${error}`);
        res.status(500).json({ error: 'Failed to update MCP server settings' });
      }
    },
  );

  // Returns conversation IDs associated with notebook sessions for filtering
  router.get(
    '/notebook-conversation-ids',
    generalRateLimiter,
    async (req, res) => {
      try {
        const { userEntityRef } = getIdentity(req);

        const vectorStoresPage = await vectorStoresOperator.vectorStores.list();
        const vectorStores = vectorStoresPage.data || [];

        const conversationIds: string[] = [];

        for (const store of vectorStores) {
          const sessionUserId = store.metadata?.user_id as string;
          const conversationId = store.metadata?.conversation_id as
            | string
            | null;

          // Only include this user's sessions with a conversation_id
          if (sessionUserId === userEntityRef && conversationId) {
            conversationIds.push(conversationId);
          }
        }

        res.json({
          conversation_ids: conversationIds,
        });
      } catch (error) {
        const errormsg = `Error fetching notebook conversation IDs: ${error}`;
        logger.error(errormsg);

        if (error instanceof NotAllowedError) {
          res.status(403).json({ error: error.message });
        } else {
          res.status(500).json({ error: errormsg });
        }
      }
    },
  );

  // ─── Proxy Routes ───────────────────────────────────────────────────

  router.get(
    '/v1/models',
    generalRateLimiter,
    requirePermission(lightspeedChatAccessPermission),
    apiProxy,
  );
  router.get(
    '/v1/shields',
    generalRateLimiter,
    requirePermission(lightspeedChatAccessPermission),
    apiProxy,
  );
  router.get(
    '/v2/conversations',
    generalRateLimiter,
    requirePermission(lightspeedChatAccessPermission),
    apiProxy,
  );
  router.get(
    '/v2/conversations/:conversation_id',
    generalRateLimiter,
    requirePermission(lightspeedChatAccessPermission),
    apiProxy,
  );
  router.delete(
    '/v2/conversations/:conversation_id',
    generalRateLimiter,
    requirePermission(lightspeedConversationsManagePermission),
    apiProxy,
  );
  router.get(
    '/v1/feedback/status',
    generalRateLimiter,
    requirePermission(lightspeedChatAccessPermission),
    apiProxy,
  );

  router.post(
    '/v1/feedback',
    generalRateLimiter,
    requirePermission(lightspeedChatUsePermission),
    async (request, response) => {
      try {
        const { userEntityRef } = getIdentity(request);

        logger.info(`/v1/feedback receives call from user: ${userEntityRef}`);

        const userQueryParam = `user_id=${encodeURIComponent(userEntityRef)}`;
        const requestBody = JSON.stringify(request.body);
        const fetchResponse = await fetch(
          `${lcsBaseUrl}/v1/feedback?${userQueryParam}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
          },
        );

        if (!fetchResponse.ok) {
          await handleLCSFetchError(
            fetchResponse,
            logger,
            'sending feedback',
            response,
          );
          return;
        }

        const data = await fetchResponse.json();
        response.status(fetchResponse.status).json(data);
      } catch (error) {
        const errormsg = `Error while sending feedback: ${error}`;
        logger.error(errormsg);
        response.status(500).json({ error: errormsg });
      }
    },
  );

  router.post(
    '/v1/query/interrupt',
    generalRateLimiter,
    requirePermission(lightspeedChatUsePermission),
    async (request, response) => {
      try {
        const { userEntityRef } = getIdentity(request);
        const userQueryParam = `user_id=${encodeURIComponent(userEntityRef)}`;
        const requestBody = JSON.stringify(request.body);
        const fetchResponse = await fetch(
          `${lcsBaseUrl}/v1/streaming_query/interrupt?${userQueryParam}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
          },
        );
        if (!fetchResponse.ok) {
          await handleLCSFetchError(
            fetchResponse,
            logger,
            'interrupting query',
            response,
          );
          return;
        }
        response.status(fetchResponse.status).json(await fetchResponse.json());
      } catch (error) {
        const errormsg = `Error while interrupting query: ${error}`;
        logger.error(errormsg);
        response.status(500).json({ error: errormsg });
      }
    },
  );

  router.post(
    '/v1/query',
    express.json({ limit: EXPRESS_JSON_BODY_LIMIT }),
    expensiveRateLimiter,
    validateCompletionsRequest,
    requirePermission(lightspeedChatUsePermission),
    async (request, response) => {
      const { provider }: Pick<QueryRequestBody, 'provider'> = request.body;
      try {
        const { userEntityRef, credentials } = getIdentity(request);

        logger.info(`/v1/query receives call from user: ${userEntityRef}`);

        const userQueryParam = `user_id=${encodeURIComponent(userEntityRef)}`;
        request.body.media_type = 'application/json'; // set media_type to receive start and end event
        // if system_prompt is defined in lightspeed config
        // set system_prompt to override the default rhdh system prompt
        if (system_prompt && system_prompt.trim().length > 0) {
          request.body.system_prompt = system_prompt;
        }

        const requestBody = JSON.stringify(request.body);

        // Build MCP headers from config servers + this user's preferences.
        // For servers with auth: dcr, a per-user Backstage token is minted.
        const mcpHeadersValue = await buildMcpHeaders(
          staticServers,
          settingsStore,
          userEntityRef,
          { dcrAuth: { authService: auth, credentials }, logger },
        );

        const abortController = new AbortController();

        const fetchResponse = await fetch(
          `${lcsBaseUrl}/v1/streaming_query?${userQueryParam}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'MCP-HEADERS': mcpHeadersValue,
            },
            body: requestBody,
            signal: abortController.signal,
          },
        );

        if (!fetchResponse.ok) {
          await handleLCSFetchError(
            fetchResponse,
            logger,
            'processing query',
            response,
          );
          return;
        }

        // Pipe the response back to the original response
        if (fetchResponse.body) {
          const nodeStream = Readable.fromWeb(fetchResponse.body as any);

          nodeStream.on('error', (error: Error) => {
            logger.error(
              `Upstream stream error while processing query: ${error}`,
            );
            if (response.headersSent) {
              response.destroy();
            } else {
              response.status(500).json({ error: 'Stream error occurred' });
            }
            abortController.abort();
          });

          response.on('close', () => {
            if (!response.writableFinished) {
              logger.warn('Client disconnected while processing query');
              nodeStream.destroy();
              abortController.abort();
            }
          });

          nodeStream.pipe(response);
        }
      } catch (error) {
        const errormsg = `Error fetching completions from ${provider}: ${error}`;
        logger.error(errormsg);
        response.status(500).json({ error: errormsg });
      }
    },
  );

  router.put(
    '/v2/conversations/:conversation_id',
    generalRateLimiter,
    requirePermission(lightspeedChatUsePermission),
    async (request, response) => {
      try {
        const { userEntityRef } = getIdentity(request);
        const conversation_id = request.params.conversation_id;

        const requestBody = JSON.stringify(request.body);
        const userQueryParam = `user_id=${encodeURIComponent(userEntityRef)}`;
        const fetchResponse = await fetch(
          `${lcsBaseUrl}/v2/conversations/${conversation_id}?${userQueryParam}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
          },
        );
        if (!fetchResponse.ok) {
          await handleLCSFetchError(
            fetchResponse,
            logger,
            'updating conversation',
            response,
          );
          return;
        }

        const data = await fetchResponse.json();
        response.status(fetchResponse.status).json(data);
      } catch (error) {
        const errormsg = `Error while updating topic summary: ${error}`;
        logger.error(errormsg);
        response.status(500).json({ error: errormsg });
      }
    },
  );

  router.use((_request, response) => {
    response.status(404).json({ error: 'Requested path is not available' });
  });

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
