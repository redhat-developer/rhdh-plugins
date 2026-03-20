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

import { type BackendFeature } from '@backstage/backend-plugin-api';
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { setupServer } from 'msw/node';
import request from 'supertest';

import { handlers } from '../../__fixtures__/handlers';
import { lcsHandlers } from '../../__fixtures__/lcsHandlers';
import {
  mcpHandlers,
  MOCK_MCP_ADDR,
  MOCK_MCP_VALID_TOKEN,
} from '../../__fixtures__/mcpHandlers';
import { lightspeedPlugin } from '../plugin';

const mockUserId = 'user:default/user1';

const BASE_CONFIG = {
  lightspeed: {
    servers: [
      {
        id: 'test-server',
        url: 'http://localhost:443/v1',
        token: 'dummy-token',
      },
    ],
  },
};

// URLs are not in app-config — they come from LCS (GET /v1/mcp-servers).
// The LCS mock in lcsHandlers returns URLs for 'static-mcp' and 'no-token-server'.
const MCP_CONFIG = {
  lightspeed: {
    ...BASE_CONFIG.lightspeed,
    mcpServers: [
      {
        name: 'static-mcp',
        token: MOCK_MCP_VALID_TOKEN,
      },
    ],
  },
};

const MCP_CONFIG_MULTI = {
  lightspeed: {
    ...BASE_CONFIG.lightspeed,
    mcpServers: [
      {
        name: 'static-mcp',
        token: MOCK_MCP_VALID_TOKEN,
      },
      {
        name: 'no-token-server',
      },
    ],
  },
};

jest.mock('@backstage/backend-plugin-api', () => ({
  ...jest.requireActual('@backstage/backend-plugin-api'),
  UserInfoService: jest.fn().mockImplementation(() => ({
    getUserInfo: jest.fn().mockResolvedValue({
      BackstageUserInfo: {
        userEntityRef: mockUserId,
      },
    }),
  })),
}));

