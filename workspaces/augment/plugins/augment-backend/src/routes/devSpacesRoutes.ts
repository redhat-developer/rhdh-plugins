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
}

/**
 * Registers routes that proxy requests to an external Dev Spaces API.
 * The Dev Spaces API URL is read from admin config (`devSpacesApiUrl`).
 */
export function registerDevSpacesRoutes(deps: DevSpacesRouteDeps): void {
  const { router, logger, adminConfig, sendRouteError, requireAdminAccess } =
    deps;
  const withRoute = createWithRoute(logger, sendRouteError);

  router.post(
    '/devspaces/workspaces',
    requireAdminAccess,
    withRoute(
      'POST /devspaces/workspaces',
      'Failed to create Dev Spaces workspace',
      async (req, res) => {
        const devSpacesApiUrl = (await adminConfig.get(
          'devSpacesApiUrl',
        )) as string | undefined;

        if (!devSpacesApiUrl || typeof devSpacesApiUrl !== 'string') {
          throw new InputError(
            'Dev Spaces API URL is not configured. Set it in Administration → Dev Spaces.',
          );
        }

        const { namespace, git_repo, memory_limit, cpu_limit } = req.body ?? {};
        if (!namespace || typeof namespace !== 'string') {
          throw new InputError('namespace is required');
        }
        if (!git_repo || typeof git_repo !== 'string') {
          throw new InputError('git_repo is required');
        }

        const authHeader = req.headers['x-devspaces-token'] as
          | string
          | undefined;
        if (!authHeader) {
          throw new InputError(
            'OpenShift token is required (x-devspaces-token header)',
          );
        }

        const normalizedUrl = devSpacesApiUrl.replace(/\/+$/, '');
        const targetUrl = `${normalizedUrl}/workspaces/intellij`;

        logger.info(
          `Proxying Dev Spaces workspace creation to ${normalizedUrl}`,
        );

        const upstream = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authHeader}`,
          },
          body: JSON.stringify({
            namespace,
            git_repo,
            memory_limit: memory_limit || '8Gi',
            cpu_limit: cpu_limit || '2000m',
          }),
        });

        const body = await upstream.text();
        const contentType = upstream.headers.get('content-type') ?? '';

        if (!upstream.ok) {
          const detail = contentType.includes('json')
            ? JSON.parse(body)?.detail ?? body
            : body;
          logger.error(
            `Dev Spaces API returned ${upstream.status}: ${detail}`,
          );
          res.status(upstream.status).json({
            error: 'Dev Spaces workspace creation failed',
            message:
              typeof detail === 'string'
                ? detail
                : JSON.stringify(detail),
          });
          return;
        }

        const result = contentType.includes('json') ? JSON.parse(body) : body;
        res.json(result);
      },
    ),
  );
}
