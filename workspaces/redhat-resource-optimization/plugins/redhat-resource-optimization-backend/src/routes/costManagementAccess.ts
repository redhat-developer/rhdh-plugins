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

import type { RequestHandler } from 'express';
import type { RouterOptions } from '../models/RouterOptions';
import { authorize } from '../util/checkPermissions';
import { costPluginPermissions } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/permissions';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

export const getCostManagementAccess: (
  options: RouterOptions,
) => RequestHandler = options => async (_, response) => {
  const { logger, permissions, httpAuth } = options;
  let finalDecision = AuthorizeResult.DENY;

  // Check for cost.plugin permisssion
  // if user has ros.plugin permission, allow access to all the data
  const costPluginDecision = await authorize(
    _,
    costPluginPermissions,
    permissions,
    httpAuth,
  );

  logger.info(`Checking decision:`, costPluginDecision);

  if (costPluginDecision.result === AuthorizeResult.ALLOW) {
    finalDecision = AuthorizeResult.ALLOW;

    const body = {
      decision: finalDecision,
      authorizeClusterIds: [],
      authorizeProjects: [],
    };
    return response.json(body);
  }

  const body = {
    decision: finalDecision,
    authorizeClusterIds: [],
    authorizeProjects: [],
  };

  return response.json(body);
};
