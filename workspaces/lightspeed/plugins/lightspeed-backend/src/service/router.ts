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
import { NotAllowedError } from '@backstage/errors';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';

import express, { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import {
  lightspeedChatCreatePermission,
  lightspeedChatDeletePermission,
  lightspeedChatReadPermission,
  lightspeedMcpManagePermission,
  lightspeedMcpReadPermission,
  lightspeedPermissions,
} from '@red-hat-developer-hub/backstage-plugin-lightspeed-common';

import { Readable } from 'node:stream';

import {
  DEFAULT_LIGHTSPEED_SERVICE_PORT,
  PROXY_PASSTHROUGH_PATHS,
} from './constant';
import { McpUserSettingsStore } from './mcp-server-store';
import {
  McpServerResponse,
  McpServerStatus,
  McpValidationResult,
} from './mcp-server-types';
import { McpServerValidator } from './mcp-server-validator';
import { VectorStoresOperator } from './notebooks/VectorStoresOperator';
import { userPermissionAuthorization } from './permission';
import { createTokenEncryptor } from './token-encryption';
import {
  DEFAULT_HISTORY_LENGTH,
  QueryRequestBody,
  RouterOptions,
} from './types';
import { isAllowedProxyPath, validateCompletionsRequest } from './validation';

const SKIP_USER_ID_ENDPOINTS = new Set(['/v1/models', '/v1/shields']);

interface StaticMcpServer {
  name: string;
  token?: string;
}

/**
 * Build MCP-HEADERS for LCS.  Format matches the LCS "client" auth model:
 *   { "server-name": { "Authorization": "<token>" } }
 *
 * For each admin-configured server, includes the user's override token if
 * present in the DB, falling back to the admin default from app-config.
 * Servers the user has disabled are excluded.
 */
async function buildMcpHeaders(
  servers: StaticMcpServer[],
  store: McpUserSettingsStore,
  userEntityRef: string,
): Promise<string> {
  const headers: Record<string, { Authorization: string }> = {};
  const userSettings = await store.listByUser(userEntityRef);
  const settingsMap = new Map(userSettings.map(s => [s.server_name, s]));

  for (const server of servers) {
    const setting = settingsMap.get(server.name);
    const enabled = setting ? Boolean(setting.enabled) : true;
    if (!enabled) continue;

    // User's personal token (DB) takes precedence over admin default (app-config).
    // If the user hasn't set one, falls back to the config token.
    // If neither exists, the server is excluded from MCP-HEADERS.
    const token = setting?.token || server.token;
    if (token) {
      headers[server.name] = { Authorization: `${token}` };
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
  const { logger, config, database, httpAuth, userInfo, permissions } = options;

  const router = Router();
  router.use(express.json());

  const port =
    config.getOptionalNumber('lightspeed.servicePort') ??
    DEFAULT_LIGHTSPEED_SERVICE_PORT;
  const system_prompt = config.getOptionalString('lightspeed.systemPrompt');

  const vectorStoresOperator = VectorStoresOperator.getInstance(
    `http://0.0.0.0:${port}`,
    logger,
  );
  let lightspeed_vector_store_id: string = '';

  // Parse admin-configured MCP servers from app-config.
  // Only name is required; token is optional (users can provide their own via the UI).
  // URLs come from LCS (GET /v1/mcp-servers), not from app-config.
  const mcpServersConfig = config.getOptionalConfigArray(
    'lightspeed.mcpServers',
  );
  const staticServers: StaticMcpServer[] = [];
  if (mcpServersConfig) {
    for (const mcpServer of mcpServersConfig) {
      staticServers.push({
        name: mcpServer.getString('name'),
        token: mcpServer.getOptionalString('token'),
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
      const response = await fetch(`http://0.0.0.0:${port}/v1/mcp-servers`, {
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

  const authorizer = userPermissionAuthorization(permissions);

  // ─── MCP Server Management Endpoints ────────────────────────────────
  // All MCP servers are admin-configured (static). Users can view the
  // list, toggle servers on/off, and provide personal access tokens.

  router.get('/mcp-servers', async (req, res) => {
    try {
      const credentials = await httpAuth.credentials(req);
      await authorizer.authorizeUser(lightspeedMcpReadPermission, credentials);
      const user = await userInfo.getUserInfo(credentials);

      const userSettings = await settingsStore.listByUser(user.userEntityRef);
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
          hasToken: !!(setting?.token || server.token),
          hasUserToken: !!setting?.token,
        };
      });

      res.json({ servers });
    } catch (error) {
      if (error instanceof NotAllowedError) {
        res.status(403).json({ error: error.message });
      } else {
        logger.error(`Error listing MCP servers: ${error}`);
        res.status(500).json({ error: 'Failed to list MCP servers' });
      }
    }
  });

  router.post('/mcp-servers/validate', async (req, res) => {
    try {
      const credentials = await httpAuth.credentials(req);
      await authorizer.authorizeUser(lightspeedMcpReadPermission, credentials);

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
      if (error instanceof NotAllowedError) {
        res.status(403).json({ error: error.message });
      } else {
        logger.error(`Error validating MCP credentials: ${error}`);
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  });

  router.post('/mcp-servers/:name/validate', async (req, res) => {
    try {
      const credentials = await httpAuth.credentials(req);
      await authorizer.authorizeUser(
        lightspeedMcpManagePermission,
        credentials,
      );
      const user = await userInfo.getUserInfo(credentials);

      const { name } = req.params;
      const server = staticServers.find(s => s.name === name);
      if (!server) {
        res.status(404).json({
          error: `MCP server '${name}' is not configured — it must be defined in the Lightspeed Stack config and listed under lightspeed.mcpServers in app-config`,
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

      const setting = await settingsStore.get(name, user.userEntityRef);
      const effectiveToken = setting?.token || server.token;
      if (!effectiveToken) {
        res
          .status(400)
          .json({ error: 'No token available — provide one first' });
        return;
      }

      const validation = await mcpValidator.validate(serverUrl, effectiveToken);
      const status: McpServerStatus = validation.valid ? 'connected' : 'error';

      await settingsStore.updateStatus(
        name,
        user.userEntityRef,
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
      if (error instanceof NotAllowedError) {
        res.status(403).json({ error: error.message });
      } else {
        logger.error(`Error validating MCP server: ${error}`);
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  });

  router.patch('/mcp-servers/:name', async (req, res) => {
    try {
      const credentials = await httpAuth.credentials(req);
      await authorizer.authorizeUser(
        lightspeedMcpManagePermission,
        credentials,
      );
      const user = await userInfo.getUserInfo(credentials);

      const { name } = req.params;
      const server = staticServers.find(s => s.name === name);
      if (!server) {
        res.status(404).json({
          error: `MCP server '${name}' is not configured — it must be defined in the Lightspeed Stack config and listed under lightspeed.mcpServers in app-config`,
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
      const hasTokenField = Object.prototype.hasOwnProperty.call(body, 'token');
      const { enabled, token } = body;
      if (!hasEnabledField && !hasTokenField) {
        res.status(400).json({
          error: 'At least one of enabled or token must be provided',
        });
        return;
      }

      const setting = await settingsStore.upsert(name, user.userEntityRef, {
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
          user.userEntityRef,
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
          hasToken: !!(setting.token || server.token),
          hasUserToken: !!setting.token,
        },
      };
      if (validation) result.validation = validation;
      res.json(result);
    } catch (error) {
      if (error instanceof NotAllowedError) {
        res.status(403).json({ error: error.message });
      } else {
        logger.error(`Error updating MCP server settings: ${error}`);
        res.status(500).json({ error: 'Failed to update MCP server settings' });
      }
    }
  });

  // Returns conversation IDs associated with notebook sessions for filtering
  router.get('/notebook-conversation-ids', async (req, res) => {
    try {
      const credentials = await httpAuth.credentials(req);
      const user = await userInfo.getUserInfo(credentials);
      const userId = user.userEntityRef;

      const vectorStoresPage = await vectorStoresOperator.vectorStores.list();
      const vectorStores = vectorStoresPage.data || [];

      const conversationIds: string[] = [];

      for (const store of vectorStores) {
        const sessionUserId = store.metadata?.user_id as string;
        const conversationId = store.metadata?.conversation_id as string | null;

        // Only include this user's sessions with a conversation_id
        if (sessionUserId === userId && conversationId) {
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
  });

  // ─── Proxy Middleware (existing) ────────────────────────────────────

  router.use('/', async (req, res, next) => {
    // Skip middleware for notebooks routes and specific paths
    if (
      req.path.startsWith('/notebooks') ||
      PROXY_PASSTHROUGH_PATHS.includes(req.path) ||
      req.method === 'PUT'
    ) {
      return next();
    }

    if (!isAllowedProxyPath(req.path)) {
      return res.status(404).json({ error: 'Requested path is not available' });
    }

    // TODO: parse server_id from req.body and get URL and token when multi-server is supported
    const credentials = await httpAuth.credentials(req);
    const user = await userInfo.getUserInfo(credentials);
    const userEntity = user.userEntityRef;

    logger.info(`receives call from user: ${userEntity}`);
    try {
      if (req.method === 'GET') {
        await authorizer.authorizeUser(
          lightspeedChatReadPermission,
          credentials,
        );
      } else if (req.method === 'DELETE') {
        await authorizer.authorizeUser(
          lightspeedChatDeletePermission,
          credentials,
        );
      }
    } catch (error) {
      if (error instanceof NotAllowedError) {
        logger.error(error.message);
        return res.status(403).json({ error: error.message });
      }
    }
    // Proxy middleware configuration
    const apiProxy = createProxyMiddleware({
      target: `http://0.0.0.0:${port}`,
      changeOrigin: true,
      pathRewrite: (path, _) => {
        const isSkippable = Array.from(SKIP_USER_ID_ENDPOINTS).some(endpoint =>
          path.startsWith(endpoint),
        );

        if (isSkippable) {
          return path;
        }

        let newPath = path;

        // Add user_id
        const userQueryParam = `user_id=${encodeURIComponent(userEntity)}`;
        newPath = path.includes('?')
          ? `${path}&${userQueryParam}`
          : `${path}?${userQueryParam}`;

        // Add history_length if needed
        if (
          !path.includes('history_length') &&
          path.includes('conversation_id')
        ) {
          const historyLengthQuery = `history_length=${DEFAULT_HISTORY_LENGTH}`;
          newPath = newPath.includes('?')
            ? `${newPath}&${historyLengthQuery}`
            : `${newPath}?${historyLengthQuery}`;
        }

        logger.info(`Rewriting path from ${path} to ${newPath}`);
        return newPath;
      },
    });
    return apiProxy(req, res, next);
  });

  router.post('/v1/feedback', async (request, response) => {
    try {
      const credentials = await httpAuth.credentials(request);
      const user = await userInfo.getUserInfo(credentials);
      const user_id = user.userEntityRef;

      logger.info(`/v1/feedback receives call from user: ${user_id}`);

      await authorizer.authorizeUser(
        lightspeedChatCreatePermission,
        credentials,
      );
      const userQueryParam = `user_id=${encodeURIComponent(user_id)}`;
      const requestBody = JSON.stringify(request.body);
      const fetchResponse = await fetch(
        `http://0.0.0.0:${port}/v1/feedback?${userQueryParam}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        },
      );

      if (!fetchResponse.ok) {
        // Read the error body
        const errorBody = await fetchResponse.json();
        const errormsg = `Error from lightspeed-core server: ${errorBody.error?.message || errorBody?.detail?.cause || 'Unknown error'}`;
        logger.error(errormsg);

        // Return a 500 status for any upstream error
        response.status(500).json({
          error: errormsg,
        });
      }

      const data = await fetchResponse.json();
      response.status(fetchResponse.status).json(data);
    } catch (error) {
      const errormsg = `Error while sending feedback: ${error}`;
      logger.error(errormsg);

      if (error instanceof NotAllowedError) {
        response.status(403).json({ error: error.message });
      } else {
        response.status(500).json({ error: errormsg });
      }
    }
  });

  router.post('/v1/query/interrupt', async (request, response) => {
    try {
      const credentials = await httpAuth.credentials(request);
      const userEntity = await userInfo.getUserInfo(credentials);
      const user_id = userEntity.userEntityRef;
      await authorizer.authorizeUser(
        lightspeedChatCreatePermission,
        credentials,
      );
      const userQueryParam = `user_id=${encodeURIComponent(user_id)}`;
      const requestBody = JSON.stringify(request.body);
      const fetchResponse = await fetch(
        `http://0.0.0.0:${port}/v1/streaming_query/interrupt?${userQueryParam}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        },
      );
      if (!fetchResponse.ok) {
        const errorBody = await fetchResponse.json();
        const errormsg = `Error from lightspeed-core server: ${errorBody.error?.message || errorBody?.detail?.cause || 'Unknown error'}`;
        logger.error(errormsg);
        response.status(500).json({ error: errormsg });
        return;
      }
      response.status(fetchResponse.status).json(await fetchResponse.json());
    } catch (error) {
      const errormsg = `Error while interrupting query: ${error}`;
      logger.error(errormsg);
      if (error instanceof NotAllowedError) {
        response.status(403).json({ error: error.message });
      } else {
        response.status(500).json({ error: error });
      }
    }
  });

  router.post(
    '/v1/query',
    validateCompletionsRequest,
    async (request, response) => {
      const { provider }: Pick<QueryRequestBody, 'provider'> = request.body;
      try {
        const credentials = await httpAuth.credentials(request);
        const user = await userInfo.getUserInfo(credentials);
        const user_id = user.userEntityRef;

        logger.info(`/v1/query receives call from user: ${user_id}`);

        await authorizer.authorizeUser(
          lightspeedChatCreatePermission,
          credentials,
        );

        // get the vector store id for the rhdh-product-docs vector store
        if (lightspeed_vector_store_id === '') {
          const vectorStores = await vectorStoresOperator.vectorStores.list();
          lightspeed_vector_store_id =
            vectorStores.data.find((v: any) =>
              v.name.startsWith('rhdh-product-docs'),
            )?.id || '';
        }

        if (lightspeed_vector_store_id !== '') {
          request.body.vector_store_ids = [lightspeed_vector_store_id];
        }

        const userQueryParam = `user_id=${encodeURIComponent(user_id)}`;
        request.body.media_type = 'application/json'; // set media_type to receive start and end event
        // if system_prompt is defined in lightspeed config
        // set system_prompt to override the default rhdh system prompt
        if (system_prompt && system_prompt.trim().length > 0) {
          request.body.system_prompt = system_prompt;
        }

        const requestBody = JSON.stringify(request.body);

        // Build MCP headers from config servers + this user's preferences
        const mcpHeadersValue = await buildMcpHeaders(
          staticServers,
          settingsStore,
          user_id,
        );

        const fetchResponse = await fetch(
          `http://0.0.0.0:${port}/v1/streaming_query?${userQueryParam}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'MCP-HEADERS': mcpHeadersValue,
            },
            body: requestBody,
          },
        );

        if (!fetchResponse.ok) {
          // Read the error body
          const errorBody = await fetchResponse.json();
          const errormsg = `Error from lightspeed-core server: ${errorBody.error?.message || errorBody?.detail?.cause || 'Unknown error'}`;
          logger.error(errormsg);

          // Return a 500 status for any upstream error
          response.status(500).json({
            error: errormsg,
          });

          return;
        }

        // Pipe the response back to the original response
        if (fetchResponse.body) {
          const nodeStream = Readable.fromWeb(fetchResponse.body as any);
          nodeStream.pipe(response);
        }
      } catch (error) {
        const errormsg = `Error fetching completions from ${provider}: ${error}`;
        logger.error(errormsg);

        if (error instanceof NotAllowedError) {
          response.status(403).json({ error: error.message });
        } else {
          response.status(500).json({ error: errormsg });
        }
      }
    },
  );

  router.put(
    '/v2/conversations/:conversation_id',
    async (request, response) => {
      try {
        const credentials = await httpAuth.credentials(request);
        const user = await userInfo.getUserInfo(credentials);
        const user_id = user.userEntityRef;
        const conversation_id = request.params.conversation_id;

        const requestBody = JSON.stringify(request.body);
        await authorizer.authorizeUser(
          lightspeedChatCreatePermission,
          credentials,
        );
        const userQueryParam = `user_id=${encodeURIComponent(user_id)}`;
        const fetchResponse = await fetch(
          `http://0.0.0.0:${port}/v2/conversations/${conversation_id}?${userQueryParam}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
          },
        );
        if (!fetchResponse.ok) {
          // Read the error body
          const errorBody = await fetchResponse.json();
          const errormsg = `Error from lightspeed-core server: ${errorBody.error?.message || errorBody?.detail?.cause || 'Unknown error'}`;
          logger.error(errormsg);

          // Return a 500 status for any upstream error
          response.status(500).json({
            error: errormsg,
          });
          return;
        }

        const data = await fetchResponse.json();
        response.status(fetchResponse.status).json(data);
      } catch (error) {
        const errormsg = `Error while updating topic summary: ${error}`;
        logger.error(errormsg);

        if (error instanceof NotAllowedError) {
          response.status(403).json({ error: error.message });
        } else {
          response.status(500).json({ error: errormsg });
        }
      }
    },
  );

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
