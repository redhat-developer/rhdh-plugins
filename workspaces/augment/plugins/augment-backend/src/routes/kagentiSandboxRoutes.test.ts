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

import express from 'express';
import request from 'supertest';
import { registerKagentiSandboxRoutes } from './kagentiSandboxRoutes';
import { createMockLogger } from '../test-utils/mocks';

function createMockRouteContext() {
  const router = express.Router();
  const logger = createMockLogger();

  const mockSandboxClient = {
    listSessions: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getSession: jest
      .fn()
      .mockResolvedValue({ contextId: 'c1', status: 'completed' }),
    getSessionChain: jest.fn().mockResolvedValue({ chain: [] }),
    getSessionHistory: jest.fn().mockResolvedValue({ items: [] }),
    deleteSession: jest.fn().mockResolvedValue(undefined),
    renameSession: jest.fn().mockResolvedValue({ title: 'New' }),
    killSession: jest.fn().mockResolvedValue({ status: 'cancelled' }),
    approveSession: jest.fn().mockResolvedValue({ status: 'approved' }),
    denySession: jest.fn().mockResolvedValue({ status: 'denied' }),
    setVisibility: jest.fn().mockResolvedValue({ visibility: 'namespace' }),
    cleanupSessions: jest.fn().mockResolvedValue({ cleaned: 2 }),
    listSandboxAgents: jest.fn().mockResolvedValue([]),
    getAgentPodStatus: jest.fn().mockResolvedValue({ running: true }),
    getPodMetrics: jest.fn().mockResolvedValue({ cpu: '0.1' }),
    getPodEvents: jest.fn().mockResolvedValue({ events: [] }),
    sandboxChat: jest
      .fn()
      .mockResolvedValue({
        content: 'reply',
        context_id: 'c1',
        status: 'completed',
      }),
    getSandboxDefaults: jest.fn().mockResolvedValue({}),
    createSandbox: jest.fn().mockResolvedValue({ success: true }),
    deleteSandbox: jest.fn().mockResolvedValue({ success: true }),
    getSandboxConfig: jest.fn().mockResolvedValue({}),
    updateSandbox: jest.fn().mockResolvedValue({ success: true }),
    browseFiles: jest.fn().mockResolvedValue({ entries: [] }),
    listDirectory: jest.fn().mockResolvedValue({ entries: [] }),
    getFileContent: jest.fn().mockResolvedValue({ content: 'data' }),
    browseContextFiles: jest.fn().mockResolvedValue({ entries: [] }),
    getStorageStats: jest.fn().mockResolvedValue({ used: '1G' }),
    listSidecars: jest.fn().mockResolvedValue([]),
    enableSidecar: jest
      .fn()
      .mockResolvedValue({ sidecarType: 'observer', enabled: true }),
    disableSidecar: jest
      .fn()
      .mockResolvedValue({ status: 'disabled', sidecar_type: 'observer' }),
    updateSidecarConfig: jest
      .fn()
      .mockResolvedValue({ sidecarType: 'observer', enabled: true }),
    resetSidecar: jest.fn().mockResolvedValue({}),
    approveSidecar: jest
      .fn()
      .mockResolvedValue({ status: 'approved', id: 'm1' }),
    denySidecar: jest.fn().mockResolvedValue({ status: 'denied', id: 'm1' }),
    getSessionTokenUsage: jest.fn().mockResolvedValue({ totalTokens: 100 }),
    getSessionTreeUsage: jest.fn().mockResolvedValue({}),
    getEvents: jest.fn().mockResolvedValue({ events: [] }),
    getPaginatedTasks: jest.fn().mockResolvedValue({ tasks: [] }),
  };

  const mockProvider = {
    id: 'kagenti',
    displayName: 'Kagenti',
    getSandboxClient: () => mockSandboxClient,
    validateNamespace: jest.fn(),
    getFeatureFlags: () => ({
      sandbox: true,
      integrations: false,
      triggers: false,
    }),
    getConfig: () => ({
      verboseStreamLogging: false,
      pagination: { defaultLimit: 50, maxLimit: 200 },
      sandbox: { defaultSkill: undefined, sidecar: { autoApprove: false } },
    }),
  };

  const ctx = {
    router,
    logger,
    config: {} as never,
    provider: mockProvider as never,
    sessions: undefined,
    toErrorMessage: (e: unknown) =>
      e instanceof Error ? e.message : String(e),
    sendRouteError: jest.fn(
      (res: express.Response, _err: unknown, _label: string, msg: string) => {
        res.status(500).json({ error: msg });
      },
    ),
    missingSessions: jest.fn().mockReturnValue(false),
    missingConversations: jest.fn().mockReturnValue(false),
    getUserRef: jest.fn().mockResolvedValue('user:default/test'),
    checkIsAdmin: jest.fn().mockResolvedValue(true),
    requireAdminAccess: ((
      _req: express.Request,
      _res: express.Response,
      next: express.NextFunction,
    ) => next()) as express.RequestHandler,
    parseChatRequest: jest.fn(),
    parseApprovalRequest: jest.fn(),
  };

  registerKagentiSandboxRoutes(ctx);

  const app = express();
  app.use(express.json());
  app.use(router);

  return { app, mockSandboxClient };
}

