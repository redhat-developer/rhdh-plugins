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
import { resolvePackagePath } from '@backstage/backend-plugin-api';

import { createOpenApiRouter } from '../schema/openapi';
import type { RouterDeps } from './types';
import { registerAdversarialAgentRoutes } from './adversarialAgents';
import { registerProjectRoutes } from './projects';
import { registerModuleRoutes } from './modules';
import { registerJobRoutes } from './jobs';
import { registerRuleRoutes } from './rules';
import { registerCollectArtifactsRoutes } from './collectArtifacts';
import { registerMigrationPlanRoutes } from './migrationPlans';

const publicDir = resolvePackagePath(
  '@red-hat-developer-hub/backstage-plugin-x2a-backend',
  'public',
);

export async function createRouter(deps: RouterDeps): Promise<express.Router> {
  // Create main router that will hold everything
  const mainRouter = express.Router();

  mainRouter.use('/static', express.static(publicDir));

  // Register collectArtifacts on main router (bypasses OpenAPI JSON parser)
  // This endpoint needs express.raw() middleware to get raw body bytes for HMAC validation
  registerCollectArtifactsRoutes(mainRouter, deps);

  // Create OpenAPI router for authenticated endpoints.
  // 512kb leaves room for a 100 kB migration plan after JSON escaping
  // (quotes and backslashes double). The save handler rejects anything
  // over MIGRATION_PLAN_MAX_CONTENT_BYTES with a clear error.
  const apiRouter = await createOpenApiRouter({
    middleware: [express.json({ limit: '512kb' })],
  });

  registerProjectRoutes(apiRouter, deps);
  registerModuleRoutes(apiRouter, deps);
  registerJobRoutes(apiRouter, deps);
  registerMigrationPlanRoutes(apiRouter, deps);
  registerRuleRoutes(apiRouter, deps);
  registerAdversarialAgentRoutes(apiRouter, deps);

  // Mount API router under main router
  mainRouter.use(apiRouter);

  return mainRouter;
}
