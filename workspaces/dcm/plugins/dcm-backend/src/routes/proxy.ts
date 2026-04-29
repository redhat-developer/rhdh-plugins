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

import type { Request, Response } from 'express';
import type { RouterOptions } from '../models/RouterOptions';
import { getTokenFromApi } from '../util/tokenUtil';

const API_BASE_PATH = '/api/v1alpha1';

/**
 * Proxies all `ALL /proxy/*` requests to the DCM API Gateway.
 *
 * The wildcard path segment is appended to:
 *   `{dcm.apiGatewayUrl}/api/v1alpha1/<wildcardPath>`
 *
 * An SSO bearer token is injected automatically via `tokenUtil`.
 */
export function createDcmProxy(options: RouterOptions) {
  return async (req: Request, res: Response): Promise<void> => {
    const { logger, config } = options;

    const apiGatewayUrl = config.getOptionalString('dcm.apiGatewayUrl');
    if (!apiGatewayUrl) {
      logger.error(
        'dcm.apiGatewayUrl is not configured — cannot proxy DCM API requests.',
      );
      res
        .status(503)
        .json({ error: 'DCM API gateway is not configured on the server.' });
      return;
    }

    // req.params[0] is the captured wildcard after /proxy/
    const wildcardPath = (req.params as Record<string, string>)[0] ?? '';

    const targetUrl = new URL(
      `${API_BASE_PATH}/${wildcardPath}`,
      apiGatewayUrl,
    );

    // Forward all query parameters from the original request
    const incomingParams = new URLSearchParams(
      req.query as Record<string, string>,
    );
    incomingParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    logger.debug(
      `DCM proxy: ${req.method} ${req.path} → ${targetUrl.toString()}`,
    );

    let tokenResult;
    try {
      tokenResult = await getTokenFromApi(options);
    } catch (err) {
      logger.error(`DCM proxy: failed to obtain access token — ${err}`);
      res
        .status(502)
        .json({ error: 'Failed to obtain upstream access token.' });
      return;
    }

    const requestHeaders: Record<string, string> = {
      Accept: (req.headers.accept as string) || 'application/json',
    };

    // Only attach the Authorization header when an SSO token was obtained.
    // When clientId/clientSecret are not configured the token is empty and
    // the request is forwarded without auth (open/unauthenticated gateway).
    if (tokenResult.accessToken) {
      requestHeaders.Authorization = `Bearer ${tokenResult.accessToken}`;
    }

    // Forward Content-Type for requests that carry a body
    if (req.headers['content-type']) {
      requestHeaders['Content-Type'] = req.headers['content-type'] as string;
    }

    let upstreamResponse: globalThis.Response;
    try {
      upstreamResponse = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: requestHeaders,
        // Only attach body for methods that support it
        body:
          ['POST', 'PUT', 'PATCH'].includes(req.method) &&
          req.headers['content-length'] !== '0'
            ? JSON.stringify(req.body)
            : undefined,
      });
    } catch (err) {
      logger.error(`DCM proxy: upstream fetch failed — ${err}`);
      res.status(502).json({ error: 'Failed to reach the DCM API gateway.' });
      return;
    }

    res.status(upstreamResponse.status);

    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    if (upstreamResponse.status === 204) {
      res.end();
      return;
    }

    const body = await upstreamResponse.text();
    res.send(body);
  };
}
