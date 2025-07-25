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

// const fetch = (await import('node-fetch')).default;

import {
  lightspeedChatCreatePermission,
  lightspeedChatDeletePermission,
  lightspeedChatReadPermission,
  lightspeedPermissions,
} from '@red-hat-developer-hub/backstage-plugin-lightspeed-common';

import { userPermissionAuthorization } from './permission';
import {
  DEFAULT_HISTORY_LENGTH,
  QueryRequestBody,
  RouterOptions,
} from './types';
import { validateCompletionsRequest } from './validation';

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

  const port = config.getOptionalNumber('lightspeed.servicePort') ?? 8080;
  const system_prompt = config.getOptionalString('lightspeed.systemPrompt');

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  const permissionIntegrationRouter = createPermissionIntegrationRouter({
    permissions: lightspeedPermissions,
  });
  router.use(permissionIntegrationRouter);

  const authorizer = userPermissionAuthorization(permissions);

  // Middleware proxy to exclude passthroughPaths
  router.use('/v1', async (req, res, next) => {
    const passthroughPaths = ['/query', '/feedback'];

    if (passthroughPaths.some(path => req.path.startsWith(path))) {
      return next(); // This will skip proxying and go to rcs endpoint handlers.
    }
    // TODO: parse server_id from req.body and get URL and token when multi-server is supported
    const credentials = await httpAuth.credentials(req);
    const user = await userInfo.getUserInfo(credentials);
    const userEntity = user.userEntityRef;

    logger.info(`receives call from user: ${userEntity}`);
    try {
      await authorizer.authorizeUser(lightspeedChatReadPermission, credentials);
    } catch (error) {
      if (error instanceof NotAllowedError) {
        logger.error(error.message);
        return res.status(403).json({ error: error.message });
      }
    }

    // For all other /v1/* requests, use the proxy to llm server
    const apiToken = config
      .getConfigArray('lightspeed.servers')[0]
      .getOptionalString('token'); // currently only single llm server is supported
    req.headers.authorization = `Bearer ${apiToken}`;
    // Proxy middleware configuration
    const apiProxy = createProxyMiddleware({
      target: config.getConfigArray('lightspeed.servers')[0].getString('url'), // currently only single llm server is supported
      changeOrigin: true,
    });
    return apiProxy(req, res, next);
  });

  // Middleware proxy to exclude rcs POST endpoints
  router.use('/', async (req, res, next) => {
    const passthroughPaths = ['/v1/query', '/v1/feedback'];

    if (passthroughPaths.includes(req.path)) {
      return next(); // This will skip proxying and go to POST endpoints
    }
    // TODO: parse server_id from req.body and get URL and token when multi-server is supported
    const credentials = await httpAuth.credentials(req);
    const user = await userInfo.getUserInfo(credentials);
    const userEntity = user.userEntityRef;

    logger.info(`receives call from user: ${userEntity}`);
    try {
      if (req.method === 'GET') {
        await authorizer.authorizeUser(
          lightspeedChatReadPermission,
          credentials,
        );
      } else if (req.method === 'DELETE') {
        await authorizer.authorizeUser(
          lightspeedChatDeletePermission,
          credentials,
        );
      }
    } catch (error) {
      if (error instanceof NotAllowedError) {
        logger.error(error.message);
        return res.status(403).json({ error: error.message });
      }
    }
    // Proxy middleware configuration
    const apiProxy = createProxyMiddleware({
      // target: config.getConfigArray('lightspeed.servers')[0].getString('url'), // currently only single llm server is supported
      target: `http://0.0.0.0:${port}`,
      changeOrigin: true,
      pathRewrite: (path, _) => {
        // Add user query parameter from the authenticated user
        const userQueryParam = `user_id=${encodeURIComponent(userEntity)}`;
        // Check if there are already query parameters
        let newPath = path.includes('?')
          ? `${path}&${userQueryParam}`
          : `${path}?${userQueryParam}`;
        if (
          !path.includes('history_length') &&
          path.includes('conversation_id')
        ) {
          const historyLengthQuery = `history_length=${DEFAULT_HISTORY_LENGTH}`;
          newPath = `${newPath}&${historyLengthQuery}`;
        }
        logger.info(`Rewriting path from ${path} to ${newPath}`);
        return newPath;
      },
    });
    return apiProxy(req, res, next);
  });

  router.post('/v1/feedback', async (request, response) => {
    try {
      const credentials = await httpAuth.credentials(request);
      const userEntity = await userInfo.getUserInfo(credentials);
      const user_id = userEntity.userEntityRef;

      logger.info(`/v1/feedback receives call from user: ${user_id}`);

      await authorizer.authorizeUser(
        lightspeedChatCreatePermission,
        credentials,
      );
      const userQueryParam = `user_id=${encodeURIComponent(user_id)}`;
      const requestBody = JSON.stringify(request.body);
      const fetchResponse = await fetch(
        `http://0.0.0.0:${port}/v1/feedback?${userQueryParam}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        },
      );

      if (!fetchResponse.ok) {
        // Read the error body
        const errorBody = await fetchResponse.json();
        const errormsg = `Error from road-core server: ${errorBody.error?.message || errorBody?.detail?.cause || 'Unknown error'}`;
        logger.error(errormsg);

        // Return a 500 status for any upstream error
        response.status(500).json({
          error: errormsg,
        });
      }

      const data = await fetchResponse.json();
      response.status(fetchResponse.status).json(data);
    } catch (error) {
      const errormsg = `Error while sending feedback: ${error}`;
      logger.error(errormsg);

      if (error instanceof NotAllowedError) {
        response.status(403).json({ error: error.message });
      } else {
        response.status(500).json({ error: errormsg });
      }
    }
  });
  router.post(
    '/v1/query',
    validateCompletionsRequest,
    async (request, response) => {
      const { provider }: Pick<QueryRequestBody, 'provider'> = request.body;
      try {
        const credentials = await httpAuth.credentials(request);
        const userEntity = await userInfo.getUserInfo(credentials);
        const user_id = userEntity.userEntityRef;

        logger.info(`/v1/query receives call from user: ${user_id}`);

        await authorizer.authorizeUser(
          lightspeedChatCreatePermission,
          credentials,
        );
        const userQueryParam = `user_id=${encodeURIComponent(user_id)}`;
        request.body.media_type = 'application/json'; // set media_type to receive start and end event

        // if system_prompt is defined in lightspeed config
        // set system_prompt to override the default rhdh system prompt
        if (system_prompt && system_prompt.trim().length > 0) {
          request.body.system_prompt = system_prompt;
        }

        const requestBody = JSON.stringify(request.body);
        const fetchResponse = await fetch(
          `http://0.0.0.0:${port}/v1/streaming_query?${userQueryParam}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
          },
        );

        if (!fetchResponse.ok) {
          // Read the error body
          const errorBody = await fetchResponse.json();
          const errormsg = `Error from road-core server: ${errorBody.error?.message || errorBody?.detail?.cause || 'Unknown error'}`;
          logger.error(errormsg);

          // Return a 500 status for any upstream error
          response.status(500).json({
            error: errormsg,
          });
        }

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
    },
  );

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
