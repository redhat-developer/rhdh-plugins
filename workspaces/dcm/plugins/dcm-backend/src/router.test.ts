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
import { mockServices, type ServiceMock } from '@backstage/backend-test-utils';
import type { PermissionsService } from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';

const mockConfig = mockServices.rootConfig({
  data: {
    dcm: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    },
  },
});

describe('createRouter', () => {
  let app: express.Express;
  let permissionsMock: ServiceMock<PermissionsService>;

  beforeEach(async () => {
    permissionsMock = mockServices.permissions.mock({
      authorize: jest
        .fn()
        .mockResolvedValue([{ result: AuthorizeResult.ALLOW }]),
    });

    const httpAuthMock = mockServices.httpAuth.mock({
      credentials: jest.fn().mockResolvedValue({
        principal: { userEntityRef: 'user:default/test' },
      }),
    });

    const router = await createRouter({
      logger: mockServices.rootLogger(),
      config: mockConfig,
      httpAuth: httpAuthMock,
      permissions: permissionsMock,
      cache: mockServices.cache.mock(),
    });
    app = express();
    app.use(router);
  });

  it('should return ok for GET /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  describe('GET /access', () => {
    it('should return decision ALLOW when permissions authorize', async () => {
      permissionsMock.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(app).get('/access');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        decision: 'ALLOW',
        authorizeClusterIds: [],
        authorizeProjects: [],
      });
    });

    it('should return decision DENY when permissions deny', async () => {
      permissionsMock.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get('/access');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        decision: 'DENY',
        authorizeClusterIds: [],
        authorizeProjects: [],
      });
    });
  });

  describe('GET /token', () => {
    let fetchSpy: jest.SpyInstance;

    afterEach(() => {
      fetchSpy?.mockRestore();
    });

    it('should return 403 when permissions deny', async () => {
      permissionsMock.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app).get('/token');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Forbidden' });
    });

    it('should return access token when permissions allow and SSO returns token', async () => {
      permissionsMock.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'mock-sso-token',
          expires_in: 3600,
        }),
      } as Response);

      const response = await request(app).get('/token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        accessToken: 'mock-sso-token',
      });
      expect(response.body.expiresAt).toBeGreaterThan(Date.now());
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/protocol/openid-connect/token'),
        expect.any(Object),
      );
    });
  });
});
