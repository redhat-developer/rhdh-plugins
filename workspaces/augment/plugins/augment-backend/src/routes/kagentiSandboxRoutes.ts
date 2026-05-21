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

import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';
import type { KagentiProvider } from '../providers/kagenti';
import type { SandboxRouteCtx } from './sandboxRouteContext';
import {
  registerSandboxAgentRoutes,
  registerSandboxDeployRoutes,
  registerSandboxEventsRoutes,
  registerSandboxTokenUsageRoutes,
} from './sandboxAgentDeployTelemetryRoutes';
import { registerSandboxChatRoutes } from './sandboxChatRoutes';
import { registerSandboxFileRoutes } from './sandboxFileRoutes';
import { registerSandboxSessionRoutes } from './sandboxSessionRoutes';
import { registerSandboxSidecarRoutes } from './sandboxSidecarRoutes';

/**
 * Registers Kagenti sandbox routes. Only called when sandbox feature flag is on.
 */
export function registerKagentiSandboxRoutes(ctx: RouteContext): void {
  const {
    router,
    logger,
    provider,
    sendRouteError,
    requireAdminAccess,
    checkIsAdmin,
  } = ctx;
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

  const sandboxCtx: SandboxRouteCtx = {
    router,
    logger,
    sandbox,
    kagentiCfg,
    withRoute,
    requireAdminAccess,
    checkIsAdmin,
    defaultLimit,
    maxLimit,
  };

  registerSandboxSessionRoutes(sandboxCtx);
  registerSandboxAgentRoutes(sandboxCtx);
  registerSandboxChatRoutes(sandboxCtx);
  registerSandboxDeployRoutes(sandboxCtx);
  registerSandboxFileRoutes(sandboxCtx);
  registerSandboxSidecarRoutes(sandboxCtx);
  registerSandboxTokenUsageRoutes(sandboxCtx);
  registerSandboxEventsRoutes(sandboxCtx);
}
