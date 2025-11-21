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

import {
  LoggerService,
  RootConfigService,
  HttpAuthService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';
import express from 'express';
import Router from 'express-promise-router';
import { KonfluxService } from './services/konflux-service';
import { UserEntity } from '@backstage/catalog-model';
import { KonfluxLogger } from './helpers/logger';

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  httpAuth: HttpAuthService;
  catalog: CatalogService;
  userInfo: UserInfoService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, httpAuth, catalog, userInfo } = options;
  const router = Router();
  const konfluxLogger = new KonfluxLogger(logger);

  const service = KonfluxService.fromConfig(config, logger, catalog);

  router.use(express.json());

  // Aggregated resources endpoint
  router.get('/entity/:entityRef(*)/resource/:resource', async (req, res) => {
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const { entityRef, resource } = req.params;
    const {
      component, // Filter by component name
      continuationToken, // Pagination token from previous request
    } = req.query;

    try {
      const user = await userInfo.getUserInfo(credentials);
      let email;
      let userEntityRef: string | undefined;
      if (user.userEntityRef && catalog) {
        userEntityRef = user.userEntityRef;
        const userEntity = (await catalog.getEntityByRef(user.userEntityRef, {
          credentials,
        })) as UserEntity | undefined;
        email = userEntity?.spec?.profile?.email;
        if (!email) {
          konfluxLogger.debug('User email not found in user entity', {
            userEntityRef: user.userEntityRef,
            entityRef,
            resource,
          });
        }
      }

      const oidcToken = req.headers['x-oidc-token'] as string | undefined;
      if (oidcToken) {
        konfluxLogger.debug('OIDC token provided in request', {
          entityRef,
          resource,
        });
      }

      const result = await service.aggregateResources(
        entityRef,
        resource,
        credentials,
        email || '',
        {
          component: component as string,
          continuationToken: continuationToken as string | undefined,
        },
        oidcToken,
        userEntityRef,
      );

      // Log response size for debugging
      const responseSize = JSON.stringify(result).length;
      konfluxLogger.info('Request completed successfully', {
        entityRef,
        resource,
        responseSizeBytes: responseSize,
        responseSizeKB: (responseSize / 1024).toFixed(2),
        itemCount: result.data?.length || 0,
        clustersQueried: result.metadata?.clustersQueried?.length || 0,
        clusterErrors: result.clusterErrors?.length || 0,
        hasContinuationToken: !!result.continuationToken,
      });

      res.json(result);
    } catch (error) {
      konfluxLogger.error('Error in aggregate resources endpoint', error, {
        entityRef,
        resource,
      });

      if (error instanceof Error) {
        if (
          error.message.includes('cannot be empty') ||
          error.message.includes('Invalid') ||
          error.message.includes('too long') ||
          error.message.includes('too short')
        ) {
          res.status(400).json({ error: error.message });
          return;
        }

        if (error.message.includes('Entity not found')) {
          res.status(404).json({ error: error.message });
          return;
        }

        if (error.message.includes('Catalog service not available')) {
          res.status(503).json({ error: 'Catalog service unavailable' });
          return;
        }

        if (error.message.includes('required for impersonation')) {
          res.status(400).json({
            error: error.message,
            hint: 'User email must be configured in the user entity profile',
          });
          return;
        }

        if (
          error.message.includes(
            'OIDC authProvider configured but no token available',
          )
        ) {
          res.status(400).json({
            error: error.message,
            hint: 'OIDC token must be provided in x-oidc-token header',
          });
          return;
        }
      }

      res.status(500).json({ error: 'Failed to aggregate resources' });
    }
  });

  return router;
}