describe('kagentiSandboxRoutes', () => {
  it('GET /kagenti/sandbox/:ns/sessions lists sessions', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/sandbox/ns1/sessions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sessions: [], total: 0 });
  });

  it('GET /kagenti/sandbox/:ns/sessions/:contextId gets session detail', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/sandbox/ns1/sessions/c1');
    expect(res.status).toBe(200);
    expect(res.body.contextId).toBe('c1');
  });

  it('DELETE /kagenti/sandbox/:ns/sessions/:contextId deletes session', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).delete('/kagenti/sandbox/ns1/sessions/c1');
    expect(res.status).toBe(204);
  });

  it('PUT /kagenti/sandbox/:ns/sessions/:contextId/rename renames session', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .put('/kagenti/sandbox/ns1/sessions/c1/rename')
      .send({ title: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New');
  });

  it('POST /kagenti/sandbox/:ns/cleanup cleans up sessions', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).post('/kagenti/sandbox/ns1/cleanup');
    expect(res.status).toBe(200);
    expect(res.body.cleaned).toBe(2);
  });

  it('POST /kagenti/sandbox/:ns/chat sends sandbox chat', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/sandbox/ns1/chat')
      .send({ message: 'Hello' });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('reply');
  });

  it('GET /kagenti/sandbox/defaults gets sandbox defaults', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/sandbox/defaults');
    expect(res.status).toBe(200);
  });

  it('GET /kagenti/sandbox/:ns/stats/:agent gets storage stats', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/sandbox/ns1/stats/agent1');
    expect(res.status).toBe(200);
  });

  it('GET /kagenti/sandbox/:ns/token-usage/sessions/:contextId gets token usage', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get(
      '/kagenti/sandbox/ns1/token-usage/sessions/ctx1',
    );
    expect(res.status).toBe(200);
    expect(res.body.totalTokens).toBe(100);
  });

  it('POST /kagenti/sandbox/:ns/sessions/:contextId/kill kills session', async () => {
    const { app, mockSandboxClient } = createMockRouteContext();
    const res = await request(app).post(
      '/kagenti/sandbox/ns1/sessions/c1/kill',
    );
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
    expect(mockSandboxClient.killSession).toHaveBeenCalledWith('ns1', 'c1');
  });

  it('POST /kagenti/sandbox/:ns/sessions/:contextId/approve approves session', async () => {
    const { app, mockSandboxClient } = createMockRouteContext();
    const res = await request(app).post(
      '/kagenti/sandbox/ns1/sessions/c1/approve',
    );
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(mockSandboxClient.approveSession).toHaveBeenCalledWith('ns1', 'c1');
  });

  it('POST /kagenti/sandbox/:ns/sessions/:contextId/deny denies session', async () => {
    const { app, mockSandboxClient } = createMockRouteContext();
    const res = await request(app).post(
      '/kagenti/sandbox/ns1/sessions/c1/deny',
    );
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('denied');
    expect(mockSandboxClient.denySession).toHaveBeenCalledWith('ns1', 'c1');
  });

  it('PUT /kagenti/sandbox/:ns/sessions/:contextId/visibility sets visibility', async () => {
    const { app, mockSandboxClient } = createMockRouteContext();
    const res = await request(app)
      .put('/kagenti/sandbox/ns1/sessions/c1/visibility')
      .send({ visibility: 'namespace' });
    expect(res.status).toBe(200);
    expect(res.body.visibility).toBe('namespace');
    expect(mockSandboxClient.setVisibility).toHaveBeenCalledWith(
      'ns1',
      'c1',
      'namespace',
    );
  });

  it('GET /kagenti/sandbox/:ns/agents lists sandbox agents', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/sandbox/ns1/agents');
    expect(res.status).toBe(200);
    expect(res.body.agents).toEqual([]);
  });

  it('GET /kagenti/sandbox/:ns/agents/:name/pod-status gets pod status', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get(
      '/kagenti/sandbox/ns1/agents/agent1/pod-status',
    );
    expect(res.status).toBe(200);
    expect(res.body.running).toBe(true);
  });

  it('POST /kagenti/sandbox/:ns/chat rejects empty body', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/sandbox/ns1/chat')
      .send({});
    expect(res.status).toBe(500);
  });

  it('GET /kagenti/sandbox/:ns/sessions/:contextId/chain gets session chain', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get(
      '/kagenti/sandbox/ns1/sessions/c1/chain',
    );
    expect(res.status).toBe(200);
    expect(res.body.chain).toEqual([]);
  });

  it('GET /kagenti/sandbox/:ns/sessions/:contextId/history gets session history', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get(
      '/kagenti/sandbox/ns1/sessions/c1/history',
    );
    expect(res.status).toBe(200);
  });

  it('filters private sessions for non-admin users', async () => {
    const router = express.Router();
    const logger = createMockLogger();

    const mockSandboxClient = {
      listSessions: jest.fn().mockResolvedValue({
        items: [
          { contextId: 'c1', visibility: 'namespace' },
          { contextId: 'c2', visibility: 'private' },
        ],
        total: 2,
      }),
      getSession: jest.fn(),
      getSessionChain: jest.fn(),
      getSessionHistory: jest.fn(),
      deleteSession: jest.fn(),
      renameSession: jest.fn(),
      killSession: jest.fn(),
      approveSession: jest.fn(),
      denySession: jest.fn(),
      setVisibility: jest.fn(),
      cleanupSessions: jest.fn(),
      listSandboxAgents: jest.fn(),
      getAgentPodStatus: jest.fn(),
      getPodMetrics: jest.fn(),
      getPodEvents: jest.fn(),
      sandboxChat: jest.fn(),
      getSandboxDefaults: jest.fn().mockResolvedValue({}),
      createSandbox: jest.fn(),
      deleteSandbox: jest.fn(),
      getSandboxConfig: jest.fn(),
      updateSandbox: jest.fn(),
      browseFiles: jest.fn(),
      listDirectory: jest.fn(),
      getFileContent: jest.fn(),
      browseContextFiles: jest.fn(),
      getStorageStats: jest.fn(),
      listSidecars: jest.fn(),
      enableSidecar: jest.fn(),
      disableSidecar: jest.fn(),
      updateSidecarConfig: jest.fn(),
      resetSidecar: jest.fn(),
      approveSidecar: jest.fn(),
      denySidecar: jest.fn(),
      getSessionTokenUsage: jest.fn(),
      getSessionTreeUsage: jest.fn(),
      getEvents: jest.fn(),
      getPaginatedTasks: jest.fn(),
    };

    const ctx = {
      router,
      logger,
      config: {} as never,
      provider: {
        id: 'kagenti',
        displayName: 'Kagenti',
        getSandboxClient: () => mockSandboxClient,
        validateNamespace: jest.fn(),
        getFeatureFlags: () => ({
          sandbox: true,
          integrations: false,
          triggers: false,
        }),
        getConfig: () => ({
          verboseStreamLogging: false,
          pagination: { defaultLimit: 50, maxLimit: 200 },
          sandbox: { defaultSkill: undefined, sidecar: { autoApprove: false } },
        }),
      } as never,
      sessions: undefined,
      toErrorMessage: (e: unknown) =>
        e instanceof Error ? e.message : String(e),
      sendRouteError: jest.fn(
        (res: express.Response, _err: unknown, _label: string, msg: string) => {
          res.status(500).json({ error: msg });
        },
      ),
      missingSessions: jest.fn().mockReturnValue(false),
      missingConversations: jest.fn().mockReturnValue(false),
      getUserRef: jest.fn().mockResolvedValue('user:default/test'),
      checkIsAdmin: jest.fn().mockResolvedValue(false),
      requireAdminAccess: ((
        _req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => next()) as express.RequestHandler,
      parseChatRequest: jest.fn(),
      parseApprovalRequest: jest.fn(),
    };

    registerKagentiSandboxRoutes(ctx);
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app).get('/kagenti/sandbox/ns1/sessions');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(1);
    expect(res.body.sessions[0].contextId).toBe('c1');
  });
});
