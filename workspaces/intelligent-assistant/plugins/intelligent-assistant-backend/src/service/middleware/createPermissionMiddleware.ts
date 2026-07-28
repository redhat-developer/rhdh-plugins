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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { NotAllowedError } from '@backstage/errors';
import type { BasicPermission } from '@backstage/plugin-permission-common';

import type { RequestHandler } from 'express';

import type { Authorizer } from '../types';
import { getIdentity } from './getIdentity';

export function createPermissionMiddleware(
  authorizer: Authorizer,
  permission: BasicPermission,
  logger: LoggerService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { credentials } = getIdentity(req);
      await authorizer.authorizeUser(permission, credentials);
      return next();
    } catch (error) {
      if (error instanceof NotAllowedError) {
        logger.error(error.message);
        return res.status(403).json({ error: error.message });
      }
      logger.error(`Unexpected authorization error: ${error}`);
      return res.status(500).json({ error: 'Internal authorization error' });
    }
  };
}
