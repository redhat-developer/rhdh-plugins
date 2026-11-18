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
        const status = [400, 401, 403, 404, 409, 413, 422].includes(
          upstream.status,
        )
          ? upstream.status
          : 502;
        logger.warn('LCORE request failed', { status: upstream.status });
        response.status(status).json({ error: 'Chat runtime request failed' });
        return;
      }
      if (upstream.status === 204) {
        response.status(204).end();
        return;
      }
      const result = await upstream.json();
      response.status(upstream.status).json(result);
    } catch {
      logger.warn('LCORE request could not be completed');
      response.status(502).json({ error: 'Chat runtime unavailable' });
    }
  };
}
