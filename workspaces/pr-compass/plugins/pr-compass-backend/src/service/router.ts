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
  HttpAuthService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { NotAllowedError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { pullRequestReadPermission } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import express from 'express';
import Router from 'express-promise-router';
import { createScmTokensMiddleware, getScmTokens } from '../middlewares';
import { validatePullRequestQuery } from '../validation';
import type { PullRequestService } from './PullRequestService';
import type { SourceResolver } from './SourceResolver';

export interface PrCompassRouterOptions {
  pullRequestService: PullRequestService;
  httpAuth: HttpAuthService;
  permissions: PermissionsService;
  sourceResolver: SourceResolver;
}

export async function createRouter(
  options: PrCompassRouterOptions,
): Promise<express.Router> {
  const { pullRequestService, sourceResolver, httpAuth, permissions } = options;

  const router = Router();

  router.use(express.json());

  router.use(createScmTokensMiddleware());

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/sources', async (req, res) => {
    await httpAuth.credentials(req, { allow: ['user'] });
    res.json({ sources: sourceResolver.listSources() });
  });

  router.get('/pull-requests', async (req, res) => {
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });

    const decision = (
      await permissions.authorize([{ permission: pullRequestReadPermission }], {
        credentials,
      })
    )[0];

    if (decision.result !== AuthorizeResult.ALLOW) {
      throw new NotAllowedError('Unauthorized');
    }

    const { page, pageSize, filters } = validatePullRequestQuery(req.query);

    const response = await pullRequestService.list({
      scmTokens: getScmTokens(res),
      filters,
      page,
      pageSize,
    });

    res.json(response);
  });

  return router;
}
