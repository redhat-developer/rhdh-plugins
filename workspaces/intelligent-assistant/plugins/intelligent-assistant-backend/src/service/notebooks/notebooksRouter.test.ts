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

import { mockServices } from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import express from 'express';
import { setupServer } from 'msw/node';
import request from 'supertest';

import {
  lightspeedCoreHandlers,
  resetMockStorage,
} from '../../../__fixtures__/lightspeedCoreHandlers';
import { createNotebooksRouter } from './notebooksRouters';
import { VectorStoresOperator } from './VectorStoresOperator';

const mockUserId = 'user:default/guest';

describe('Notebooks Router', () => {
  const server = setupServer(...lightspeedCoreHandlers);
  let app: express.Application;
  let httpAuth: ReturnType<typeof mockServices.httpAuth>;

  beforeAll(() => {
    // Only intercept Llama Stack requests, bypass local Express app requests
    server.listen({
      onUnhandledRequest: (req, print) => {
        // Allow requests to localhost Express app (supertest)
        if (req.url.includes('127.0.0.1') || req.url.includes('localhost')) {
          return;
        }
        // Log warnings for unhandled requests instead of throwing
        print.warning();
      },
    });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    resetMockStorage();
    VectorStoresOperator.resetInstance(); // Reset singleton before each test
    const logger = mockServices.logger.mock();
    const config = mockServices.rootConfig({
      data: {
        'intelligent-assistant': {
          servicePort: 7007,
          notebooks: {
            enabled: true,
            queryDefaults: {
              model: 'test-model',
              provider_id: 'test-provider',
            },
            sessionDefaults: {
              provider_id: 'test-notebooks',
              embedding_model: 'test-embedding-model',
              embedding_dimension: 768,
            },
          },
        },
      },
    });

    httpAuth = mockServices.httpAuth();
    const userInfo = mockServices.userInfo.mock({
      getUserInfo: async () => ({
        userEntityRef: mockUserId,
        ownershipEntityRefs: [mockUserId],
      }),
    });
    const permissions = mockServices.permissions.mock({
      authorize: async () => [{ result: AuthorizeResult.ALLOW }],
    });

    const router = await createNotebooksRouter({
      logger,
      config,
      httpAuth,
      userInfo,
      permissions,
    });

    app = express();
    app.use(router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/notebooks/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('Session Management', () => {
    describe('POST /v1/sessions', () => {
      it('should create a new session', async () => {
        const response = await request(app)
          .post('/notebooks/v1/sessions')
          .send({
            name: 'Test Session',
            description: 'Test description',
          });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.session.session_id).toBeDefined();
        expect(response.body.session.name).toBe('Test Session');
        expect(response.body.session.description).toBe('Test description');
      });

      it('should return 400 if name is missing', async () => {
        const response = await request(app)
          .post('/notebooks/v1/sessions')
          .send({ description: 'Test' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('name is required');
      });
    });

    describe('GET /v1/sessions', () => {
      it('should list user sessions', async () => {
        // Create a test session
        await request(app)
          .post('/notebooks/v1/sessions')
          .send({ name: 'Test Session' });

        const response = await request(app).get('/notebooks/v1/sessions');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(Array.isArray(response.body.sessions)).toBe(true);
        expect(response.body.sessions.length).toBe(1);
      });
    });

    describe('GET /v1/sessions/:sessionId', () => {
      it('should return 404 for non-existing session', async () => {
        const response = await request(app).get(
          '/notebooks/v1/sessions/non-existing-session-id',
        );

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
      });

      it('should retrieve an existing session', async () => {
        const createResponse = await request(app)
          .post('/notebooks/v1/sessions')
          .send({ name: 'Test Session' });

        const sessionId = createResponse.body.session.session_id;
        const response = await request(app).get(
          `/notebooks/v1/sessions/${sessionId}`,
        );

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.session.session_id).toBe(sessionId);
        expect(response.body.session.name).toBe('Test Session');
      });
    });

    describe('PUT /v1/sessions/:sessionId', () => {
      it('should return 404 for non-existing session', async () => {
        const response = await request(app)
          .put('/notebooks/v1/sessions/non-existing-session-id')
          .send({ name: 'Updated Name' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
      });

      it('should update session', async () => {
        const createResponse = await request(app)
          .post('/notebooks/v1/sessions')
          .send({ name: 'Original Name' });

        const sessionId = createResponse.body.session.session_id;
        const response = await request(app)
          .put(`/notebooks/v1/sessions/${sessionId}`)
          .send({ name: 'Updated Name' });

        expect(response.status).toBe(200);
        expect(response.body.session.name).toBe('Updated Name');
      });
    });

    describe('DELETE /v1/sessions/:sessionId', () => {
      it('should return 404 for non-existing session', async () => {
        const response = await request(app).delete(
          '/notebooks/v1/sessions/non-existing-session-id',
        );

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
      });

      it('should delete session', async () => {
        const createResponse = await request(app)
          .post('/notebooks/v1/sessions')
          .send({ name: 'Test Session' });

        const sessionId = createResponse.body.session.session_id;

        const response = await request(app).delete(
          `/notebooks/v1/sessions/${sessionId}`,
        );

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('deleted successfully');

        // Verify deletion
        const listResponse = await request(app).get('/notebooks/v1/sessions');
        expect(listResponse.body.sessions).toHaveLength(0);
      });
    });
  });

  describe('Document Management', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/notebooks/v1/sessions')
        .send({ name: 'Test Session' });
      sessionId = response.body.session.session_id;
    });

    describe('PUT /v1/sessions/:sessionId/documents', () => {
      it('should create a document', async () => {
        const response = await request(app)
          .put(`/notebooks/v1/sessions/${sessionId}/documents`)
          .field('title', 'Test Document')
          .field('fileType', 'txt')
          .attach('file', Buffer.from('Test content'), 'test.txt');

        expect(response.status).toBe(202);
        expect(response.body.status).toBe('processing');
        expect(response.body.document_id).toBe('Test Document');
        expect(response.body.session_id).toBe(sessionId);
      });

      it('should return 400 if title missing', async () => {
        const response = await request(app)
          .put(`/notebooks/v1/sessions/${sessionId}/documents`)
          .field('fileType', 'txt')
          .attach('file', Buffer.from('Content'), 'test.txt');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('title is required');
      });

      it('should return 400 for unsupported file type', async () => {
        const response = await request(app)
          .put(`/notebooks/v1/sessions/${sessionId}/documents`)
          .field('title', 'Test')
          .field('fileType', 'unsupported')
          .attach('file', Buffer.from('Content'), 'test.txt');

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Unsupported file type');
      });
    });

    describe('GET /v1/sessions/:sessionId/documents', () => {
      it('should list documents', async () => {
        await request(app)
          .put(`/notebooks/v1/sessions/${sessionId}/documents`)
          .field('title', 'Doc 1')
          .field('fileType', 'txt')
          .attach('file', Buffer.from('Content 1'), 'doc1.txt');

        const response = await request(app).get(
          `/notebooks/v1/sessions/${sessionId}/documents`,
        );

        expect(response.status).toBe(200);
        expect(response.body.documents).toHaveLength(1);
      });

      it('should return empty array for session with no documents', async () => {
        const response = await request(app).get(
          `/notebooks/v1/sessions/${sessionId}/documents`,
        );

        expect(response.status).toBe(200);
        expect(response.body.documents).toEqual([]);
      });
    });

    describe('PATCH /v1/sessions/:sessionId/documents/:documentId', () => {
      it('should rename a document', async () => {
        await request(app)
          .put(`/notebooks/v1/sessions/${sessionId}/documents`)
          .field('title', 'Original Name')
          .field('fileType', 'txt')
          .attach('file', Buffer.from('Content'), 'test.txt');

        const response = await request(app)
          .patch(
            `/notebooks/v1/sessions/${sessionId}/documents/${encodeURIComponent('Original Name')}`,
          )
          .send({ title: 'New Name' });

        expect(response.status).toBe(200);
        expect(response.body.document_id).toBe('New Name');
        expect(response.body.message).toContain('renamed successfully');

        const listResponse = await request(app).get(
          `/notebooks/v1/sessions/${sessionId}/documents`,
        );
        expect(
          listResponse.body.documents.map((d: any) => d.document_id),
        ).toContain('New Name');
      });

      it('should return 400 if title is missing', async () => {
        const response = await request(app)
          .patch(
            `/notebooks/v1/sessions/${sessionId}/documents/${encodeURIComponent('Some Doc')}`,
          )
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('title is required');
      });

      it('should return 400 if title is empty string', async () => {
        const response = await request(app)
          .patch(
            `/notebooks/v1/sessions/${sessionId}/documents/${encodeURIComponent('Some Doc')}`,
          )
          .send({ title: '   ' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('title is required');
      });

      it('should return 404 for non-existent document', async () => {
        const response = await request(app)
          .patch(
            `/notebooks/v1/sessions/${sessionId}/documents/${encodeURIComponent('Non-existent')}`,
          )
          .send({ title: 'New Name' });

        expect(response.status).toBe(404);
      });

      it('should return 409 when new title conflicts', async () => {
        await request(app)
          .put(`/notebooks/v1/sessions/${sessionId}/documents`)
          .field('title', 'Doc A')
          .field('fileType', 'txt')
          .attach('file', Buffer.from('Content A'), 'a.txt');

        await request(app)
          .put(`/notebooks/v1/sessions/${sessionId}/documents`)
          .field('title', 'Doc B')
          .field('fileType', 'txt')
          .attach('file', Buffer.from('Content B'), 'b.txt');

        const response = await request(app)
          .patch(
            `/notebooks/v1/sessions/${sessionId}/documents/${encodeURIComponent('Doc A')}`,
          )
          .send({ title: 'Doc B' });

        expect(response.status).toBe(409);
      });
    });

    describe('DELETE /v1/sessions/:sessionId/documents/:documentId', () => {
      it('should delete document', async () => {
        await request(app)
          .put(`/notebooks/v1/sessions/${sessionId}/documents`)
          .field('title', 'Test Doc')
          .field('fileType', 'txt')
          .attach('file', Buffer.from('Content'), 'test.txt');

        const response = await request(app).delete(
          `/notebooks/v1/sessions/${sessionId}/documents/${encodeURIComponent('Test Doc')}`,
        );

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('deleted successfully');

        // Verify deletion
        const listResponse = await request(app).get(
          `/notebooks/v1/sessions/${sessionId}/documents`,
        );
        expect(listResponse.body.documents).toHaveLength(0);
      });
    });
  });

  describe('Permission Denied (403)', () => {
    let deniedApp: express.Application;

    beforeEach(async () => {
      const logger = mockServices.logger.mock();
      const config = mockServices.rootConfig({
        data: {
          'intelligent-assistant': {
            servicePort: 7007,
            notebooks: {
              enabled: true,
              queryDefaults: {
                model: 'test-model',
                provider_id: 'test-provider',
              },
              sessionDefaults: {
                provider_id: 'test-notebooks',
                embedding_model: 'test-embedding-model',
                embedding_dimension: 768,
              },
            },
          },
        },
      });

      const deniedHttpAuth = mockServices.httpAuth();
      const userInfo = mockServices.userInfo.mock({
        getUserInfo: async () => ({
          userEntityRef: mockUserId,
          ownershipEntityRefs: [mockUserId],
        }),
      });
      const permissions = mockServices.permissions.mock({
        authorize: async () => [{ result: AuthorizeResult.DENY }],
      });

      const router = await createNotebooksRouter({
        logger,
        config,
        httpAuth: deniedHttpAuth,
        userInfo,
        permissions,
      });

      deniedApp = express();
      deniedApp.use(router);
    });

    it('POST /v1/sessions returns 403', async () => {
      const response = await request(deniedApp)
        .post('/notebooks/v1/sessions')
        .send({ name: 'Test Session' });

      expect(response.status).toBe(403);
    });

    it('GET /v1/sessions returns 403', async () => {
      const response = await request(deniedApp).get('/notebooks/v1/sessions');

      expect(response.status).toBe(403);
    });

    it('GET /v1/sessions/:sessionId returns 403', async () => {
      const response = await request(deniedApp).get(
        '/notebooks/v1/sessions/some-session-id',
      );

      expect(response.status).toBe(403);
    });

    it('PUT /v1/sessions/:sessionId/documents returns 403', async () => {
      const response = await request(deniedApp)
        .put('/notebooks/v1/sessions/some-session-id/documents')
        .field('title', 'Test')
        .field('fileType', 'txt')
        .attach('file', Buffer.from('Content'), 'test.txt');

      expect(response.status).toBe(403);
    });

    it('POST /v1/sessions/:sessionId/query returns 403', async () => {
      const response = await request(deniedApp)
        .post('/notebooks/v1/sessions/some-session-id/query')
        .send({ query: 'What is this about?' });

      expect(response.status).toBe(403);
    });
  });

  describe('Query Endpoint', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/notebooks/v1/sessions')
        .send({ name: 'Test Session' });
      sessionId = response.body.session.session_id;
    });

    it('should return 404 for non-existing session', async () => {
      const response = await request(app)
        .post('/notebooks/v1/sessions/non-existing-session/query')
        .send({ query: 'What is this about?' });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });

    it('should return 400 if query missing', async () => {
      const response = await request(app)
        .post(`/notebooks/v1/sessions/${sessionId}/query`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('query is required');
    });
  });

  describe('Identity Deduplication', () => {
    it('should resolve identity only once for chained middleware route', async () => {
      const credentialsSpy = jest.spyOn(httpAuth, 'credentials');

      const createRes = await request(app)
        .post('/notebooks/v1/sessions')
        .send({ name: 'Dedup Test' });
      const sessionId = createRes.body.session.session_id;

      credentialsSpy.mockClear();

      await request(app).get(`/notebooks/v1/sessions/${sessionId}/documents`);

      expect(credentialsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('rate limiting', () => {
    let rateLimitedApp: express.Application;

    beforeEach(async () => {
      resetMockStorage();
      VectorStoresOperator.resetInstance();
      const logger = mockServices.logger.mock();
      const config = mockServices.rootConfig({
        data: {
          'intelligent-assistant': {
            servicePort: 7007,
            rateLimit: {
              expensive: { max: 1 },
              general: { max: 1 },
            },
            notebooks: {
              enabled: true,
              queryDefaults: {
                model: 'test-model',
                provider_id: 'test-provider',
              },
              sessionDefaults: {
                provider_id: 'test-notebooks',
                embedding_model: 'test-embedding-model',
                embedding_dimension: 768,
              },
            },
          },
        },
      });

      const rateLimitedHttpAuth = mockServices.httpAuth();
      const userInfo = mockServices.userInfo.mock({
        getUserInfo: async () => ({
          userEntityRef: mockUserId,
          ownershipEntityRefs: [mockUserId],
        }),
      });
      const permissions = mockServices.permissions.mock({
        authorize: async () => [{ result: AuthorizeResult.ALLOW }],
      });

      const router = await createNotebooksRouter({
        logger,
        config,
        httpAuth: rateLimitedHttpAuth,
        userInfo,
        permissions,
      });

      rateLimitedApp = express();
      rateLimitedApp.use(router);
    });

    it('returns 429 on expensive query endpoint when limit exceeded', async () => {
      const sessionRes = await request(rateLimitedApp)
        .post('/notebooks/v1/sessions')
        .send({ name: 'Rate Limit Test' });
      const sessionId = sessionRes.body.session.session_id;

      const first = await request(rateLimitedApp)
        .post(`/notebooks/v1/sessions/${sessionId}/query`)
        .send({ query: 'What is this about?' });
      const second = await request(rateLimitedApp)
        .post(`/notebooks/v1/sessions/${sessionId}/query`)
        .send({ query: 'Another question?' });

      expect(first.status).not.toBe(429);
      expect(second.status).toBe(429);
      expect(second.headers['retry-after']).toBeDefined();
      expect(second.body.error.name).toBe('RateLimitExceeded');
    });

    it('returns 429 on general endpoint when limit exceeded', async () => {
      const first = await request(rateLimitedApp).get('/notebooks/v1/sessions');
      const second = await request(rateLimitedApp).get(
        '/notebooks/v1/sessions',
      );

      expect(first.status).toBe(200);
      expect(second.status).toBe(429);
    });

    it('does not rate limit health endpoint', async () => {
      const first = await request(rateLimitedApp).get('/notebooks/health');
      const second = await request(rateLimitedApp).get('/notebooks/health');

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
    });
  });
});
