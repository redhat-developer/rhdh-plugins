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

/* eslint-disable @backstage/no-undeclared-imports -- deps in dcm-backend package.json */
import { mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createDcmProxy } from './proxy';
import type { RouterOptions } from '../models/RouterOptions';

const TOKEN_RESPONSE = {
  ok: true,
  json: async () => ({ access_token: 'test-token', expires_in: 3600 }),
} as Response;

function makeApp(configData: Record<string, Record<string, string>> = {}) {
  const options: RouterOptions = {
    logger: mockServices.rootLogger(),
    config: mockServices.rootConfig({ data: configData }),
    httpAuth: mockServices.httpAuth.mock({
      credentials: jest.fn().mockResolvedValue({
        principal: { userEntityRef: 'user:default/test' },
      }),
    }),
    permissions: mockServices.permissions.mock({
      authorize: jest.fn().mockResolvedValue([{ result: 'ALLOW' }]),
    }),
    cache: mockServices.cache.mock(),
  };
  const app = express();
  app.use(
    express.json({
      type: ['application/json', 'application/merge-patch+json'],
    }),
  );
  // Mount using a wildcard path matching the router convention
  app.all('/proxy/*', createDcmProxy(options));
  return app;
}

describe('createDcmProxy', () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it('returns 503 when dcm.apiGatewayUrl is not configured', async () => {
    const app = makeApp({ dcm: { clientId: 'id', clientSecret: 'secret' } });

    const res = await request(app).get('/proxy/providers');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('not configured'),
    });
  });

  it('returns 502 when token acquisition fails', async () => {
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('SSO unreachable'));

    const app = makeApp({
      dcm: {
        apiGatewayUrl: 'https://gateway.example.com',
        clientId: 'id',
        clientSecret: 'secret',
      },
    });

    const res = await request(app).get('/proxy/providers');

    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('access token'),
    });
  });

  it('returns 502 when the upstream fetch throws', async () => {
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      // First call: token fetch succeeds
      .mockResolvedValueOnce(TOKEN_RESPONSE)
      // Second call: upstream fetch throws
      .mockRejectedValueOnce(new Error('Connection refused'));

    const app = makeApp({
      dcm: {
        apiGatewayUrl: 'https://gateway.example.com',
        clientId: 'id',
        clientSecret: 'secret',
      },
    });

    const res = await request(app).get('/proxy/providers');

    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('DCM API gateway'),
    });
  });

  it('proxies a GET request and forwards the upstream response', async () => {
    const upstreamBody = JSON.stringify({ items: [] });
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      // Token fetch
      .mockResolvedValueOnce(TOKEN_RESPONSE)
      // Upstream GET
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: {
          get: (h: string) =>
            h === 'content-type' ? 'application/json' : null,
        },
        text: async () => upstreamBody,
      } as unknown as Response);

    const app = makeApp({
      dcm: {
        apiGatewayUrl: 'https://gateway.example.com',
        clientId: 'id',
        clientSecret: 'secret',
      },
    });

    const res = await request(app).get('/proxy/providers?foo=bar');

    expect(res.status).toBe(200);
    expect(res.text).toBe(upstreamBody);

    // Verify upstream URL contains path and query param
    const upstreamCall = fetchSpy.mock.calls[1];
    expect(upstreamCall[0]).toContain('/api/v1alpha1/providers');
    expect(upstreamCall[0]).toContain('foo=bar');

    // Verify auth header was injected
    expect(upstreamCall[1].headers.Authorization).toBe('Bearer test-token');
  });

  it('proxies a POST request and forwards the request body', async () => {
    const requestBody = { name: 'my-provider' };
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(TOKEN_RESPONSE)
      .mockResolvedValueOnce({
        status: 201,
        ok: true,
        headers: {
          get: (h: string) =>
            h === 'content-type' ? 'application/json' : null,
        },
        text: async () => JSON.stringify(requestBody),
      } as unknown as Response);

    const app = makeApp({
      dcm: {
        apiGatewayUrl: 'https://gateway.example.com',
        clientId: 'id',
        clientSecret: 'secret',
      },
    });

    const res = await request(app)
      .post('/proxy/providers')
      .send(requestBody)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);

    const upstreamCall = fetchSpy.mock.calls[1];
    expect(upstreamCall[1].method).toBe('POST');
    expect(JSON.parse(upstreamCall[1].body)).toEqual(requestBody);
  });

  it('proxies a PATCH request with application/merge-patch+json and forwards the body', async () => {
    const patch = { display_name: 'updated', spec: { fields: [] } };
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(TOKEN_RESPONSE)
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: {
          get: (h: string) =>
            h === 'content-type' ? 'application/json' : null,
        },
        text: async () => JSON.stringify(patch),
      } as unknown as Response);

    const app = makeApp({
      dcm: {
        apiGatewayUrl: 'https://gateway.example.com',
        clientId: 'id',
        clientSecret: 'secret',
      },
    });

    const res = await request(app)
      .patch('/proxy/catalog-items/test-id')
      .send(patch)
      .set('Content-Type', 'application/merge-patch+json');

    expect(res.status).toBe(200);

    const upstreamCall = fetchSpy.mock.calls[1];
    expect(upstreamCall[1].method).toBe('PATCH');
    expect(upstreamCall[1].headers['Content-Type']).toBe(
      'application/merge-patch+json',
    );
    expect(JSON.parse(upstreamCall[1].body)).toEqual(patch);
  });

  it('handles 204 No Content upstream responses without a body', async () => {
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(TOKEN_RESPONSE)
      .mockResolvedValueOnce({
        status: 204,
        ok: true,
        headers: { get: () => null },
        text: async () => '',
      } as unknown as Response);

    const app = makeApp({
      dcm: {
        apiGatewayUrl: 'https://gateway.example.com',
        clientId: 'id',
        clientSecret: 'secret',
      },
    });

    const res = await request(app).delete('/proxy/providers/test-id');

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });
});
