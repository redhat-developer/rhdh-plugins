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
import { InputError } from '@backstage/errors';
import type { AdminConfigService } from '../services/AdminConfigService';
import { DevSpacesService } from '../services/DevSpacesService';
import { createWithRoute } from './routeWrapper';

export interface DevSpacesRouteDeps {
  router: express.Router;
  logger: LoggerService;
  adminConfig: AdminConfigService;
  sendRouteError: (
    res: express.Response,
    error: unknown,
    logLabel: string,
    userFacingError: string,
    extra?: Record<string, unknown>,
    statusCode?: number,
  ) => void;
  requireAdminAccess: express.RequestHandler;
  /** Acquire a platform auth token (Keycloak client credentials). */
  getAuthToken?: () => Promise<string>;
}

/**
 * Registers routes that proxy requests to an external Dev Spaces API.
 * Provides full workspace lifecycle management: health check, create,
 * list, get status, stop, and delete.
 */
export function registerDevSpacesRoutes(deps: DevSpacesRouteDeps): void {
  const {
    router,
    logger,
    adminConfig,
    sendRouteError,
    requireAdminAccess,
    getAuthToken,
  } = deps;
  const withRoute = createWithRoute(logger, sendRouteError);
  const service = new DevSpacesService({ logger, adminConfig, getAuthToken });

  // ── Health check ──────────────────────────────────────────────────────
  router.get(
    '/devspaces/health',
    requireAdminAccess,
    withRoute(
      'GET /devspaces/health',
      'Failed to check Dev Spaces health',
      async (_req, res) => {
        const result = await service.healthCheck();
        res.json(result);
      },
    ),
  );

  // ── Create workspace ──────────────────────────────────────────────────
  router.post(
    '/devspaces/workspaces',
    requireAdminAccess,
    withRoute(
      'POST /devspaces/workspaces',
      'Failed to create Dev Spaces workspace',
      async (req, res) => {
        const { namespace, git_repo, memory_limit, cpu_limit } = req.body ?? {};
        if (!namespace || typeof namespace !== 'string') {
          throw new InputError('namespace is required');
        }
        if (!git_repo || typeof git_repo !== 'string') {
          throw new InputError('git_repo is required');
        }
        const result = await service.createWorkspace({
          namespace,
          git_repo,
          memory_limit,
          cpu_limit,
        });
        res.json(result);
      },
    ),
  );

  // ── List workspaces ───────────────────────────────────────────────────
  router.get(
    '/devspaces/workspaces',
    requireAdminAccess,
    withRoute(
      'GET /devspaces/workspaces',
      'Failed to list Dev Spaces workspaces',
      async (req, res) => {
        const namespace = req.query.namespace as string | undefined;
        if (!namespace) {
          throw new InputError('namespace query parameter is required');
        }
        const result = await service.listWorkspaces(namespace);
        res.json(result);
      },
    ),
  );

  // ── Get workspace status ──────────────────────────────────────────────
  router.get(
    '/devspaces/workspaces/:namespace/:name',
    requireAdminAccess,
    withRoute(
      req =>
        `GET /devspaces/workspaces/${req.params.namespace}/${req.params.name}`,
      'Failed to get Dev Spaces workspace',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await service.getWorkspace(namespace, name);
        res.json(result);
      },
    ),
  );

  // ── Stop workspace ────────────────────────────────────────────────────
  router.patch(
    '/devspaces/workspaces/:namespace/:name/stop',
    requireAdminAccess,
    withRoute(
      req =>
        `PATCH /devspaces/workspaces/${req.params.namespace}/${req.params.name}/stop`,
      'Failed to stop Dev Spaces workspace',
      async (req, res) => {
        const { namespace, name } = req.params;
        await service.stopWorkspace(namespace, name);
        res.json({
          success: true,
          message: `Workspace ${name} stop requested`,
        });
      },
    ),
  );

  // ── Delete workspace ──────────────────────────────────────────────────
  router.delete(
    '/devspaces/workspaces/:namespace/:name',
    requireAdminAccess,
    withRoute(
      req =>
        `DELETE /devspaces/workspaces/${req.params.namespace}/${req.params.name}`,
      'Failed to delete Dev Spaces workspace',
      async (req, res) => {
        const { namespace, name } = req.params;
        await service.deleteWorkspace(namespace, name);
        res.json({ success: true, message: `Workspace ${name} deleted` });
      },
    ),
  );
}
