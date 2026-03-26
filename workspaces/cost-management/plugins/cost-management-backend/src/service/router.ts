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
import Router from 'express-promise-router';
import type { RouterOptions } from '../models/RouterOptions';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import {
  rosPluginPermissions,
  rosApplyPermissions,
  costPluginPermissions,
} from '@red-hat-developer-hub/plugin-cost-management-common/permissions';
import { getAccess } from '../routes/access';
import { getCostManagementAccess } from '../routes/costManagementAccess';
import { secureProxy } from '../routes/secureProxy';
import { applyRecommendation } from '../routes/applyRecommendation';

/** @public */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const router = Router();
  const permissionsIntegrationRouter = createPermissionIntegrationRouter({
    permissions: [
      ...rosPluginPermissions,
      ...rosApplyPermissions,
      ...costPluginPermissions,
    ],
  });

  router.use(express.json());
  router.use(permissionsIntegrationRouter);

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/access', getAccess(options));

  router.get('/access/cost-management', getCostManagementAccess(options));

  router.post('/apply-recommendation', applyRecommendation(options));

  router.all('/proxy/*', secureProxy(options));

  return router;
}
