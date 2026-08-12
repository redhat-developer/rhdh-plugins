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
import { aiCatalogAdminPermission } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { NotAllowedError } from '@backstage/errors';
import type { HealthStatusService } from './HealthStatusService';

/**
 * Options for creating ingestion health routes.
 *
 * @public
 */
export interface IngestionHealthRoutesOptions {
  /** The health status service. */
  healthService: HealthStatusService;
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service for extracting credentials. */
  httpAuth: HttpAuthService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Creates an Express router with ingestion health API routes.
 *
 * Routes:
 * - GET /ingestion-health — list connector health statuses
 *
 * Requires `aiCatalogAdminPermission` authorization.
 *
 * @public
 */
export function createIngestionHealthRoutes(
  options: IngestionHealthRoutesOptions,
): Router {
  const { healthService, permissions, httpAuth, logger } = options;
  const router = Router();

  // GET /ingestion-health — list connector health statuses (task 2.2)
  router.get('/ingestion-health', async (req, res, next) => {
    try {
      // Extract credentials for authorization and structured logging
      const credentials = await httpAuth.credentials(req);

      // Enforce AI Catalog admin permission (openspec health-status-api)
      const [decision] = await permissions.authorize(
        [{ permission: aiCatalogAdminPermission }],
        { credentials },
      );
      if (decision.result !== AuthorizeResult.ALLOW) {
        throw new NotAllowedError(
          'Insufficient permissions to view ingestion health',
        );
      }

      const principal = credentials.principal as
        | { userEntityRef?: string }
        | undefined;
      const userRef = principal?.userEntityRef ?? 'unknown';

      // Parse query parameters (task 2.4)
      const includeDisabled = req.query.includeDisabled === 'true';

      logger.debug('Ingestion health request', { userRef, includeDisabled });

      // Get health statuses
      const statuses = await healthService.getHealthStatuses(includeDisabled);

      res.json(statuses);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
