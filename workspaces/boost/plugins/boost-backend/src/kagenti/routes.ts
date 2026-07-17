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
  boostKagentiAdminPermission,
  boostAdminPermission,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { NotAllowedError } from '@backstage/errors';

/**
 * Options for creating Kagenti admin routes.
 *
 * @public
 */
export interface KagentiAdminRoutesOptions {
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service for extracting credentials. */
  httpAuth: HttpAuthService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Creates an Express router with Kagenti infrastructure admin routes.
 *
 * All routes are gated by the `boost.kagenti.admin` permission with
 * fallback to `boost.admin`.
 *
 * Routes implemented (task 5.1):
 * - GET /kagenti/status — Kagenti infrastructure status
 *
 * @public
 */
export function createKagentiAdminRoutes(
  options: KagentiAdminRoutesOptions,
): Router {
  const { permissions, httpAuth, logger } = options;
  const router = Router();

  /**
   * Middleware to check kagenti admin permission with admin fallback.
   */
  async function requireKagentiAdmin(
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction,
  ): Promise<void> {
    try {
      const credentials = await httpAuth.credentials(req);

      // Check fine-grained kagenti admin permission
      const [decision] = await permissions.authorize(
        [{ permission: boostKagentiAdminPermission }],
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

  // 5.1: GET /kagenti/status — Kagenti infrastructure status
  router.get(
    '/kagenti/status',
    requireKagentiAdmin,
    async (_req, res, next) => {
      try {
        logger.info('Kagenti admin status check');
        res.json({
          status: 'ok',
          infrastructure: {
            namespaces: [],
            buildPipelines: [],
            sandbox: { enabled: false },
            platformLinks: [],
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
