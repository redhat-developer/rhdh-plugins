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
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { SCM_TOKENS_HEADER, validateScmTokensHeader } from '../validation';

/**
 * Reads and deletes the SCM token header, storing the parsed map in
 * `res.locals.scmTokens`. Register before the permission check and any
 * auditing.
 */
export function createScmTokensMiddleware(
  logger: LoggerService,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const raw = req.headers[SCM_TOKENS_HEADER];
    const rawStr = Array.isArray(raw) ? raw[0] : raw;
    delete req.headers[SCM_TOKENS_HEADER];

    if (rawStr) {
      try {
        res.locals.scmTokens = validateScmTokensHeader(rawStr, logger);
      } catch (e) {
        next(e);
        return;
      }
    }

    next();
  };
}

/**
 * Reads the parsed token map left behind by {@link createScmTokensMiddleware}.
 */
export function getScmTokens(res: Response): Record<string, string> {
  return (res.locals.scmTokens as Record<string, string> | undefined) ?? {};
}
