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

const API_BASE_PATH = '/api/v1alpha1';
const DCM_OIDC_TOKEN_HEADER = 'x-dcm-oidc-token';

/**
 * Proxies all `ALL /proxy/*` requests to the DCM control plane.
 *
 * The wildcard path segment is appended to:
 *   `{dcm.apiUrl}/api/v1alpha1/<wildcardPath>`
 *
 * The authenticated user's OIDC access token is forwarded from the dedicated
 * `X-DCM-OIDC-Token` header. The normal RHDH Authorization header remains
 * available to Backstage's httpAuth service and is never replaced.
 */
export function createDcmProxy(options: RouterOptions) {
  return async (req: Request, res: Response): Promise<void> => {
    const { logger, config } = options;

    // Prefer dcm.apiUrl (DCM_API_URL); legacy apiGatewayUrl eases migration.
    const apiUrl =
      config.getOptionalString('dcm.apiUrl') ??
      config.getOptionalString('dcm.apiGatewayUrl');
    if (!apiUrl) {
      logger.error(
        'dcm.apiUrl is not configured — cannot proxy DCM API requests.',
      );
      res
        .status(503)
        .json({ error: 'DCM API is not configured on the server.' });
      return;
    }

    // Authenticate the caller with the normal RHDH/Backstage bearer token.
    // This deliberately happens before reading the DCM token header so the
    // custom header cannot be used to bypass RHDH authentication.
    try {
      await options.httpAuth.credentials(req);
    } catch (_err) {
      res.status(401).json({ error: 'RHDH authentication is required.' });
      return;
    }

    const authEnabled = config.getOptionalBoolean('dcm.auth.enabled') ?? true;
    const dcmOidcToken = req.headers[DCM_OIDC_TOKEN_HEADER];
    if (
      authEnabled &&
      (typeof dcmOidcToken !== 'string' || !dcmOidcToken.trim())
    ) {
      res.status(401).json({ error: 'DCM OIDC authentication is required.' });
      return;
    }

    // req.params[0] is the captured wildcard after /proxy/
    const wildcardPath = (req.params as Record<string, string>)[0] ?? '';

    const targetUrl = new URL(`${API_BASE_PATH}/${wildcardPath}`, apiUrl);

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

    const requestHeaders: Record<string, string> = {
      Accept: (req.headers.accept as string) || 'application/json',
      ...(authEnabled ? { Authorization: `Bearer ${dcmOidcToken}` } : {}),
    };

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
      res.status(502).json({ error: 'Failed to reach the DCM API.' });
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
