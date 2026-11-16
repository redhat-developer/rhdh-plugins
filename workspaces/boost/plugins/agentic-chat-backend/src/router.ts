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
  HttpAuthService,
  UserInfoService,
  PermissionsService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import type { Config } from '@backstage/config';
import { InputError, NotAllowedError, NotFoundError } from '@backstage/errors';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import {
  agenticChatPermission,
  runAgentRequestSchema,
} from '@red-hat-developer-hub/backstage-plugin-agentic-chat-common';
import express from 'express';
import type { Response } from 'express';
import Router from 'express-promise-router';
import { z } from 'zod';
import { agentToExecutionInput } from './agentToExecutionInput';

interface RouterOptions {
  config: Config;
  logger: LoggerService;
  httpAuth: HttpAuthService;
  userInfo: UserInfoService;
  permissions: PermissionsService;
  catalog: CatalogService;
}

const configSchema = z.object({
  servicePort: z.number().int().min(1).max(65535),
});
const conversationIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/);

function canonicalAgentRef(value: string): string {
  try {
    return stringifyEntityRef(
      parseEntityRef(value, {
        defaultKind: 'AiResource',
        defaultNamespace: 'default',
      }),
    );
  } catch {
    throw new InputError('Invalid agent reference');
  }
}

export async function createRouter(options: RouterOptions) {
  const { config, logger, httpAuth, userInfo, permissions, catalog } = options;
  const settings = configSchema.parse({
    servicePort: config.getOptionalNumber('agentic-chat.servicePort') ?? 8090,
  });
  const baseUrl = `http://127.0.0.1:${settings.servicePort}`;
  const router = Router();
  router.use(
    createPermissionIntegrationRouter({ permissions: [agenticChatPermission] }),
  );

  // Follow Intelligent Assistant's native identity and permission boundary.
  router.use(async (req, res, next) => {
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const identity = await userInfo.getUserInfo(credentials);
    const [decision] = await permissions.authorize(
      [{ permission: agenticChatPermission }],
      { credentials },
    );
    if (decision.result !== AuthorizeResult.ALLOW)
      throw new NotAllowedError('Forbidden');
    res.locals.credentials = credentials;
    res.locals.userEntityRef = identity.userEntityRef;
    next();
  });

  async function forward(
    path: string,
    method: string,
    response: Response,
    body?: unknown,
  ) {
    // Build a fresh URL: browser identity selectors and credentials are never forwarded.
    const url = new URL(path, baseUrl);
    url.searchParams.set('user_id', response.locals.userEntityRef);
    try {
      const upstream = await fetch(url, {
        method,
        ...(body !== undefined && {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      });
      if (!upstream.ok) {
        const status = [400, 401, 403, 404, 409, 413, 422].includes(
          upstream.status,
        )
          ? upstream.status
          : 502;
        logger.warn('LCore request failed', { status: upstream.status });
        response.status(status).json({ error: 'Chat runtime request failed' });
        return;
      }
      if (upstream.status === 204) {
        response.status(204).end();
        return;
      }
      const result = await upstream.json();
      response.status(upstream.status).json(result);
    } catch {
      logger.warn('LCore request could not be completed');
      response.status(502).json({ error: 'Chat runtime unavailable' });
    }
  }

  router.post('/v1/agent/run', express.json(), async (req, res) => {
    const parsed = runAgentRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new InputError('Invalid run request');
    const input = parsed.data;
    const agentRef = canonicalAgentRef(input.agentRef);
    // The Catalog service evaluates entity access on behalf of the caller.
    const entity = await catalog.getEntityByRef(agentRef, {
      credentials: res.locals.credentials,
    });
    if (!entity) throw new NotFoundError('Agent not found');
    await forward(
      '/v1/agent/run',
      'POST',
      res,
      agentToExecutionInput(entity, input),
    );
  });

  router.get('/v2/conversations', async (_req, res) => {
    await forward('/v2/conversations', 'GET', res);
  });
  router
    .route('/v2/conversations/:conversationId')
    .get(async (req, res) => {
      const id = conversationIdSchema.safeParse(req.params.conversationId);
      if (!id.success) throw new InputError('Invalid conversation identifier');
      await forward(
        `/v2/conversations/${encodeURIComponent(id.data)}`,
        'GET',
        res,
      );
    })
    .delete(async (req, res) => {
      const id = conversationIdSchema.safeParse(req.params.conversationId);
      if (!id.success) throw new InputError('Invalid conversation identifier');
      await forward(
        `/v2/conversations/${encodeURIComponent(id.data)}`,
        'DELETE',
        res,
      );
    });
  router.use(MiddlewareFactory.create({ logger, config }).error());
  return router;
}
