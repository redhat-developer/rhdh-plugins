/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

/* eslint-disable @backstage/no-undeclared-imports -- deps in dcm-backend package.json */
import { mockServices } from '@backstage/backend-test-utils';
import type { JsonObject } from '@backstage/types';
import express from 'express';
import request from 'supertest';

import { createDcmProxy } from './proxy';
import type { RouterOptions } from '../models/RouterOptions';

function makeApp(configData: JsonObject = {}, authenticated = true) {
  const options: RouterOptions = {
    logger: mockServices.rootLogger(),
    config: mockServices.rootConfig({ data: configData }),
    httpAuth: mockServices.httpAuth.mock({
      credentials: authenticated
        ? jest.fn().mockResolvedValue({
            principal: { userEntityRef: 'user:default/test' },
          })
        : jest.fn().mockRejectedValue(new Error('unauthenticated')),
    }),
    permissions: mockServices.permissions.mock(),
    cache: mockServices.cache.mock(),
  };
  const app = express();
  app.use(
    express.json({
      type: ['application/json', 'application/merge-patch+json'],
    }),
  );
  app.all('/proxy/*', createDcmProxy(options));
  return app;
}

const dcmToken = 'user-oidc-token';
const withDcmToken = (requestBuilder: request.Test) =>
  requestBuilder.set('X-DCM-OIDC-Token', dcmToken);

describe('createDcmProxy', () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it('returns 503 when dcm.apiUrl is not configured', async () => {
    const app = makeApp();
    const res = await withDcmToken(request(app).get('/proxy/providers'));
    expect(res.status).toBe(503);
  });

  it('requires normal RHDH authentication', async () => {
    const app = makeApp(
      { dcm: { apiUrl: 'https://control-plane.example.com' } },
      false,
    );
    const res = await withDcmToken(request(app).get('/proxy/providers'));
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('RHDH authentication');
  });

  it('requires the per-user DCM OIDC token', async () => {
    const app = makeApp({
      dcm: { apiUrl: 'https://control-plane.example.com' },
    });
    const res = await request(app).get('/proxy/providers');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('DCM OIDC authentication');
  });

  it('does not require or forward an OIDC token when DCM authentication is disabled', async () => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: { get: () => null },
      text: async () => '{}',
    } as unknown as Response);
    const app = makeApp({
      dcm: {
        apiUrl: 'https://control-plane.example.com',
        auth: { enabled: false },
      },
    });

    const res = await request(app).get('/proxy/providers');

    expect(res.status).toBe(200);
    expect(fetchSpy.mock.calls[0][1].headers).not.toHaveProperty(
      'Authorization',
    );
  });

  it('still requires normal RHDH authentication when DCM authentication is disabled', async () => {
    const app = makeApp(
      {
        dcm: {
          apiUrl: 'https://control-plane.example.com',
          auth: { enabled: false },
        },
      },
      false,
    );

    const res = await request(app).get('/proxy/providers');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('RHDH authentication');
  });

  it('returns 502 when the upstream fetch throws', async () => {
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Connection refused'));
    const app = makeApp({
      dcm: { apiUrl: 'https://control-plane.example.com' },
    });
    const res = await withDcmToken(request(app).get('/proxy/providers'));
    expect(res.status).toBe(502);
    expect(res.body.error).toContain('DCM API');
  });

  it('forwards the per-user token and preserves the request path', async () => {
    const upstreamBody = JSON.stringify({ items: [] });
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: {
        get: (h: string) => (h === 'content-type' ? 'application/json' : null),
      },
      text: async () => upstreamBody,
    } as unknown as Response);

    const app = makeApp({
      dcm: { apiUrl: 'https://control-plane.example.com' },
    });
    const res = await withDcmToken(
      request(app).get('/proxy/providers?foo=bar'),
    );

    expect(res.status).toBe(200);
    expect(res.text).toBe(upstreamBody);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const upstreamCall = fetchSpy.mock.calls[0];
    expect(upstreamCall[0]).toContain('/api/v1alpha1/providers?foo=bar');
    expect(upstreamCall[1].headers.Authorization).toBe(`Bearer ${dcmToken}`);
  });

  it('forwards a POST body', async () => {
    const requestBody = { name: 'my-provider' };
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 201,
      ok: true,
      headers: {
        get: (h: string) => (h === 'content-type' ? 'application/json' : null),
      },
      text: async () => JSON.stringify(requestBody),
    } as unknown as Response);

    const app = makeApp({
      dcm: { apiUrl: 'https://control-plane.example.com' },
    });
    const res = await withDcmToken(
      request(app)
        .post('/proxy/providers')
        .send(requestBody)
        .set('Content-Type', 'application/json'),
    );

    expect(res.status).toBe(201);
    const upstreamCall = fetchSpy.mock.calls[0];
    expect(upstreamCall[1].method).toBe('POST');
    expect(JSON.parse(upstreamCall[1].body)).toEqual(requestBody);
  });

  it('forwards a PATCH body and handles 204 responses', async () => {
    const patch = { display_name: 'updated', spec: { fields: [] } };
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 204,
      ok: true,
      headers: { get: () => null },
      text: async () => '',
    } as unknown as Response);

    const app = makeApp({
      dcm: { apiGatewayUrl: 'https://gateway.example.com' },
    });
    const res = await withDcmToken(
      request(app)
        .patch('/proxy/catalog-items/test-id')
        .send(patch)
        .set('Content-Type', 'application/merge-patch+json'),
    );

    expect(res.status).toBe(204);
    const upstreamCall = fetchSpy.mock.calls[0];
    expect(upstreamCall[1].method).toBe('PATCH');
    expect(upstreamCall[1].headers['Content-Type']).toBe(
      'application/merge-patch+json',
    );
    expect(JSON.parse(upstreamCall[1].body)).toEqual(patch);
  });
});
