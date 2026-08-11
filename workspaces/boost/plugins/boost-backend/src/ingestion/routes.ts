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
} from '@backstage/backend-plugin-api';
import type { HealthStatusService } from './HealthStatusService';

/**
 * Options for creating ingestion health routes.
 *
 * @public
 */
export interface IngestionHealthRoutesOptions {
  /** The health status service. */
  healthService: HealthStatusService;
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
 * RBAC gating via `ai-catalog.admin` is deferred to Issue 26 (#4064).
 *
 * @public
 */
export function createIngestionHealthRoutes(
  options: IngestionHealthRoutesOptions,
): Router {
  const { healthService, httpAuth, logger } = options;
  const router = Router();

  // GET /ingestion-health — list connector health statuses (task 2.2)
  router.get('/ingestion-health', async (req, res, next) => {
    try {
      // Extract credentials for structured logging (task 2.6)
      const credentials = await httpAuth.credentials(req);
      const principal = credentials.principal as
        | { userEntityRef?: string }
        | undefined;
      const userRef = principal?.userEntityRef ?? 'unknown';

      // Parse query parameters (task 2.4)
      const includeDisabled = req.query.includeDisabled === 'true';

      logger.info(
        `Ingestion health request by ${userRef}${includeDisabled ? ' (includeDisabled=true)' : ''}`,
      );

      // Get health statuses
      const statuses = await healthService.getHealthStatuses(includeDisabled);

      res.json(statuses);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
