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
import { registerAgentRoutes } from './agentRoutes';
import { createMockLogger } from '../test-utils/mocks';
import type { AdminConfigService } from '../services/AdminConfigService';
import type { AdminConfigKey } from '@red-hat-developer-hub/backstage-plugin-augment-common';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface SetupOptions {
  isAdmin?: boolean;
  userRef?: string;
  /** Seed the in-memory config store before each test. */
  initialConfig?: Record<string, unknown>;
  /** Provider agents returned by provider.listAgents */
  providerAgents?: Array<Record<string, unknown>>;
}

function setup(opts: SetupOptions = {}) {
  const { isAdmin = true, userRef = 'user:default/admin' } = opts;

  const store: Record<string, unknown> = { ...(opts.initialConfig ?? {}) };

  const adminConfig: jest.Mocked<
    Pick<AdminConfigService, 'get' | 'set' | 'delete' | 'initialize'>
  > = {
    get: jest.fn(async (key: AdminConfigKey) => store[key] ?? null),
    set: jest.fn(
      async (key: AdminConfigKey, value: unknown, _updatedBy: string) => {
        store[key] = value;
      },
    ),
    delete: jest.fn(async (key: AdminConfigKey) => {
      delete store[key];
      return true;
    }),
    initialize: jest.fn(),
  };

  const router = express.Router();
  const logger = createMockLogger();

  const providerAgents = opts.providerAgents ?? [];

  const ctx = {
    router,
    logger,
    config: {} as never,
    provider: {
      id: 'llamastack',
      displayName: 'Llama Stack',
      listAgents: jest.fn().mockResolvedValue(providerAgents),
    } as never,
    orchestrationProvider: undefined,
    sessions: undefined,
    toErrorMessage: (e: unknown) =>
      e instanceof Error ? e.message : String(e),
    sendRouteError: jest.fn(
      (res: express.Response, err: unknown, _label: string, msg: string) => {
        const status =
          err instanceof Error && err.name === 'InputError' ? 400 : 500;
        res.status(status).json({ error: msg });
      },
    ),
    missingSessions: jest.fn().mockReturnValue(false),
    missingConversations: jest.fn().mockReturnValue(false),
    getUserRef: jest.fn().mockResolvedValue(userRef),
    checkIsAdmin: jest.fn().mockResolvedValue(isAdmin),
    requireAdminAccess: ((
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (!isAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      next();
    }) as express.RequestHandler,
    parseChatRequest: jest.fn(),
    parseApprovalRequest: jest.fn(),
  };

  registerAgentRoutes(ctx, adminConfig as unknown as AdminConfigService);

  const app = express();
  app.use(express.json());
  app.use(router);

  return { app, adminConfig, store, logger };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('agentRoutes', () => {
  // =========================================================================
  // GET /agents -- unified listing & scoping
  // =========================================================================

  describe('GET /agents', () => {
    it('returns an empty list when no agents exist', async () => {
      const { app } = setup();
      const res = await request(app).get('/agents');
      expect(res.status).toBe(200);
      expect(res.body.agents).toEqual([]);
      expect(res.body.sources).toBeDefined();
    });

    it('returns orchestration agents from the agents config key', async () => {
      const { app } = setup({
        initialConfig: {
          agents: {
            triage: { name: 'Triage', instructions: 'Route user queries' },
          },
        },
      });
      const res = await request(app).get('/agents');
      expect(res.status).toBe(200);
      expect(res.body.agents).toHaveLength(1);
      expect(res.body.agents[0].id).toBe('triage');
      expect(res.body.agents[0].source).toBe('orchestration');
    });

    it('non-admin sees only published, own, or unowned agents', async () => {
      const { app } = setup({
        isAdmin: false,
        userRef: 'user:default/alice',
        initialConfig: {
          agents: {
            public: { name: 'Public Bot', instructions: 'Help' },
            draft: { name: 'Draft Bot', instructions: 'In progress' },
            other: { name: 'Other Bot', instructions: 'Owned by bob' },
          },
          chatAgents: [
            {
              agentId: 'public',
              lifecycleStage: 'production',
              published: true,
              visible: true,
              featured: false,
            },
            {
              agentId: 'draft',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/alice',
            },
            {
              agentId: 'other',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/bob',
            },
          ],
        },
      });

      const res = await request(app).get('/agents');
      expect(res.status).toBe(200);
      const ids = res.body.agents.map((a: { id: string }) => a.id);
      expect(ids).toContain('public');
      expect(ids).toContain('draft');
      expect(ids).not.toContain('other');
    });

    it('admin sees all agents regardless of ownership', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: {
            public: { name: 'Public', instructions: 'x' },
            draft: { name: 'Draft', instructions: 'y' },
          },
          chatAgents: [
            {
              agentId: 'public',
              lifecycleStage: 'production',
              published: true,
              visible: true,
              featured: false,
            },
            {
              agentId: 'draft',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/bob',
            },
          ],
        },
      });

      const res = await request(app).get('/agents');
      expect(res.status).toBe(200);
      expect(res.body.agents).toHaveLength(2);
    });

    it('filters to only published when ?published=true', async () => {
      const { app } = setup({
        initialConfig: {
          agents: {
            prod: { name: 'Prod', instructions: 'x' },
            draft: { name: 'Draft', instructions: 'y' },
          },
          chatAgents: [
            {
              agentId: 'prod',
              lifecycleStage: 'production',
              published: true,
              visible: true,
              featured: false,
            },
            {
              agentId: 'draft',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app).get('/agents?published=true');
      expect(res.status).toBe(200);
      expect(res.body.agents).toHaveLength(1);
      expect(res.body.agents[0].id).toBe('prod');
    });
  });

  // =========================================================================
  // PUT /agents/:agentId/promote
  // =========================================================================

  describe('PUT /agents/:agentId/promote', () => {
    it('promotes draft to review for non-admin owner', async () => {
      const { app } = setup({
        isAdmin: false,
        userRef: 'user:default/alice',
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/alice',
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/promote')
        .send({ targetStage: 'review' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.lifecycleStage).toBe('review');
    });

    it('rejects non-admin attempting review → staging', async () => {
      const { app } = setup({
        isAdmin: false,
        userRef: 'user:default/alice',
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'review',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/alice',
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/promote')
        .send({ targetStage: 'staging' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Only admins');
    });

    it('blocks phantom draft promotion for non-admin', async () => {
      const { app } = setup({
        isAdmin: false,
        userRef: 'user:default/alice',
        initialConfig: {
          agents: { ghost: { name: 'Ghost', instructions: 'Boo' } },
        },
      });

      const res = await request(app)
        .put('/agents/ghost/promote')
        .send({ targetStage: 'review' });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found in lifecycle config');
    });

    it("blocks non-admin from promoting another user's agent", async () => {
      const { app } = setup({
        isAdmin: false,
        userRef: 'user:default/alice',
        initialConfig: {
          agents: { bobbot: { name: 'Bob Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'bobbot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/bob',
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/bobbot/promote')
        .send({ targetStage: 'review' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('only promote agents you created');
    });

    it('admin promotes review → staging', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'review',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/alice',
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/promote')
        .send({ targetStage: 'staging' });

      expect(res.status).toBe(200);
      expect(res.body.lifecycleStage).toBe('staging');
    });

    it('admin promotes staging → production', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'staging',
              published: false,
              visible: false,
              featured: false,
              version: 2,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/promote')
        .send({ targetStage: 'production' });

      expect(res.status).toBe(200);
      expect(res.body.lifecycleStage).toBe('production');
    });

    it('rejects invalid transition draft → production', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/promote')
        .send({ targetStage: 'production' });

      expect(res.status).toBe(400);
    });

    it('rejects invalid targetStage string', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/promote')
        .send({ targetStage: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('creates new config entry when agent has no existing config', async () => {
      const { app, store } = setup({
        isAdmin: true,
        userRef: 'user:default/admin',
        initialConfig: {
          agents: { newbot: { name: 'New Bot', instructions: 'Hello' } },
        },
      });

      const res = await request(app)
        .put('/agents/newbot/promote')
        .send({ targetStage: 'review' });

      expect(res.status).toBe(200);
      expect(res.body.lifecycleStage).toBe('review');

      const configs = store.chatAgents as Array<{
        agentId: string;
        createdBy?: string;
        createdAt?: string;
      }>;
      const entry = configs.find(c => c.agentId === 'newbot');
      expect(entry).toBeDefined();
      expect(entry?.createdBy).toBe('user:default/admin');
      expect(entry?.createdAt).toBeDefined();
    });

    it('clears rejection fields when re-promoting from draft', async () => {
      const { app, store } = setup({
        isAdmin: false,
        userRef: 'user:default/alice',
        initialConfig: {
          agents: {
            rejected: { name: 'Rejected Bot', instructions: 'Retry' },
          },
          chatAgents: [
            {
              agentId: 'rejected',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/alice',
              rejectionReason: 'Needs more work',
              rejectedBy: 'user:default/admin',
              rejectedAt: '2025-01-01T00:00:00.000Z',
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/rejected/promote')
        .send({ targetStage: 'review' });

      expect(res.status).toBe(200);
      const configs = store.chatAgents as Array<{
        agentId: string;
        rejectionReason?: string;
        rejectedBy?: string;
        rejectedAt?: string;
      }>;
      const entry = configs.find(c => c.agentId === 'rejected');
      expect(entry?.rejectionReason).toBeUndefined();
      expect(entry?.rejectedBy).toBeUndefined();
      expect(entry?.rejectedAt).toBeUndefined();
    });
  });

  // =========================================================================
  // PUT /agents/:agentId/demote
  // =========================================================================

  describe('PUT /agents/:agentId/demote', () => {
    it('admin demotes review → draft', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'review',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/demote')
        .send({ targetStage: 'draft' });

      expect(res.status).toBe(200);
      expect(res.body.lifecycleStage).toBe('draft');
    });

    it('stores rejection reason when demoting review → draft', async () => {
      const { app, store } = setup({
        isAdmin: true,
        userRef: 'user:default/admin',
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'review',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/demote')
        .send({ targetStage: 'draft', reason: 'Needs better prompt' });

      expect(res.status).toBe(200);
      const configs = store.chatAgents as Array<{
        agentId: string;
        rejectionReason?: string;
        rejectedBy?: string;
        rejectedAt?: string;
      }>;
      const entry = configs.find(c => c.agentId === 'mybot');
      expect(entry?.rejectionReason).toBe('Needs better prompt');
      expect(entry?.rejectedBy).toBe('user:default/admin');
      expect(entry?.rejectedAt).toBeDefined();
    });

    it('rejects non-admin access to demote', async () => {
      const { app } = setup({
        isAdmin: false,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'review',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/demote')
        .send({ targetStage: 'draft' });

      expect(res.status).toBe(403);
    });

    it('rejects invalid transition draft → draft', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/demote')
        .send({ targetStage: 'draft' });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // PUT /agents/:agentId/publish -- admin shortcut
  // =========================================================================

  describe('PUT /agents/:agentId/publish', () => {
    it('publishes an agent to production', async () => {
      const { app, store } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'staging',
              published: false,
              visible: false,
              featured: false,
              version: 2,
            },
          ],
        },
      });

      const res = await request(app).put('/agents/mybot/publish');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.published).toBe(true);

      const configs = store.chatAgents as Array<{
        agentId: string;
        lifecycleStage: string;
        published: boolean;
        version: number;
      }>;
      const entry = configs.find(c => c.agentId === 'mybot');
      expect(entry?.lifecycleStage).toBe('production');
      expect(entry?.published).toBe(true);
      expect(entry?.version).toBe(3);
    });

    it('reports lifecycle bypass when publishing from non-staging stage', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app).put('/agents/mybot/publish');

      expect(res.status).toBe(200);
      expect(res.body.lifecycleBypassed).toBe(true);
    });

    it('does not report bypass when publishing from staging', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'staging',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app).put('/agents/mybot/publish');

      expect(res.status).toBe(200);
      expect(res.body.lifecycleBypassed).toBe(false);
    });

    it('rejects non-admin access', async () => {
      const { app } = setup({ isAdmin: false });
      const res = await request(app).put('/agents/mybot/publish');
      expect(res.status).toBe(403);
    });

    it('creates new config entry for unknown agent', async () => {
      const { app, store } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { newbot: { name: 'New Bot', instructions: 'Hello' } },
        },
      });

      const res = await request(app).put('/agents/newbot/publish');

      expect(res.status).toBe(200);
      const configs = store.chatAgents as Array<{
        agentId: string;
        lifecycleStage: string;
        version: number;
      }>;
      const entry = configs.find(c => c.agentId === 'newbot');
      expect(entry?.lifecycleStage).toBe('production');
      expect(entry?.version).toBe(1);
    });
  });

  // =========================================================================
  // PUT /agents/:agentId/unpublish
  // =========================================================================

  describe('PUT /agents/:agentId/unpublish', () => {
    it('moves agent from production to staging', async () => {
      const { app, store } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'production',
              published: true,
              visible: true,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app).put('/agents/mybot/unpublish');

      expect(res.status).toBe(200);
      expect(res.body.published).toBe(false);

      const configs = store.chatAgents as Array<{
        agentId: string;
        lifecycleStage: string;
        published: boolean;
        visible: boolean;
      }>;
      const entry = configs.find(c => c.agentId === 'mybot');
      expect(entry?.lifecycleStage).toBe('staging');
      expect(entry?.published).toBe(false);
      expect(entry?.visible).toBe(false);
    });

    it('rejects non-admin access', async () => {
      const { app } = setup({ isAdmin: false });
      const res = await request(app).put('/agents/mybot/unpublish');
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // PUT /agents/bulk-publish
  // =========================================================================

  describe('PUT /agents/bulk-publish', () => {
    it('publishes multiple agents at once', async () => {
      const { app, store } = setup({
        isAdmin: true,
        initialConfig: {
          agents: {
            bot1: { name: 'Bot 1', instructions: 'x' },
            bot2: { name: 'Bot 2', instructions: 'y' },
          },
          chatAgents: [
            {
              agentId: 'bot1',
              lifecycleStage: 'staging',
              published: false,
              visible: false,
              featured: false,
            },
            {
              agentId: 'bot2',
              lifecycleStage: 'staging',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/bulk-publish')
        .send({ agentIds: ['bot1', 'bot2'], published: true });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.published).toBe(true);

      const configs = store.chatAgents as Array<{
        agentId: string;
        published: boolean;
      }>;
      for (const c of configs) {
        expect(c.published).toBe(true);
      }
    });

    it('reports bypassed agents when lifecycle is skipped', async () => {
      const { app } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/bulk-publish')
        .send({ agentIds: ['mybot'], published: true });

      expect(res.status).toBe(200);
      expect(res.body.lifecycleBypassed).toContain('mybot');
    });

    it('rejects invalid payload', async () => {
      const { app } = setup({ isAdmin: true });

      const res = await request(app)
        .put('/agents/bulk-publish')
        .send({ agentIds: 'bad', published: true });

      expect(res.status).toBe(400);
    });

    it('rejects non-admin access', async () => {
      const { app } = setup({ isAdmin: false });
      const res = await request(app)
        .put('/agents/bulk-publish')
        .send({ agentIds: ['bot1'], published: true });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // DELETE /agents/:agentId -- cascading delete
  // =========================================================================

  describe('DELETE /agents/:agentId', () => {
    it('admin deletes an agent and removes chatAgents config', async () => {
      const { app, store } = setup({
        isAdmin: true,
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app).delete('/agents/mybot');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cleanupResults.chatAgents).toBe('success');

      const configs = store.chatAgents as Array<{ agentId: string }>;
      expect(configs.find(c => c.agentId === 'mybot')).toBeUndefined();
    });

    it('cascading delete cleans up orchestration config for orchestration agents', async () => {
      const { app, store } = setup({
        isAdmin: true,
        initialConfig: {
          agents: {
            orchbot: { name: 'Orch Bot', instructions: 'Route queries' },
            otherbot: { name: 'Other', instructions: 'Keep me' },
          },
          chatAgents: [
            {
              agentId: 'orchbot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app).delete('/agents/orchbot');

      expect(res.status).toBe(200);
      expect(res.body.cleanupResults.orchestration).toBe('success');

      const agentMap = store.agents as Record<string, unknown>;
      expect(agentMap.orchbot).toBeUndefined();
      expect(agentMap.otherbot).toBeDefined();
    });

    it('non-admin can delete their own draft agent', async () => {
      const { app } = setup({
        isAdmin: false,
        userRef: 'user:default/alice',
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/alice',
            },
          ],
        },
      });

      const res = await request(app).delete('/agents/mybot');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("non-admin cannot delete another user's draft agent", async () => {
      const { app } = setup({
        isAdmin: false,
        userRef: 'user:default/alice',
        initialConfig: {
          agents: { bobbot: { name: 'Bob Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'bobbot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/bob',
            },
          ],
        },
      });

      const res = await request(app).delete('/agents/bobbot');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('only delete agents you created');
    });

    it('non-admin cannot delete non-draft agents', async () => {
      const { app } = setup({
        isAdmin: false,
        userRef: 'user:default/alice',
        initialConfig: {
          agents: { mybot: { name: 'My Bot', instructions: 'Help' } },
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'review',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/alice',
            },
          ],
        },
      });

      const res = await request(app).delete('/agents/mybot');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('only delete agents in draft stage');
    });

    it('returns 404 for non-existent agent', async () => {
      const { app } = setup({ isAdmin: true });

      const res = await request(app).delete('/agents/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('notes kagenti cleanup requirement for kagenti-sourced agents', async () => {
      const { app } = setup({
        isAdmin: true,
        providerAgents: [
          {
            id: 'team1/k8sbot',
            name: 'K8s Bot',
            status: 'Running',
            source: 'kagenti',
          },
        ],
        initialConfig: {
          chatAgents: [
            {
              agentId: 'team1/k8sbot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app).delete(
        `/agents/${encodeURIComponent('team1/k8sbot')}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.cleanupResults.kagenti).toContain(
        'requires DELETE /kagenti/agents',
      );
    });
  });

  // =========================================================================
  // PUT /agents/:agentId/config -- display config updates
  // =========================================================================

  describe('PUT /agents/:agentId/config', () => {
    it('updates existing agent config', async () => {
      const { app, store } = setup({
        isAdmin: true,
        initialConfig: {
          chatAgents: [
            {
              agentId: 'mybot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
            },
          ],
        },
      });

      const res = await request(app)
        .put('/agents/mybot/config')
        .send({ featured: true, visible: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const configs = store.chatAgents as Array<{
        agentId: string;
        featured: boolean;
        visible: boolean;
      }>;
      const entry = configs.find(c => c.agentId === 'mybot');
      expect(entry?.featured).toBe(true);
      expect(entry?.visible).toBe(true);
    });

    it('creates new config entry for unknown agent', async () => {
      const { app, store } = setup({ isAdmin: true });

      const res = await request(app)
        .put('/agents/newbot/config')
        .send({ featured: true });

      expect(res.status).toBe(200);
      const configs = store.chatAgents as Array<{
        agentId: string;
        featured: boolean;
      }>;
      expect(configs.find(c => c.agentId === 'newbot')).toBeDefined();
    });

    it('rejects non-admin access', async () => {
      const { app } = setup({ isAdmin: false });
      const res = await request(app)
        .put('/agents/mybot/config')
        .send({ featured: true });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // End-to-end lifecycle round-trip
  // =========================================================================

  describe('end-to-end lifecycle', () => {
    it('draft → review → staging → production → staging (unpublish)', async () => {
      const { app, store } = setup({
        isAdmin: true,
        userRef: 'user:default/admin',
        initialConfig: {
          agents: { e2ebot: { name: 'E2E Bot', instructions: 'Test' } },
          chatAgents: [
            {
              agentId: 'e2ebot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/admin',
            },
          ],
        },
      });

      // draft → review
      let res = await request(app)
        .put('/agents/e2ebot/promote')
        .send({ targetStage: 'review' });
      expect(res.status).toBe(200);
      expect(res.body.lifecycleStage).toBe('review');

      // review → staging
      res = await request(app)
        .put('/agents/e2ebot/promote')
        .send({ targetStage: 'staging' });
      expect(res.status).toBe(200);
      expect(res.body.lifecycleStage).toBe('staging');

      // staging → production
      res = await request(app)
        .put('/agents/e2ebot/promote')
        .send({ targetStage: 'production' });
      expect(res.status).toBe(200);
      expect(res.body.lifecycleStage).toBe('production');

      // verify it's published in listing
      res = await request(app).get('/agents?published=true');
      expect(res.body.agents.map((a: { id: string }) => a.id)).toContain(
        'e2ebot',
      );

      // unpublish → staging
      res = await request(app).put('/agents/e2ebot/unpublish');
      expect(res.status).toBe(200);
      expect(res.body.published).toBe(false);

      const configs = store.chatAgents as Array<{
        agentId: string;
        lifecycleStage: string;
      }>;
      const entry = configs.find(c => c.agentId === 'e2ebot');
      expect(entry?.lifecycleStage).toBe('staging');
    });

    it('reject round-trip: draft → review → reject (with reason) → re-submit', async () => {
      const { app, store } = setup({
        isAdmin: true,
        userRef: 'user:default/admin',
        initialConfig: {
          agents: {
            rejectbot: { name: 'Reject Bot', instructions: 'Test' },
          },
          chatAgents: [
            {
              agentId: 'rejectbot',
              lifecycleStage: 'draft',
              published: false,
              visible: false,
              featured: false,
              createdBy: 'user:default/admin',
            },
          ],
        },
      });

      // draft → review
      let res = await request(app)
        .put('/agents/rejectbot/promote')
        .send({ targetStage: 'review' });
      expect(res.status).toBe(200);

      // review → draft (rejection)
      res = await request(app)
        .put('/agents/rejectbot/demote')
        .send({ targetStage: 'draft', reason: 'Insufficient instructions' });
      expect(res.status).toBe(200);

      let configs = store.chatAgents as Array<{
        agentId: string;
        rejectionReason?: string;
        rejectedBy?: string;
      }>;
      let entry = configs.find(c => c.agentId === 'rejectbot');
      expect(entry?.rejectionReason).toBe('Insufficient instructions');

      // re-promote draft → review (should clear rejection fields)
      res = await request(app)
        .put('/agents/rejectbot/promote')
        .send({ targetStage: 'review' });
      expect(res.status).toBe(200);

      configs = store.chatAgents as Array<{
        agentId: string;
        rejectionReason?: string;
        rejectedBy?: string;
      }>;
      entry = configs.find(c => c.agentId === 'rejectbot');
      expect(entry?.rejectionReason).toBeUndefined();
      expect(entry?.rejectedBy).toBeUndefined();
    });
  });
});
