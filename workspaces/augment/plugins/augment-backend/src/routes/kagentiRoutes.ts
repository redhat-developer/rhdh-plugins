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

import type express from 'express';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';
import type { KagentiProvider } from '../providers/kagenti';
import type { KagentiApiClient } from '../providers/kagenti';
import { registerKagentiAgentRoutes } from './kagentiAgentRoutes';
import { registerKagentiToolRoutes } from './kagentiToolRoutes';
import { registerKagentiConfigRoutes } from './kagentiConfigRoutes';

/**
 * Dependencies shared by Kagenti sub-route modules after the provider check.
 */
export interface KagentiRouteRegistrarContext {
  router: express.Router;
  logger: LoggerService;
  kagenti: KagentiProvider;
  api: KagentiApiClient;
  withRoute: ReturnType<typeof createWithRoute>;
  validateNamespaceParam: express.RequestHandler;
  requireAdminAccess: express.RequestHandler;
}

/**
 * Registers core Kagenti routes for agent lifecycle, tool management,
 * namespaces, config, and Shipwright builds.
 *
 * These routes are always registered when the active provider is 'kagenti'.
 */
export function registerKagentiRoutes(ctx: RouteContext): void {
  const {
    router,
    logger,
    provider,
    sendRouteError,
    requireAdminAccess,
    getUserRef,
  } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  if (provider.id !== 'kagenti') {
    logger.warn(
      'registerKagentiRoutes called but provider is not kagenti, skipping',
    );
    return;
  }

  const kagenti = provider as KagentiProvider;
  const api = kagenti.getApiClient();

  router.use('/kagenti', async (req, _res, next) => {
    try {
      const userRef = await getUserRef(req);
      kagenti.setUserContext(userRef);
    } catch (err) {
      logger.warn(
        `Could not resolve user context for Kagenti request: ${err instanceof Error ? err.message : err}`,
      );
    }
    next();
  });

  function validateNamespaceParam(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    const ns = req.params.namespace || (req.query.namespace as string);
    if (ns) {
      try {
        kagenti.validateNamespace(ns);
      } catch (err) {
        sendRouteError(
          res,
          err,
          'Namespace validation',
          'Namespace access denied',
          undefined,
          403,
        );
        return;
      }
    }
    next();
  }

  const registrarCtx: KagentiRouteRegistrarContext = {
    router,
    logger,
    kagenti,
    api,
    withRoute,
    validateNamespaceParam,
    requireAdminAccess,
  };

  registerKagentiConfigRoutes(registrarCtx);
  registerKagentiAgentRoutes(registrarCtx);
  registerKagentiToolRoutes(registrarCtx);
}
