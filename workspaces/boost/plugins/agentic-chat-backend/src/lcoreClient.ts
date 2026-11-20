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
import type { Response } from 'express';
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_PAYLOAD_TOO_LARGE,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from './constants';

const PASSTHROUGH_ERROR_STATUSES = new Set([
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_PAYLOAD_TOO_LARGE,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  HTTP_STATUS_TOO_MANY_REQUESTS,
]);

export function createLcoreForwarder(baseUrl: string, logger: LoggerService) {
  return async function forward(
    path: string,
    method: string,
    response: Response,
    body?: unknown,
  ) {
    // Build a fresh URL: browser identity selectors and credentials are never forwarded.
    const url = new URL(path, baseUrl);
    url.searchParams.set('user_id', response.locals.userEntityRef);
    try {
      const upstream = await fetch(url, {
        method,
        ...(body !== undefined && {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      });
      if (!upstream.ok) {
        const status = PASSTHROUGH_ERROR_STATUSES.has(upstream.status)
          ? upstream.status
          : HTTP_STATUS_BAD_GATEWAY;
        if (status === HTTP_STATUS_TOO_MANY_REQUESTS) {
          const retryAfter = upstream.headers.get('Retry-After');
          if (retryAfter !== null) {
            response.set('Retry-After', retryAfter);
          }
        }
        logger.warn('LCORE request failed', { status: upstream.status });
        response.status(status).json({ error: 'Chat runtime request failed' });
        return;
      }
      if (upstream.status === HTTP_STATUS_NO_CONTENT) {
        response.status(HTTP_STATUS_NO_CONTENT).end();
        return;
      }
      const result = await upstream.json();
      response.status(upstream.status).json(result);
    } catch {
      logger.warn('LCORE request could not be completed');
      response
        .status(HTTP_STATUS_BAD_GATEWAY)
        .json({ error: 'Chat runtime unavailable' });
    }
  };
}
