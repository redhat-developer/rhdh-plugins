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

import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';
import { createLcoreForwarder } from './lcoreClient';

it.each([
  [400, 400],
  [401, 401],
  [403, 403],
  [404, 404],
  [409, 409],
  [413, 413],
  [422, 422],
  [503, 502],
])(
  'maps LCORE %i to %i with a sanitized response',
  async (upstream, expected) => {
    const runtime = express()
      .get('/v2/conversations', (_req, res) => {
        res
          .status(upstream)
          .set('Retry-After', '120')
          .json({ error: 'Private runtime error details' });
      })
      .listen(0, '127.0.0.1');

    try {
      await once(runtime, 'listening');
      const { port } = runtime.address() as AddressInfo;
      const forward = createLcoreForwarder(
        `http://127.0.0.1:${port}`,
        mockServices.logger.mock(),
      );
      const app = express();
      app.get('/conversations', async (_req, res) => {
        res.locals.userEntityRef = 'user:default/alice';
        await forward('/v2/conversations', 'GET', res);
      });

      const response = await request(app).get('/conversations');

      expect(response.status).toBe(expected);
      expect(response.body).toEqual({ error: 'Chat runtime request failed' });
      expect(response.headers['retry-after']).toBeUndefined();
    } finally {
      await new Promise<void>(resolve => runtime.close(() => resolve()));
    }
  },
);
