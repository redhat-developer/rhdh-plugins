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

import { mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';
import { createLcoreForwarder } from './lcoreClient';

afterEach(() => {
  jest.restoreAllMocks();
});

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
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        Response.json(
          { error: 'Private runtime error details' },
          { status: upstream, headers: { 'Retry-After': '120' } },
        ),
      );
    const forward = createLcoreForwarder(
      'http://127.0.0.1:8090',
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
  },
);
