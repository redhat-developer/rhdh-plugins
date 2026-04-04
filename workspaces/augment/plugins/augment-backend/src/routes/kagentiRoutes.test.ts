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
import { InputError } from '@backstage/errors';
import { registerKagentiRoutes } from './kagentiRoutes';
import { createMockLogger } from '../test-utils/mocks';

function createMockRouteContext() {
  const router = express.Router();
  const logger = createMockLogger();

  const mockApiClient = {
    health: jest.fn().mockResolvedValue({ status: 'healthy' }),
    ready: jest.fn().mockResolvedValue({ status: 'ready' }),
    getFeatureFlags: jest
      .fn()
      .mockResolvedValue({
        sandbox: false,
        integrations: false,
        triggers: false,
      }),
    getDashboards: jest.fn().mockResolvedValue({ traces: 'http://traces' }),
    listNamespaces: jest.fn().mockResolvedValue({ namespaces: ['team1'] }),
    listAgents: jest.fn().mockResolvedValue({
      items: [
        {
          name: 'bot',
          namespace: 'team1',
          description: '',
          status: 'Running',
          labels: {},
          workloadType: 'deployment',
        },
      ],
    }),
    getAgent: jest
      .fn()
      .mockResolvedValue({
        metadata: {},
        spec: {},
        status: {},
        workloadType: 'deployment',
      }),
    getAgentCard: jest
      .fn()
      .mockResolvedValue({
        name: 'bot',
        description: 'Bot',
        version: '1.0',
        url: '',
        streaming: true,
        skills: [],
      }),
    getAgentRouteStatus: jest.fn().mockResolvedValue({ hasRoute: true }),
    createAgent: jest
      .fn()
      .mockResolvedValue({
        success: true,
        name: 'bot',
        namespace: 'team1',
        message: 'created',
      }),
    deleteAgent: jest
      .fn()
      .mockResolvedValue({ success: true, message: 'deleted' }),
    listMigratableAgents: jest
      .fn()
      .mockResolvedValue({ agents: [], total: 0, already_migrated: 0 }),
    migrateAgent: jest
      .fn()
      .mockResolvedValue({
        success: true,
        migrated: true,
        name: 'bot',
        namespace: 'team1',
        message: 'migrated',
        deployment_created: true,
        service_created: true,
        agent_crd_deleted: false,
      }),
    migrateAllAgents: jest
      .fn()
      .mockResolvedValue({
        namespace: 'team1',
        dry_run: true,
        delete_old: false,
        total: 0,
        migrated: [],
        skipped: [],
        failed: [],
      }),
    listBuildStrategies: jest.fn().mockResolvedValue({ strategies: [] }),
    getAgentBuildInfo: jest
      .fn()
      .mockResolvedValue({
        name: 'bot',
        namespace: 'team1',
        buildRegistered: true,
        outputImage: '',
        strategy: '',
        gitUrl: '',
        gitRevision: '',
        contextDir: '',
        hasBuildRun: false,
      }),
    triggerAgentBuildRun: jest
      .fn()
      .mockResolvedValue({
        success: true,
        buildRunName: 'br1',
        namespace: 'team1',
        buildName: 'b1',
      }),
    finalizeAgentBuild: jest
      .fn()
      .mockResolvedValue({
        success: true,
        name: 'bot',
        namespace: 'team1',
        message: 'finalized',
      }),
    parseEnv: jest.fn().mockResolvedValue({ envVars: [], warnings: [] }),
    fetchEnvUrl: jest.fn().mockResolvedValue({ content: '', url: '' }),
    listTools: jest.fn().mockResolvedValue({ items: [] }),
    getTool: jest
      .fn()
      .mockResolvedValue({
        metadata: {},
        spec: {},
        status: {},
        workloadType: 'deployment',
      }),
    getToolRouteStatus: jest.fn().mockResolvedValue({ hasRoute: false }),
    createTool: jest
      .fn()
      .mockResolvedValue({
        success: true,
        name: 'tool1',
        namespace: 'team1',
        message: 'created',
      }),
    deleteTool: jest
      .fn()
      .mockResolvedValue({ success: true, message: 'deleted' }),
    getToolBuildInfo: jest
      .fn()
      .mockResolvedValue({
        name: 'tool1',
        namespace: 'team1',
        buildRegistered: false,
        outputImage: '',
        strategy: '',
        gitUrl: '',
        gitRevision: '',
        contextDir: '',
        hasBuildRun: false,
      }),
    triggerToolBuildRun: jest
      .fn()
      .mockResolvedValue({
        success: true,
        buildRunName: 'br1',
        namespace: 'team1',
        buildName: 'b1',
      }),
    finalizeToolBuild: jest
      .fn()
      .mockResolvedValue({
        success: true,
        name: 'tool1',
        namespace: 'team1',
        message: 'finalized',
      }),
    connectTool: jest.fn().mockResolvedValue({ tools: [{ name: 'search' }] }),
    invokeTool: jest.fn().mockResolvedValue({ result: { data: 'ok' } }),
    listAllBuilds: jest.fn().mockResolvedValue({ items: [] }),
  };

  const mockProvider = {
    id: 'kagenti',
    displayName: 'Kagenti',
    getApiClient: () => mockApiClient,
    setUserContext: jest.fn(),
    validateNamespace: jest.fn(),
    getAgentCardCached: jest.fn().mockResolvedValue({
      card: { name: 'bot', description: 'Bot', version: '1.0', url: '', streaming: true, skills: [] },
      demands: {},
    }),
    getFeatureFlags: () => ({
      sandbox: false,
      integrations: false,
      triggers: false,
    }),
    getConfig: () => ({
      baseUrl: 'https://kagenti.example.com',
      namespace: 'team1',
      namespaces: undefined,
      showAllNamespaces: true,
      agentName: 'bot',
      agents: undefined,
      skipTlsVerify: false,
      verboseStreamLogging: false,
      requestTimeoutMs: 30_000,
      streamTimeoutMs: 300_000,
      maxRetries: 3,
      retryBaseDelayMs: 1000,
      tokenExpiryBufferSeconds: 60,
      dashboards: {},
      sandbox: {
        sessionTtlMinutes: undefined,
        defaultSkill: undefined,
        sidecar: { autoApprove: false },
      },
      migration: { deleteOld: false, dryRun: false },
      pagination: { defaultLimit: 50, maxLimit: 200 },
      auth: {
        tokenEndpoint: 'https://kc.example.com/token',
        clientId: 'client',
        clientSecret: 'secret',
      },
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
      (res: express.Response, err: unknown, _label: string, msg: string) => {
        const status = err instanceof InputError ? 400 : 500;
        res.status(status).json({ error: msg });
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

  registerKagentiRoutes(ctx);

  const app = express();
  app.use(express.json());
  app.use(router);

  return { app, mockApiClient };
}

describe('kagentiRoutes', () => {
  it('GET /kagenti/health returns combined health and ready', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ health: 'healthy', ready: true });
  });

  it('GET /kagenti/config/features returns feature flags', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/config/features');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      sandbox: false,
      integrations: false,
      triggers: false,
    });
  });

  it('GET /kagenti/namespaces returns namespace list', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/namespaces');
    expect(res.status).toBe(200);
    expect(res.body.namespaces).toEqual(['team1']);
  });

  it('GET /kagenti/agents returns agent list', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/agents?namespace=team1');
    expect(res.status).toBe(200);
    expect(res.body.agents).toHaveLength(1);
  });

  it('GET /kagenti/agents/:ns/:name returns agent detail with card', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/agents/team1/bot');
    expect(res.status).toBe(200);
    expect(res.body.agentCard).toBeDefined();
    expect(res.body.agentCard.name).toBe('bot');
  });

  it('POST /kagenti/agents creates an agent', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/agents')
      .send({ name: 'bot', namespace: 'team1', containerImage: 'img:v1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /kagenti/agents/:ns/:name deletes an agent', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).delete('/kagenti/agents/team1/bot');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /kagenti/tools returns tool list', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/tools?namespace=team1');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('POST /kagenti/tools/:ns/:name/connect discovers MCP tools', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).post('/kagenti/tools/team1/my-tool/connect');
    expect(res.status).toBe(200);
    expect(res.body.tools).toHaveLength(1);
  });

  it('POST /kagenti/tools/:ns/:name/invoke calls MCP tool', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/tools/team1/my-tool/invoke')
      .send({ tool_name: 'search', arguments: { query: 'hello' } });
    expect(res.status).toBe(200);
    expect(res.body.result).toEqual({ data: 'ok' });
  });

  it('POST /kagenti/tools/:ns/:name/invoke rejects missing tool_name', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/tools/team1/my-tool/invoke')
      .send({ arguments: { query: 'hello' } });
    expect(res.status).toBe(400);
  });

  it('POST /kagenti/agents/fetch-env-url rejects non-http URLs', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/agents/fetch-env-url')
      .send({ url: 'file:///etc/passwd' });
    expect(res.status).toBe(400);
  });

  it('GET /kagenti/config/dashboards merges config overrides', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/config/dashboards');
    expect(res.status).toBe(200);
    expect(res.body.traces).toBe('http://traces');
  });

  it('POST /kagenti/agents/:ns/:name/migrate uses config default for delete_old', async () => {
    const { app, mockApiClient } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/agents/team1/bot/migrate')
      .send({});
    expect(res.status).toBe(200);
    expect(mockApiClient.migrateAgent).toHaveBeenCalledWith(
      'team1',
      'bot',
      false,
    );
  });

  it('GET /kagenti/shipwright/builds returns build list', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/shipwright/builds');
    expect(res.status).toBe(200);
    expect(res.body.builds).toEqual([]);
  });

  it('GET /kagenti/agents/build-strategies returns strategies', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/agents/build-strategies');
    expect(res.status).toBe(200);
    expect(res.body.strategies).toEqual([]);
  });

  it('GET /kagenti/agents/:ns/:name/build-info returns build info', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/agents/team1/bot/build-info');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('bot');
    expect(res.body.buildRegistered).toBe(true);
  });

  it('POST /kagenti/agents/:ns/:name/buildrun triggers agent build', async () => {
    const { app, mockApiClient } = createMockRouteContext();
    const res = await request(app).post('/kagenti/agents/team1/bot/buildrun');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockApiClient.triggerAgentBuildRun).toHaveBeenCalledWith(
      'team1',
      'bot',
    );
  });

  it('POST /kagenti/agents/:ns/:name/finalize-build finalizes agent build', async () => {
    const { app, mockApiClient } = createMockRouteContext();
    const res = await request(app).post(
      '/kagenti/agents/team1/bot/finalize-build',
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockApiClient.finalizeAgentBuild).toHaveBeenCalledWith(
      'team1',
      'bot',
      expect.anything(),
    );
  });

  it('POST /kagenti/agents/parse-env parses env content', async () => {
    const { app, mockApiClient } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/agents/parse-env')
      .send({ content: 'FOO=bar' });
    expect(res.status).toBe(200);
    expect(mockApiClient.parseEnv).toHaveBeenCalled();
  });

  it('GET /kagenti/tools/:ns/:name returns tool detail', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/tools/team1/my-tool');
    expect(res.status).toBe(200);
    expect(res.body.metadata).toBeDefined();
  });

  it('POST /kagenti/tools creates a tool', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/tools')
      .send({ name: 'tool1', namespace: 'team1', containerImage: 'img:v1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /kagenti/tools rejects missing name', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/tools')
      .send({ namespace: 'team1', containerImage: 'img:v1' });
    expect(res.status).toBe(400);
  });

  it('DELETE /kagenti/tools/:ns/:name deletes a tool', async () => {
    const { app, mockApiClient } = createMockRouteContext();
    const res = await request(app).delete('/kagenti/tools/team1/my-tool');
    expect(res.status).toBe(200);
    expect(mockApiClient.deleteTool).toHaveBeenCalledWith('team1', 'my-tool');
  });

  it('GET /kagenti/tools/:ns/:name/build-info returns tool build info', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get(
      '/kagenti/tools/team1/tool1/build-info',
    );
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('tool1');
  });

  it('POST /kagenti/tools/:ns/:name/buildrun triggers tool build', async () => {
    const { app, mockApiClient } = createMockRouteContext();
    const res = await request(app).post(
      '/kagenti/tools/team1/tool1/buildrun',
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockApiClient.triggerToolBuildRun).toHaveBeenCalledWith(
      'team1',
      'tool1',
    );
  });

  it('POST /kagenti/tools/:ns/:name/finalize-build finalizes tool build', async () => {
    const { app, mockApiClient } = createMockRouteContext();
    const res = await request(app).post(
      '/kagenti/tools/team1/tool1/finalize-build',
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockApiClient.finalizeToolBuild).toHaveBeenCalledWith(
      'team1',
      'tool1',
      expect.anything(),
    );
  });

  it('GET /kagenti/tools/:ns/:name/route-status returns route status', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get(
      '/kagenti/tools/team1/my-tool/route-status',
    );
    expect(res.status).toBe(200);
    expect(res.body.hasRoute).toBe(false);
  });

  it('GET /kagenti/agents/migration/migratable returns migratable agents', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get(
      '/kagenti/agents/migration/migratable',
    );
    expect(res.status).toBe(200);
    expect(res.body.agents).toEqual([]);
  });

  it('namespace validation rejects disallowed namespace', async () => {
    const { app } = createMockRouteContext();
    const mockProvider = (app as any)._router;
    const ctx = createMockRouteContext();
    const providerWithReject = {
      ...ctx,
    };
    const appWithReject = express();
    const routerWithReject = express.Router();
    const loggerWithReject = createMockLogger();
    const mockApiReject = {
      ...ctx.mockApiClient,
    };
    const providerReject = {
      id: 'kagenti',
      displayName: 'Kagenti',
      getApiClient: () => mockApiReject,
      setUserContext: jest.fn(),
      validateNamespace: jest.fn().mockImplementation(() => {
        throw new Error('Namespace not allowed');
      }),
      getAgentCardCached: jest.fn().mockResolvedValue({
        card: { name: 'bot' },
        demands: {},
      }),
      getFeatureFlags: () => ({
        sandbox: false,
        integrations: false,
        triggers: false,
      }),
      getConfig: () => ({
        baseUrl: 'https://kagenti.example.com',
        namespace: 'team1',
        namespaces: undefined,
        showAllNamespaces: true,
        agentName: 'bot',
        agents: undefined,
        skipTlsVerify: false,
        verboseStreamLogging: false,
        requestTimeoutMs: 30_000,
        streamTimeoutMs: 300_000,
        maxRetries: 3,
        retryBaseDelayMs: 1000,
        tokenExpiryBufferSeconds: 60,
        dashboards: {},
        sandbox: {
          sessionTtlMinutes: undefined,
          defaultSkill: undefined,
          sidecar: { autoApprove: false },
        },
        migration: { deleteOld: false, dryRun: false },
        pagination: { defaultLimit: 50, maxLimit: 200 },
        auth: {
          tokenEndpoint: 'https://kc.example.com/token',
          clientId: 'client',
          clientSecret: 'secret',
        },
      }),
    };
    const sendErr = jest.fn(
      (res: express.Response, _err: unknown, _label: string, _msg: string, _extra?: Record<string, unknown>, statusCode?: number) => {
        res.status(statusCode ?? 500).json({ error: _msg });
      },
    );
    const ctxReject = {
      router: routerWithReject,
      logger: loggerWithReject,
      config: {} as never,
      provider: providerReject as never,
      sessions: undefined,
      toErrorMessage: (e: unknown) =>
        e instanceof Error ? e.message : String(e),
      sendRouteError: sendErr,
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
    registerKagentiRoutes(ctxReject);
    appWithReject.use(express.json());
    appWithReject.use(routerWithReject);

    const res = await request(appWithReject).get(
      '/kagenti/agents?namespace=forbidden',
    );
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Namespace access denied');
  });
});
