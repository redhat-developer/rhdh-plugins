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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { createLoadingSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { createRouter } from './router';

const mockLogger: LoggerService = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

/** Builds a minimal mock Express request. */
function mockReq(
  overrides: Partial<{ params: Record<string, string>; path: string }> = {},
) {
  return {
    params: {},
    path: '/',
    method: 'GET',
    ...overrides,
  } as any;
}

/** Builds a chainable mock Express response with captured output. */
function mockRes() {
  const res: any = {
    _status: 200,
    _body: undefined,
    _headersSent: false,
    headersSent: false,
  };
  res.status = jest.fn((code: number) => {
    res._status = code;
    return res;
  });
  res.json = jest.fn((body: unknown) => {
    res._body = body;
    res._headersSent = true;
    res.headersSent = true;
    return res;
  });
  return res;
}

describe('npx-skill-connector router', () => {
  let router: any;
  let snapshots: Map<string, SkillSnapshot>;

  beforeAll(async () => {
    snapshots = new Map<string, SkillSnapshot>();
    router = await createRouter(mockLogger, snapshots);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('createRouter returns a router function', () => {
    // express-promise-router returns a function that can be used as middleware
    expect(typeof router).toBe('function');
  });

  it('router has route handlers registered', () => {
    // The router should have a stack with route layers
    expect(router.stack).toBeDefined();
    expect(router.stack.length).toBeGreaterThan(0);
  });

  it('health route is registered at /health', () => {
    const healthLayer = router.stack.find(
      (layer: any) => layer.route && layer.route.path === '/health',
    );
    expect(healthLayer).toBeDefined();
    expect(healthLayer.route.methods.get).toBe(true);
  });

  it('skills route is registered at /skills/:sourceId', () => {
    const skillsLayer = router.stack.find(
      (layer: any) => layer.route && layer.route.path === '/skills/:sourceId',
    );
    expect(skillsLayer).toBeDefined();
    expect(skillsLayer.route.methods.get).toBe(true);
  });

  describe('handler logic', () => {
    it('health handler returns ok', async () => {
      const healthLayer = router.stack.find(
        (layer: any) => layer.route && layer.route.path === '/health',
      );
      const handler = healthLayer.route.stack[0].handle;
      const req = mockReq();
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('skills handler returns 404 for unknown source', async () => {
      const skillsLayer = router.stack.find(
        (layer: any) => layer.route && layer.route.path === '/skills/:sourceId',
      );
      const handler = skillsLayer.route.stack[0].handle;
      const req = mockReq({ params: { sourceId: 'unknown' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Unknown') }),
      );
    });

    it('skills handler returns loading snapshot for configured source', async () => {
      snapshots.set(
        'rhess',
        createLoadingSnapshot({ id: 'rhess', type: 'npx' }),
      );
      const skillsLayer = router.stack.find(
        (layer: any) => layer.route && layer.route.path === '/skills/:sourceId',
      );
      const handler = skillsLayer.route.stack[0].handle;
      const req = mockReq({ params: { sourceId: 'rhess' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          schemaVersion: '1',
          source: { id: 'rhess', type: 'npx' },
          status: 'loading',
          skills: [],
        }),
      );
    });

    it('skills handler returns ready snapshot with skills', async () => {
      const readySnapshot: SkillSnapshot = {
        schemaVersion: '1',
        source: { id: 'test-source', type: 'npx' },
        status: 'ready',
        observedAt: '2026-10-30T12:00:00.000Z',
        skills: [
          {
            key: 'my-skill',
            name: 'My Skill',
            description: 'A test skill',
            sourceUri: 'https://example.com/skills/my-skill.md',
            digest:
              'sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            extensions: { npx: { type: 'skill-md' } },
          },
        ],
        failedSkillKeys: [],
      };
      snapshots.set('test-source', readySnapshot);
      const skillsLayer = router.stack.find(
        (layer: any) => layer.route && layer.route.path === '/skills/:sourceId',
      );
      const handler = skillsLayer.route.stack[0].handle;
      const req = mockReq({ params: { sourceId: 'test-source' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ready',
          skills: expect.arrayContaining([
            expect.objectContaining({ key: 'my-skill' }),
          ]),
        }),
      );
    });
  });
});
