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

import express from 'express';

import { createOpenApiRouter } from '../schema/openapi';
import type { RouterDeps } from './types';
import { registerProjectRoutes } from './projects';
import { registerModuleRoutes } from './modules';
import { registerJobRoutes } from './jobs';

export async function createRouter(deps: RouterDeps): Promise<express.Router> {
  const router = await createOpenApiRouter();

  registerProjectRoutes(router, deps);
  registerModuleRoutes(router, deps);
  registerJobRoutes(router, deps);

  // TODO: Implement /collectArtifacts endpoints for callback from Kubernetes jobs
  // These endpoints should use Backstage service-to-service authentication with static tokens
  // See: https://backstage.io/docs/auth/service-to-service-auth#static-tokens
  //
  // The endpoints should:
  // 1. Accept POST requests from Kubernetes jobs with static token authentication
  // 2. Validate the callback token from the job (included in request body)
  // 3. Update job status in database based on job completion/failure
  // 4. Store artifacts (logs, results) returned by the job
  //
  // Endpoints to implement:
  // - POST /projects/:projectId/collectArtifacts (for init phase jobs)
  // - POST /projects/:projectId/modules/:moduleId/collectArtifacts (for analyze/migrate/publish phase jobs)

  return router;
}
