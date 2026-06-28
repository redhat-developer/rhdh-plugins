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

import { Router } from 'express';
import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import {
  ConflictError,
  InputError,
  NotFoundError,
  NotAllowedError,
} from '@backstage/errors';
import {
  boostMcpManagePermission,
  boostAdminPermission,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type {
  McpTransport,
  McpAuthType,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type { McpServerStore } from './McpServerStore';

const VALID_TRANSPORTS: readonly McpTransport[] = ['streamable-http', 'sse'];

const VALID_AUTH_TYPES: readonly McpAuthType[] = [
  'oauth-client-credentials',
  'k8s-service-account',
  'static-headers',
  'infrastructure-mtls',
  'none',
];

const MCP_SERVER_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/;

/**
 * Options for creating MCP server routes.
 *
 * @public
 */
export interface McpServerRoutesOptions {
  /** The MCP server store for persistence. */
  store: McpServerStore;
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service for extracting credentials. */
  httpAuth: HttpAuthService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Creates an Express router with MCP server registration routes.
 *
 * All routes are gated by the `boost.mcp.manage` permission with
 * fallback to `boost.admin`.
 *
 * Routes:
 * - GET    /mcp/servers         — list registered MCP servers
 * - GET    /mcp/servers/:id     — get a single MCP server
 * - POST   /mcp/servers         — register a new MCP server
 * - PUT    /mcp/servers/:id     — update an MCP server
 * - DELETE /mcp/servers/:id     — delete an MCP server
 * - POST   /mcp/servers/:id/test — test MCP server connection
 *
 * @public
 */
export function createMcpServerRoutes(options: McpServerRoutesOptions): Router {
  const { store, permissions, httpAuth, logger } = options;
  const router = Router();

  /**
   * Middleware to check MCP manage permission with admin fallback.
   */
  async function requireMcpManage(
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction,
  ): Promise<void> {
    try {
      const credentials = await httpAuth.credentials(req);

      const [decision] = await permissions.authorize(
        [{ permission: boostMcpManagePermission }],
        { credentials },
      );

      if (decision.result === AuthorizeResult.ALLOW) {
        return next();
      }

      // Fall back to coarse-grained admin permission
      const [adminDecision] = await permissions.authorize(
        [{ permission: boostAdminPermission }],
        { credentials },
      );

      if (adminDecision.result === AuthorizeResult.ALLOW) {
        return next();
      }

      throw new NotAllowedError('Unauthorized');
    } catch (error) {
      return next(error);
    }
  }

  function validateServerId(id: string): void {
    if (!MCP_SERVER_ID_PATTERN.test(id)) {
      throw new InputError(
        'Invalid MCP server ID: must be 1-255 characters, alphanumeric with dots, hyphens, and underscores',
      );
    }
  }

  function validateTransport(
    transport: unknown,
  ): asserts transport is McpTransport {
    if (
      typeof transport !== 'string' ||
      !VALID_TRANSPORTS.includes(transport as McpTransport)
    ) {
      throw new InputError(
        `Invalid transport "${transport}". Valid transports: ${VALID_TRANSPORTS.join(', ')}`,
      );
    }
  }

  function validateAuthType(
    authType: unknown,
  ): asserts authType is McpAuthType {
    if (
      typeof authType !== 'string' ||
      !VALID_AUTH_TYPES.includes(authType as McpAuthType)
    ) {
      throw new InputError(
        `Invalid auth type "${authType}". Valid types: ${VALID_AUTH_TYPES.join(', ')}`,
      );
    }
  }

  // TODO GGM cross reference on gets / puts with catalog, new API entity for MCP servers

  // GET /mcp/servers — list registered MCP servers
  router.get('/mcp/servers', requireMcpManage, async (_req, res, next) => {
    try {
      const servers = await store.list();
      res.json({ servers });
    } catch (error) {
      next(error);
    }
  });

  // GET /mcp/servers/:id — get a single MCP server
  router.get('/mcp/servers/:id', requireMcpManage, async (req, res, next) => {
    try {
      const { id } = req.params;
      validateServerId(id);
      const server = await store.get(id);
      if (!server) {
        throw new NotFoundError(`MCP server "${id}" not found`);
      }
      res.json(server);
    } catch (error) {
      next(error);
    }
  });

  // POST /mcp/servers — register a new MCP server
  router.post('/mcp/servers', requireMcpManage, async (req, res, next) => {
    try {
      const { id, name, url, transport, authType, description } =
        req.body ?? {};

      if (!id || typeof id !== 'string') {
        throw new InputError('MCP server ID is required');
      }
      validateServerId(id);

      if (!name || typeof name !== 'string') {
        throw new InputError('MCP server name is required');
      }

      if (!url || typeof url !== 'string') {
        throw new InputError('MCP server URL is required');
      }

      validateTransport(transport);
      validateAuthType(authType ?? 'none');

      // Check for conflict
      const existing = await store.get(id);
      if (existing) {
        throw new ConflictError(`MCP server "${id}" is already registered`);
      }

      const server = await store.create({
        id,
        name,
        url,
        transport,
        authType: (authType as McpAuthType) ?? 'none',
        description: typeof description === 'string' ? description : undefined,
      });

      logger.info(`MCP server registered: ${id}`);
      res.status(201).json(server);
    } catch (error) {
      next(error);
    }
  });

  // PUT /mcp/servers/:id — update an MCP server
  router.put('/mcp/servers/:id', requireMcpManage, async (req, res, next) => {
    try {
      const { id } = req.params;
      validateServerId(id);

      const existing = await store.get(id);
      if (!existing) {
        throw new NotFoundError(`MCP server "${id}" not found`);
      }

      const { name, url, transport, authType, description } = req.body ?? {};

      if (transport !== undefined) {
        validateTransport(transport);
      }
      if (authType !== undefined) {
        validateAuthType(authType);
      }

      const updated = await store.update(id, {
        name: typeof name === 'string' ? name : undefined,
        url: typeof url === 'string' ? url : undefined,
        transport,
        authType,
        description: typeof description === 'string' ? description : undefined,
      });

      if (!updated) {
        throw new NotFoundError(`MCP server "${id}" was deleted during update`);
      }

      logger.info(`MCP server updated: ${id}`);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /mcp/servers/:id — delete an MCP server
  router.delete(
    '/mcp/servers/:id',
    requireMcpManage,
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateServerId(id);

        const existing = await store.get(id);
        if (!existing) {
          throw new NotFoundError(`MCP server "${id}" not found`);
        }

        await store.delete(id);
        logger.info(`MCP server deleted: ${id}`);
        res.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /mcp/servers/:id/test — test MCP server connection
  router.post(
    '/mcp/servers/:id/test',
    requireMcpManage,
    async (req, res, next) => {
      try {
        const { id } = req.params;
        const server = await store.get(id);
        if (!server) {
          throw new NotFoundError(`MCP server "${id}" not found`);
        }

        // Connection test stub — actual MCP protocol negotiation
        // will be implemented when the MCP client SDK is integrated.
        logger.info(`MCP server connection test requested: ${id}`);
        res.json({
          status: 'ok',
          serverId: id,
          message:
            'Connection test placeholder — MCP client integration pending',
          discoveredTools: [],
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