describe('MCP server management endpoints', () => {
  const server = setupServer(...handlers, ...lcsHandlers, ...mcpHandlers);

  beforeAll(() => {
    server.listen({
      onUnhandledRequest: (req, print) => {
        if (req.url.includes('/api/lightspeed')) {
          return;
        }
        print.warning();
      },
    });
  });

  afterAll(() => {
    server.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  async function startBackendServer(
    config?: Record<PropertyKey, unknown>,
    authorizeResult?: AuthorizeResult.DENY | AuthorizeResult.ALLOW,
  ) {
    const features: (BackendFeature | Promise<{ default: BackendFeature }>)[] =
      [
        lightspeedPlugin,
        mockServices.rootLogger.factory(),
        mockServices.rootConfig.factory({
          data: { ...BASE_CONFIG, ...(config || {}) },
        }),
        mockServices.httpAuth.factory({
          defaultCredentials: mockCredentials.user(mockUserId),
        }),
        mockServices.permissions.mock({
          authorize: async () => [
            { result: authorizeResult ?? AuthorizeResult.ALLOW },
          ],
        }).factory,
        mockServices.userInfo.factory(),
      ];
    return (await startTestBackend({ features })).server;
  }

  // ─── GET /mcp-servers ─────────────────────────────────────────────

  describe('GET /mcp-servers', () => {
    it('returns empty list when no MCP servers configured', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        '/api/lightspeed/mcp-servers',
      );

      expect(response.status).toBe(200);
      expect(response.body.servers).toEqual([]);
    });

    it('returns static servers from config with defaults', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);
      const response = await request(backendServer).get(
        '/api/lightspeed/mcp-servers',
      );

      expect(response.status).toBe(200);
      expect(response.body.servers).toHaveLength(1);
      expect(response.body.servers[0]).toMatchObject({
        name: 'static-mcp',
        url: MOCK_MCP_ADDR,
        enabled: true,
        status: 'unknown',
        toolCount: 0,
        hasToken: true,
      });
    });

    it('shows hasToken false for servers without a token', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG_MULTI);
      const response = await request(backendServer).get(
        '/api/lightspeed/mcp-servers',
      );

      expect(response.status).toBe(200);
      expect(response.body.servers).toHaveLength(2);

      const noTokenServer = response.body.servers.find(
        (s: any) => s.name === 'no-token-server',
      );
      expect(noTokenServer.hasToken).toBe(false);

      const withTokenServer = response.body.servers.find(
        (s: any) => s.name === 'static-mcp',
      );
      expect(withTokenServer.hasToken).toBe(true);
    });

    it('reflects user settings after PATCH', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);

      await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/static-mcp')
        .send({ enabled: false });

      const response = await request(backendServer).get(
        '/api/lightspeed/mcp-servers',
      );

      expect(response.status).toBe(200);
      expect(response.body.servers[0].enabled).toBe(false);
    });

    it('returns 403 when permission denied', async () => {
      const backendServer = await startBackendServer(
        MCP_CONFIG,
        AuthorizeResult.DENY,
      );
      const response = await request(backendServer).get(
        '/api/lightspeed/mcp-servers',
      );

      expect(response.status).toBe(403);
    });
  });

  // ─── PATCH /mcp-servers/:name ───────────────────────────────────────

  describe('PATCH /mcp-servers/:name', () => {
    it('toggles enabled to false', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);
      const patchRes = await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/static-mcp')
        .send({ enabled: false });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.server.enabled).toBe(false);
      expect(patchRes.body.validation).toBeUndefined();
    });

    it('toggles enabled back to true', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);

      await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/static-mcp')
        .send({ enabled: false });

      const patchRes = await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/static-mcp')
        .send({ enabled: true });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.server.enabled).toBe(true);
    });

    it('updates token and validates successfully', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);
      const patchRes = await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/static-mcp')
        .send({ token: MOCK_MCP_VALID_TOKEN });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.server.status).toBe('connected');
      expect(patchRes.body.server.hasToken).toBe(true);
      expect(patchRes.body.validation).toBeDefined();
      expect(patchRes.body.validation.valid).toBe(true);
      expect(patchRes.body.validation.toolCount).toBe(3);
    });

    it('reports validation failure for bad token', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);
      const patchRes = await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/static-mcp')
        .send({ token: 'invalid-token' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.server.status).toBe('error');
      expect(patchRes.body.validation.valid).toBe(false);
    });

    it('returns 404 for server not in config', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);
      const patchRes = await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/nonexistent')
        .send({ enabled: false });

      expect(patchRes.status).toBe(404);
    });

    it('returns 400 when no fields provided', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);
      const patchRes = await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/static-mcp')
        .send({});

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.error).toContain('At least one of');
    });

    it('returns 403 when permission denied', async () => {
      const backendServer = await startBackendServer(
        MCP_CONFIG,
        AuthorizeResult.DENY,
      );
      const patchRes = await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/static-mcp')
        .send({ enabled: false });

      expect(patchRes.status).toBe(403);
    });
  });

  // ─── POST /mcp-servers/validate (generic) ─────────────────────────

  describe('POST /mcp-servers/validate', () => {
    it('validates valid credentials', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/mcp-servers/validate')
        .send({ url: MOCK_MCP_ADDR, token: MOCK_MCP_VALID_TOKEN });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.toolCount).toBe(3);
      expect(response.body.tools).toHaveLength(3);
    });

    it('validates invalid credentials', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/mcp-servers/validate')
        .send({ url: MOCK_MCP_ADDR, token: 'bad-token' });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
    });

    it('returns 400 when url or token missing', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/mcp-servers/validate')
        .send({ url: MOCK_MCP_ADDR });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('url and token are required');
    });
  });

  // ─── POST /mcp-servers/:name/validate (on-demand) ──────────────────

  describe('POST /mcp-servers/:name/validate', () => {
    it('validates using config token', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);
      const response = await request(backendServer).post(
        '/api/lightspeed/mcp-servers/static-mcp/validate',
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: 'static-mcp',
        status: 'connected',
        toolCount: 3,
      });
      expect(response.body.validation.valid).toBe(true);
    });

    it('validates using user override token', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG_MULTI);

      // Set a user token for the no-token-server
      await request(backendServer)
        .patch('/api/lightspeed/mcp-servers/no-token-server')
        .send({ token: MOCK_MCP_VALID_TOKEN });

      const response = await request(backendServer).post(
        '/api/lightspeed/mcp-servers/no-token-server/validate',
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('connected');
      expect(response.body.toolCount).toBe(3);
    });

    it('persists status after validation', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);

      await request(backendServer).post(
        '/api/lightspeed/mcp-servers/static-mcp/validate',
      );

      const listRes = await request(backendServer).get(
        '/api/lightspeed/mcp-servers',
      );

      expect(listRes.body.servers[0].status).toBe('connected');
      expect(listRes.body.servers[0].toolCount).toBe(3);
    });

    it('returns 404 for server not in config', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG);
      const response = await request(backendServer).post(
        '/api/lightspeed/mcp-servers/nonexistent/validate',
      );

      expect(response.status).toBe(404);
    });

    it('returns 400 when no token available', async () => {
      const backendServer = await startBackendServer(MCP_CONFIG_MULTI);
      const response = await request(backendServer).post(
        '/api/lightspeed/mcp-servers/no-token-server/validate',
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No token available');
    });

    it('returns 403 when permission denied', async () => {
      const backendServer = await startBackendServer(
        MCP_CONFIG,
        AuthorizeResult.DENY,
      );
      const response = await request(backendServer).post(
        '/api/lightspeed/mcp-servers/static-mcp/validate',
      );

      expect(response.status).toBe(403);
    });
  });
});
