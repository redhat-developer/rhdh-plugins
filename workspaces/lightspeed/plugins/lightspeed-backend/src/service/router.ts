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

import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { NotAllowedError } from '@backstage/errors';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';

import express, { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fetch from 'node-fetch';

import {
  lightspeedConversationsCreatePermission,
  lightspeedConversationsDeletePermission,
  lightspeedConversationsReadPermission,
  lightspeedPermissions,
} from '@red-hat-developer-hub/backstage-plugin-lightspeed-common';

import { userPermissionAuthorization } from './permission';
import { QUERY_SYSTEM_INSTRUCTION } from './prompt';
import {
  DEFAULT_HISTORY_LENGTH,
  QueryRequestBody,
  RouterOptions,
} from './types';

/**
 * @public
 * The lightspeed backend router
 */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, httpAuth, userInfo, permissions } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  const permissionIntegrationRouter = createPermissionIntegrationRouter({
    permissions: lightspeedPermissions,
  });
  router.use(permissionIntegrationRouter);

  const authorizer = userPermissionAuthorization(permissions);

  // Middleware proxy to exclude /v1/query
  router.use('/v1', async (req, res, next) => {
    if (req.path === '/query') {
      return next(); // This will skip proxying and go to /v1/query endpoint
    }
    // TODO: parse server_id from req.body and get URL and token when multi-server is supported
    const credentials = await httpAuth.credentials(req);
    const user = await userInfo.getUserInfo(credentials);
    const userEntity = user.userEntityRef;

    logger.info(`receives call from user: ${userEntity}`);
    try {
      await authorizer.authorizeUser(
        lightspeedConversationsReadPermission,
        credentials,
      );
    } catch (error) {
      if (error instanceof NotAllowedError) {
        logger.error(error.message);
        res.status(403).json({ error: error.message });
      }
    }
    // let target = 'http://0.0.0.0:8080';
    // if (req.path === '/models') {
    // const target = `${config.getConfigArray('lightspeed.servers')[0].getString('url')}`;
    // For all other /v1/* requests, use the proxy to llm server
    const apiToken = config
      .getConfigArray('lightspeed.servers')[0]
      .getOptionalString('token'); // currently only single llm server is supported
    req.headers.authorization = `Bearer ${apiToken}`;
    // }
    // Proxy middleware configuration
    const apiProxy = createProxyMiddleware({
      target: config.getConfigArray('lightspeed.servers')[0].getString('url'), // currently only single llm server is supported
      changeOrigin: true,
    });
    console.log(req);
    return apiProxy(req, res, next);
  });

  // Middleware proxy to exclude /v1/query
  router.use('/', async (req, res, next) => {
    if (req.path === '/v1/query') {
      return next(); // This will skip proxying and go to /v1/query endpoint
    }
    // TODO: parse server_id from req.body and get URL and token when multi-server is supported
    const credentials = await httpAuth.credentials(req);
    const user = await userInfo.getUserInfo(credentials);
    const userEntity = user.userEntityRef;

    logger.info(`receives call from user: ${userEntity}`);
    try {
      if (req.method === 'GET') {
        await authorizer.authorizeUser(
          lightspeedConversationsReadPermission,
          credentials,
        );
      } else if (req.method === 'DELETE') {
        await authorizer.authorizeUser(
          lightspeedConversationsDeletePermission,
          credentials,
        );
      }
    } catch (error) {
      if (error instanceof NotAllowedError) {
        logger.error(error.message);
        res.status(403).json({ error: error.message });
      }
    }
    // Proxy middleware configuration
    const apiProxy = createProxyMiddleware({
      // target: config.getConfigArray('lightspeed.servers')[0].getString('url'), // currently only single llm server is supported
      target: 'http://0.0.0.0:8080',
      changeOrigin: true,
      pathRewrite: (path, _) => {
        // Add user query parameter from the authenticated user
        const userQueryParam = `user_id=${encodeURIComponent(userEntity)}`;
        // Check if there are already query parameters
        let newPath = path.includes('?')
          ? `${path}&${userQueryParam}`
          : `${path}?${userQueryParam}`;
        if (!path.includes('history_length')) {
          const historyLengthQuery = `history_length=${DEFAULT_HISTORY_LENGTH}`;
          newPath = `${newPath}&${historyLengthQuery}`;
        }
        logger.info(`Rewriting path from ${path} to ${newPath}`);
        return newPath;
      },
    });
    console.log(req);
    return apiProxy(req, res, next);
  });

  router.post('/v1/query', async (request, response) => {
    const {
      conversation_id,
      model,
      query,
      provider,
      system_prompt,
    }: QueryRequestBody = request.body;
    try {
      const credentials = await httpAuth.credentials(request);
      const userEntity = await userInfo.getUserInfo(credentials);
      const user_id = userEntity.userEntityRef;

      logger.info(`/v1/query receives call from user: ${user_id}`);

      await authorizer.authorizeUser(
        lightspeedConversationsCreatePermission,
        credentials,
      );
      const userQueryParam = `user_id=${encodeURIComponent(user_id)}`;
      if (!system_prompt) {
        request.body.system_prompt = QUERY_SYSTEM_INSTRUCTION;
      }
      const fetchResponse = await fetch(
        `http://0.0.0.0:8080/v1/streaming_query?${userQueryParam}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request.body), // directly pipe the original request body
        },
      );

      // Pipe the response back to the original response
      fetchResponse.body.pipe(response);
    } catch (error) {
      const errormsg = `Error fetching completions from ${provider}: ${error}`;
      logger.error(errormsg);

      if (error instanceof NotAllowedError) {
        response.status(403).json({ error: error.message });
      } else {
        response.status(500).json({ error: errormsg });
      }
    }
  });

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
