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
import { KonfluxLogger } from './helpers/logger';
import { isUserEntity } from '@backstage/catalog-model';

/** @public */
export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  httpAuth: HttpAuthService;
  catalog: CatalogService;
  userInfo: UserInfoService;
}

interface UserEmailInfo {
  email: string;
  userEntityRef?: string;
}

/**
 * Extract user email from user entity if available
 */
async function extractUserEmail(
  userEntityRef: string | undefined,
  catalog: CatalogService | undefined,
  credentials: any,
  konfluxLogger: KonfluxLogger,
  entityRef: string,
  resource: string,
): Promise<UserEmailInfo> {
  if (!userEntityRef || !catalog) {
    return { email: '' };
  }

  const userEntity = await catalog.getEntityByRef(userEntityRef, {
    credentials,
  });

  const email =
    userEntity && isUserEntity(userEntity)
      ? userEntity?.spec?.profile?.email ?? ''
      : '';

  if (!email) {
    konfluxLogger.debug('User email not found in user entity', {
      userEntityRef,
      entityRef,
      resource,
    });
  }

  return { email, userEntityRef };
}

/**
 * Handle errors and return appropriate HTTP status codes
 */
function handleError(
  error: Error | undefined,
  res: express.Response,
  konfluxLogger: KonfluxLogger,
  entityRef: string,
  resource: string,
): void {
  konfluxLogger.error('Error in aggregate resources endpoint', error, {
    entityRef,
    resource,
  });

  if (!(error instanceof Error)) {
    res.status(500).json({ error: 'Failed to aggregate resources' });
    return;
  }

  const message = error.message;

  // Validation errors (400)
  if (
    message.includes('cannot be empty') ||
    message.includes('Invalid') ||
    message.includes('too long') ||
    message.includes('too short')
  ) {
    res.status(400).json({ error: message });
    return;
  }

  // Entity not found (404)
  if (message.includes('Entity not found')) {
    res.status(404).json({ error: message });
    return;
  }

  // Service unavailable (503)
  if (message.includes('Catalog service not available')) {
    res.status(503).json({ error: 'Catalog service unavailable' });
    return;
  }

  // Impersonation errors (400)
  if (message.includes('required for impersonation')) {
    res.status(400).json({
      error: message,
      hint: 'User email must be configured in the user entity profile',
    });
    return;
  }

  // OIDC token errors (400)
  if (message.includes('OIDC authProvider configured but no token available')) {
    res.status(400).json({
      error: message,
      hint: 'OIDC token must be provided in x-oidc-token header',
    });
    return;
  }

  // Default error (500)
  res.status(500).json({ error: 'Failed to aggregate resources' });
}

/**
 * Create the Konflux backend router.
 *
 * @public
 */
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
      const { email, userEntityRef } = await extractUserEmail(
        user.userEntityRef,
        catalog,
        credentials,
        konfluxLogger,
        entityRef,
        resource,
      );

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
        email,
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
      handleError(error, res, konfluxLogger, entityRef, resource);
    }
  });

  return router;
}
