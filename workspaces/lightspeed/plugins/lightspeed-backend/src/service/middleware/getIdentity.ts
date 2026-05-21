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

import type {
  BackstageCredentials,
  HttpAuthService,
  LoggerService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import { NotAllowedError } from '@backstage/errors';

import type { Request, RequestHandler } from 'express';

/**
 * Creates an Express middleware that resolves Backstage identity once per
 * request and attaches `req.credentials` and `req.userEntityRef`.
 *
 * A guard check skips resolution if both fields are already populated,
 * making it safe for multiple routers to apply independently.
 */
export function createIdentityMiddleware(
  httpAuth: HttpAuthService,
  userInfo: UserInfoService,
  logger: LoggerService,
): RequestHandler {
  return async (req, res, next) => {
    if (req.credentials && req.userEntityRef) {
      return next();
    }

    try {
      const credentials = await httpAuth.credentials(req);
      const user = await userInfo.getUserInfo(credentials);
      req.credentials = credentials;
      req.userEntityRef = user.userEntityRef;
      return next();
    } catch (error) {
      logger.error('Identity resolution failed for request');

      if (error instanceof NotAllowedError) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

/**
 * Extracts identity fields from the request, narrowing the types.
 * Throws if the identity middleware has not run.
 */
export function getIdentity(req: Request): {
  credentials: BackstageCredentials;
  userEntityRef: string;
} {
  if (!req.credentials || !req.userEntityRef) {
    throw new Error(
      'Identity middleware did not run — credentials/userEntityRef missing on request',
    );
  }
  return { credentials: req.credentials, userEntityRef: req.userEntityRef };
}
