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
import { registerKagentiAdminRoutes } from './kagentiAdminRoutes';
import { createMockLogger } from '../test-utils/mocks';

function createMockRouteContext(
  flags = { sandbox: true, integrations: true, triggers: true },
) {
  const router = express.Router();
  const logger = createMockLogger();

  const mockAdminClient = {
    listLlmModels: jest.fn().mockResolvedValue([{ id: 'llama3' }]),
    createTeam: jest.fn().mockResolvedValue({ teamId: 't1', namespace: 'ns1' }),
    listTeams: jest.fn().mockResolvedValue([]),
    getTeam: jest.fn().mockResolvedValue({ teamId: 't1', namespace: 'ns1' }),
    createKey: jest.fn().mockResolvedValue({ success: true }),
    listKeys: jest.fn().mockResolvedValue([]),
    deleteKey: jest.fn().mockResolvedValue({ success: true }),
    getAgentModels: jest.fn().mockResolvedValue([]),
    listIntegrations: jest.fn().mockResolvedValue({ items: [] }),
    getIntegration: jest
      .fn()
      .mockResolvedValue({ name: 'int1', namespace: 'ns1' }),
    createIntegration: jest.fn().mockResolvedValue({ success: true }),
    updateIntegration: jest.fn().mockResolvedValue({ success: true }),
    deleteIntegration: jest.fn().mockResolvedValue({ success: true }),
    testIntegration: jest.fn().mockResolvedValue({ success: true }),
    createTrigger: jest
      .fn()
      .mockResolvedValue({ sandbox_claim: 'claim-1', namespace: 'ns1' }),
  };

  const mockProvider = {
    id: 'kagenti',
    displayName: 'Kagenti',
    getAdminClient: () => mockAdminClient,
    getFeatureFlags: () => flags,
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

  registerKagentiAdminRoutes(ctx);

  const app = express();
  app.use(express.json());
  app.use(router);

  return { app, mockAdminClient };
}

describe('kagentiAdminRoutes', () => {
  it('GET /kagenti/models lists LLM models when sandbox is on', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/models');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('GET /kagenti/llm/teams lists teams', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/llm/teams');
    expect(res.status).toBe(200);
  });

  it('POST /kagenti/llm/teams creates a team', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/llm/teams')
      .send({ namespace: 'ns1' });
    expect(res.status).toBe(200);
    expect(res.body.teamId).toBe('t1');
  });

  it('GET /kagenti/llm/keys lists keys', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/llm/keys');
    expect(res.status).toBe(200);
  });

  it('GET /kagenti/integrations lists integrations', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).get('/kagenti/integrations');
    expect(res.status).toBe(200);
  });

  it('POST /kagenti/integrations creates integration', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/integrations')
      .send({ name: 'int1', namespace: 'ns1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /kagenti/integrations/:ns/:name/test tests integration', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app).post('/kagenti/integrations/ns1/int1/test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /kagenti/sandbox/trigger creates trigger', async () => {
    const { app } = createMockRouteContext();
    const res = await request(app)
      .post('/kagenti/sandbox/trigger')
      .send({ type: 'cron', namespace: 'ns1', schedule: '*/5 * * * *' });
    expect(res.status).toBe(200);
    expect(res.body.sandbox_claim).toBe('claim-1');
  });

  it('does not register model routes when sandbox is off', async () => {
    const { app } = createMockRouteContext({
      sandbox: false,
      integrations: false,
      triggers: false,
    });
    const res = await request(app).get('/kagenti/models');
    expect(res.status).toBe(404);
  });
});
