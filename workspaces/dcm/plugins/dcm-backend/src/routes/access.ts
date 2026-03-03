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
 * WITHOUT WARRANTIES OR CONDITIONS OF THE License, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { RequestHandler } from 'express';
import type { RouterOptions } from '../models/RouterOptions';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { dcmPluginPermissions } from '@red-hat-developer-hub/backstage-plugin-dcm-common';

async function authorize(
  request: Parameters<RequestHandler>[0],
  options: RouterOptions,
): Promise<AuthorizeResult> {
  const { permissions, httpAuth } = options;
  const credentials = await httpAuth.credentials(request);
  const decisions = await permissions.authorize(
    dcmPluginPermissions.map(permission => ({ permission })),
    { credentials },
  );
  const allow = decisions.find(d => d.result === AuthorizeResult.ALLOW);
  return allow ? AuthorizeResult.ALLOW : AuthorizeResult.DENY;
}

export const getAccess =
  (options: RouterOptions): RequestHandler =>
  async (req, response) => {
    const { logger } = options;

    const decision = await authorize(req, options);

    logger.info(`DCM access decision: ${decision}`);

    response.json({
      decision,
      authorizeClusterIds: [],
      authorizeProjects: [],
    });
  };
