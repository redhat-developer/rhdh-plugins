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

import { request, type IncomingMessage } from 'node:http';
import { json } from 'node:stream/consumers';
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
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export function createLcoreForwarder(baseUrl: string, logger: LoggerService) {
  return async function forward(
    path: string,
    method: string,
    response: Response,
    body?: unknown,
  ) {
    const query = new URLSearchParams({
      user_id: response.locals.userEntityRef,
    });
    try {
      const payload = JSON.stringify(body);
      const upstream = await new Promise<IncomingMessage>((resolve, reject) => {
        const upstreamRequest = request(
          baseUrl,
          {
            // Pass the encoded path directly so URL parsing cannot normalize it.
            path: `${path}?${query}`,
            method,
            headers:
              payload === undefined
                ? undefined
                : {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                  },
            signal: AbortSignal.timeout(30_000),
          },
          resolve,
        );
        upstreamRequest.once('error', reject);
        upstreamRequest.end(payload);
      });
      const upstreamStatus = upstream.statusCode ?? HTTP_STATUS_BAD_GATEWAY;
      if (upstreamStatus < 200 || upstreamStatus >= 300) {
        upstream.destroy();
        if (REDIRECT_STATUSES.has(upstreamStatus)) {
          throw new Error('Unexpected LCORE redirect');
        }
        const status = PASSTHROUGH_ERROR_STATUSES.has(upstreamStatus)
          ? upstreamStatus
          : HTTP_STATUS_BAD_GATEWAY;
        if (status === HTTP_STATUS_TOO_MANY_REQUESTS) {
          const retryAfter = upstream.headers['retry-after'];
          if (retryAfter !== undefined) {
            response.set('Retry-After', retryAfter);
          }
        }
        logger.warn('LCORE request failed', { status: upstreamStatus });
        response.status(status).json({ error: 'Chat runtime request failed' });
        return;
      }
      if (upstreamStatus === HTTP_STATUS_NO_CONTENT) {
        upstream.resume();
        response.status(HTTP_STATUS_NO_CONTENT).end();
        return;
      }
      const result = await json(upstream);
      response.status(upstreamStatus).json(result);
    } catch {
      logger.warn('LCORE request could not be completed');
      response
        .status(HTTP_STATUS_BAD_GATEWAY)
        .json({ error: 'Chat runtime unavailable' });
    }
  };
}
