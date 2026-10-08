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
import {
  AuthorizeResult,
  type BasicPermission,
} from '@backstage/plugin-permission-common';

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';

import {
  iaChatPermission,
  iaMcpToolsPermission,
  iaNotebooksPermission,
  iaPermissions,
  iaSkillsPermission,
} from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import { handlers, LOCAL_AI_ADDR } from '../../__fixtures__/handlers';
import { lcsHandlers, LOCAL_LCS_ADDR } from '../../__fixtures__/lcsHandlers';
import {
  mcpHandlers,
  MOCK_MCP_VALID_TOKEN,
} from '../../__fixtures__/mcpHandlers';
import { intelligentAssistantPlugin } from '../plugin';
import { VectorStoresOperator } from './notebooks/VectorStoresOperator';

const mockUserId = 'user:default/user1';
const mockToken = 'dummy-token';

const BASE_CONFIG = {
  'intelligent-assistant': {
    servers: [
      {
        id: 'test-server',
        url: LOCAL_AI_ADDR,
        token: mockToken,
      },
    ],
  },
};

const MCP_CONFIG = {
  'intelligent-assistant': {
    ...BASE_CONFIG['intelligent-assistant'],
    mcpServers: [
      {
        name: 'static-mcp',
        token: MOCK_MCP_VALID_TOKEN,
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

function selectiveAuthorize(allowedPermission: BasicPermission) {
  return jest.fn(async (requests: { permission: BasicPermission }[]) =>
    requests.map(({ permission }) => ({
      result:
        permission.name === allowedPermission.name
          ? AuthorizeResult.ALLOW
          : AuthorizeResult.DENY,
    })),
  );
}

describe('RBAC consolidated permissions integration', () => {
  const server = setupServer(...handlers, ...lcsHandlers, ...mcpHandlers);

  beforeAll(() => {
    server.listen({
      onUnhandledRequest: (req, print) => {
        if (req.url.includes('/api/intelligent-assistant')) {
          return;
        }
        print.warning();
      },
    });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    VectorStoresOperator.resetInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  async function startBackendServer(
    config?: Record<PropertyKey, unknown>,
    authorize?: jest.Mock,
  ) {
    const authorizeMock =
      authorize ?? jest.fn(async () => [{ result: AuthorizeResult.ALLOW }]);

    const features: (BackendFeature | Promise<{ default: BackendFeature }>)[] =
      [
        intelligentAssistantPlugin,
        mockServices.rootLogger.factory(),
        mockServices.rootConfig.factory({
          data: { ...BASE_CONFIG, ...(config || {}) },
        }),
        mockServices.httpAuth.factory({
          defaultCredentials: mockCredentials.user(mockUserId),
        }),
        mockServices.permissions.mock({
          authorize: authorizeMock,
        }).factory,
        mockServices.userInfo.factory(),
      ];

    const backend = await startTestBackend({ features });
    return { server: backend.server, authorize: authorizeMock };
  }

  describe('permission name contracts', () => {
    it('GET /v1/models checks intelligent-assistant.chat', async () => {
      const authorize = jest.fn(async () => [
        { result: AuthorizeResult.ALLOW },
      ]);
      const { server: backendServer } = await startBackendServer(
        undefined,
        authorize,
      );

      await request(backendServer).get('/api/intelligent-assistant/v1/models');

      expect(authorize).toHaveBeenCalledWith(
        [{ permission: iaChatPermission }],
        expect.objectContaining({ credentials: expect.anything() }),
      );
    });

    it('GET /notebook-conversation-ids checks intelligent-assistant.notebooks', async () => {
      server.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/vector-stores`, () => {
          return HttpResponse.json({ data: [] });
        }),
      );

      const authorize = jest.fn(async () => [
        { result: AuthorizeResult.ALLOW },
      ]);
      const { server: backendServer } = await startBackendServer(
        undefined,
        authorize,
      );

      await request(backendServer).get(
        '/api/intelligent-assistant/notebook-conversation-ids',
      );

      expect(authorize).toHaveBeenCalledWith(
        [{ permission: iaNotebooksPermission }],
        expect.objectContaining({ credentials: expect.anything() }),
      );
    });

    it('GET /mcp-servers checks intelligent-assistant.mcp.tools', async () => {
      const authorize = jest.fn(async () => [
        { result: AuthorizeResult.ALLOW },
      ]);
      const { server: backendServer } = await startBackendServer(
        MCP_CONFIG,
        authorize,
      );

      await request(backendServer).get(
        '/api/intelligent-assistant/mcp-servers',
      );

      expect(authorize).toHaveBeenCalledWith(
        [{ permission: iaMcpToolsPermission }],
        expect.objectContaining({ credentials: expect.anything() }),
      );
    });

    it('GET /v1/skills checks intelligent-assistant.skills', async () => {
      const authorize = jest.fn(async () => [
        { result: AuthorizeResult.ALLOW },
      ]);
      const { server: backendServer } = await startBackendServer(
        undefined,
        authorize,
      );

      await request(backendServer).get('/api/intelligent-assistant/v1/skills');

      expect(authorize).toHaveBeenCalledWith(
        [{ permission: iaSkillsPermission }],
        expect.objectContaining({ credentials: expect.anything() }),
      );
    });
  });

  describe('selective authorization', () => {
    it('allows chat routes only when intelligent-assistant.chat is granted', async () => {
      const authorize = selectiveAuthorize(iaChatPermission);
      const { server: backendServer } = await startBackendServer(
        MCP_CONFIG,
        authorize,
      );

      const chatResponse = await request(backendServer).get(
        '/api/intelligent-assistant/v1/models',
      );
      const mcpResponse = await request(backendServer).get(
        '/api/intelligent-assistant/mcp-servers',
      );
      const skillsResponse = await request(backendServer).get(
        '/api/intelligent-assistant/v1/skills',
      );

      expect(chatResponse.status).toBe(200);
      expect(mcpResponse.status).toBe(403);
      expect(skillsResponse.status).toBe(403);
    });

    it('allows notebooks routes only when intelligent-assistant.notebooks is granted', async () => {
      server.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/vector-stores`, () => {
          return HttpResponse.json({ data: [] });
        }),
      );

      const authorize = selectiveAuthorize(iaNotebooksPermission);
      const { server: backendServer } = await startBackendServer(
        undefined,
        authorize,
      );

      const notebooksResponse = await request(backendServer).get(
        '/api/intelligent-assistant/notebook-conversation-ids',
      );
      const chatResponse = await request(backendServer).get(
        '/api/intelligent-assistant/v1/models',
      );

      expect(notebooksResponse.status).toBe(200);
      expect(chatResponse.status).toBe(403);
    });

    it('allows MCP routes only when intelligent-assistant.mcp.tools is granted', async () => {
      const authorize = selectiveAuthorize(iaMcpToolsPermission);
      const { server: backendServer } = await startBackendServer(
        MCP_CONFIG,
        authorize,
      );

      const mcpResponse = await request(backendServer).get(
        '/api/intelligent-assistant/mcp-servers',
      );
      const chatResponse = await request(backendServer).get(
        '/api/intelligent-assistant/v1/models',
      );

      expect(mcpResponse.status).toBe(200);
      expect(chatResponse.status).toBe(403);
    });

    it('allows skills routes only when intelligent-assistant.skills is granted', async () => {
      const authorize = selectiveAuthorize(iaSkillsPermission);
      const { server: backendServer } = await startBackendServer(
        undefined,
        authorize,
      );

      const skillsResponse = await request(backendServer).get(
        '/api/intelligent-assistant/v1/skills',
      );
      const chatResponse = await request(backendServer).get(
        '/api/intelligent-assistant/v1/models',
      );

      expect(skillsResponse.status).toBe(200);
      expect(chatResponse.status).toBe(403);
    });
  });

  describe('permission integration router', () => {
    it('registers all consolidated IA permissions', async () => {
      const { server: backendServer } = await startBackendServer();

      const response = await request(backendServer).get(
        '/api/intelligent-assistant/.well-known/backstage/permissions/metadata',
      );

      expect(response.status).toBe(200);
      expect(response.body.permissions).toEqual(
        expect.arrayContaining(
          iaPermissions.map(permission =>
            expect.objectContaining({ name: permission.name }),
          ),
        ),
      );
      expect(response.body.permissions).toHaveLength(iaPermissions.length);
    });
  });
});
