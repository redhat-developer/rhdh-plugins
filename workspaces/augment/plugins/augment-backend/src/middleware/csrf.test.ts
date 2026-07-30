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

function createCsrfApp(): express.Express {
  const app = express();
  app.use(express.json());

  const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  const CSRF_EXEMPT_PATHS = new Set(['/health']);
  app.use((req, res, next) => {
    if (!MUTATING_METHODS.has(req.method)) {
      next();
      return;
    }
    if (CSRF_EXEMPT_PATHS.has(req.path)) {
      next();
      return;
    }
    if (!req.headers['x-backstage-request']) {
      res.status(403).json({ error: 'Missing X-Backstage-Request header' });
      return;
    }
    next();
  });

  app.get('/status', (_req, res) => res.json({ ok: true }));
  app.post('/chat', (_req, res) => res.json({ ok: true }));
  app.put('/agents/a1/promote', (_req, res) => res.json({ ok: true }));
  app.delete('/sessions/s1', (_req, res) => res.json({ ok: true }));
  app.post('/health', (_req, res) => res.json({ ok: true }));

  return app;
}

describe('CSRF middleware', () => {
  const app = createCsrfApp();

  it('allows GET requests without CSRF header', async () => {
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
  });

  it('rejects POST without X-Backstage-Request header', async () => {
    const res = await request(app)
      .post('/chat')
      .send({ messages: [{ role: 'user', content: 'hi' }] });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('X-Backstage-Request');
  });

  it('rejects PUT without X-Backstage-Request header', async () => {
    const res = await request(app)
      .put('/agents/a1/promote')
      .send({ targetStage: 'review' });
    expect(res.status).toBe(403);
  });

  it('rejects DELETE without X-Backstage-Request header', async () => {
    const res = await request(app).delete('/sessions/s1');
    expect(res.status).toBe(403);
  });

  it('allows POST with X-Backstage-Request header', async () => {
    const res = await request(app)
      .post('/chat')
      .set('X-Backstage-Request', 'augment')
      .send({ messages: [{ role: 'user', content: 'hi' }] });
    expect(res.status).toBe(200);
  });

  it('allows PUT with X-Backstage-Request header', async () => {
    const res = await request(app)
      .put('/agents/a1/promote')
      .set('X-Backstage-Request', 'augment')
      .send({});
    expect(res.status).toBe(200);
  });

  it('exempts /health from CSRF check', async () => {
    const res = await request(app).post('/health').send({});
    expect(res.status).toBe(200);
  });
});
