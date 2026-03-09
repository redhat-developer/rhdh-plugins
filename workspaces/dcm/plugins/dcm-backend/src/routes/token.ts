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
 * WITHOUT WARRANTIES OR CONDITIONS OF THE LICENSE, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { RequestHandler } from 'express';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { RouterOptions } from '../models/RouterOptions';
import { getTokenFromApi } from '../util/tokenUtil';
import { authorize } from './access';

export const getToken =
  (options: RouterOptions): RequestHandler =>
  async (req, response) => {
    const { logger } = options;

    const decision = await authorize(req, options);
    if (decision !== AuthorizeResult.ALLOW) {
      logger.warn(
        'DCM token request denied: caller lacks dcm.plugin read permission',
      );
      response.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { accessToken, expiresAt } = await getTokenFromApi(options);
    response.json({ accessToken, expiresAt });
  };
