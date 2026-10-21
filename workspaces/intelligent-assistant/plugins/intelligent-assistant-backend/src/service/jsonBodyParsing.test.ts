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

import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';

import type { Server } from 'node:http';

import {
  LIGHTSPEED_CORE_ADDR,
  lightspeedCoreHandlers,
  resetMockStorage,
} from '../../__fixtures__/lightspeedCoreHandlers';
import {
  mcpHandlers,
  MOCK_MCP_ADDR,
  MOCK_MCP_VALID_TOKEN,
} from '../../__fixtures__/mcpHandlers';
import { intelligentAssistantPlugin } from '../plugin';
import { ModelCapabilitiesCache } from './attachment-validation';
import { SessionService } from './notebooks/sessions/sessionService';
import { VectorStoresOperator } from './notebooks/VectorStoresOperator';

describe('JSON body parsing', () => {
  const userId = 'user:default/json-body-test';
  const server = setupServer(
    ...lightspeedCoreHandlers,
    ...mcpHandlers,
    http.get(`${LIGHTSPEED_CORE_ADDR}/v1/mcp-servers`, () =>
      HttpResponse.json({
        servers: [{ name: 'static-mcp', url: MOCK_MCP_ADDR }],
      }),
    ),
  );
  let backendServer: Server;
  let operator: VectorStoresOperator;
  let sessionId: string;
  let denyPermission: boolean;

  beforeAll(() => {
    server.listen({
      onUnhandledRequest: (req, print) => {
        if (req.url.includes('/api/intelligent-assistant')) return;
        print.error();
      },
    });
  });

  afterAll(() => server.close());

  beforeEach(async () => {
    denyPermission = false;
    resetMockStorage();
    VectorStoresOperator.resetInstance();
    ModelCapabilitiesCache.clear();
    const backend = await startTestBackend({
      features: [
        intelligentAssistantPlugin,
        mockServices.rootLogger.factory(),
        mockServices.rootConfig.factory({
          data: {
            'intelligent-assistant': {
              servicePort: Number(new URL(LIGHTSPEED_CORE_ADDR).port),
              servers: [
                { id: 'test-server', url: LIGHTSPEED_CORE_ADDR, token: 'test' },
              ],
              mcpServers: [{ name: 'static-mcp' }],
              rateLimit: {
                expensive: { max: 1 },
              },
              notebooks: {
                enabled: true,
                queryDefaults: {
                  model: 'test-model',
                  provider_id: 'test-server',
                },
              },
            },
          },
        }),
        mockServices.httpAuth.factory({
          defaultCredentials: mockCredentials.user(userId),
        }),
        mockServices.userInfo.mock({
          getUserInfo: async () => ({
            userEntityRef: userId,
            ownershipEntityRefs: [userId],
          }),
        }).factory,
        mockServices.permissions.mock({
          authorize: async () => [
            {
              result: denyPermission
                ? AuthorizeResult.DENY
                : AuthorizeResult.ALLOW,
            },
          ],
        }).factory,
      ],
    });
    backendServer = backend.server;
    const logger = mockServices.logger.mock();
    operator = VectorStoresOperator.getInstance(LIGHTSPEED_CORE_ADDR, logger);
    // Keep fixture creation independent of the HTTP routes under test.
    const session = await new SessionService(operator, logger).createSession(
      userId,
      'Original notebook',
    );
    sessionId = session.session_id;
  });

  afterEach(() => {
    server.resetHandlers();
    ModelCapabilitiesCache.clear();
  });

  it('checks query permission before parsing JSON', async () => {
    denyPermission = true;
    const response = await request(backendServer)
      .post('/api/intelligent-assistant/v1/query')
      .set('Content-Type', 'application/json')
      .send('{');

    // Parsing first would reject this malformed JSON with 400.
    expect(response.status).toBe(403);
  });

  it('checks the query rate limit before parsing JSON', async () => {
    const sendMalformedQuery = () =>
      request(backendServer)
        .post('/api/intelligent-assistant/v1/query')
        .set('Content-Type', 'application/json')
        .send('{');

    expect((await sendMalformedQuery()).status).toBe(400);
    expect((await sendMalformedQuery()).status).toBe(429);
  });

  it.each([
    {
      method: 'post',
      path: '/v1/feedback',
      upstreamPath: '/v1/feedback',
      body: {
        conversation_id: 'json-body-conversation',
        llm_response: 'Answer',
        sentiment: 1,
        user_feedback: 'Helpful "answer"',
        user_question: 'Question',
      },
    },
    {
      method: 'post',
      path: '/v1/saved-prompts',
      upstreamPath: '/v1/saved-prompts',
      body: { name: 'Saved prompt', content: 'First line\nSecond line' },
    },
    {
      method: 'post',
      path: '/v1/query/interrupt',
      upstreamPath: '/v1/streaming_query/interrupt',
      body: { request_id: 'json-body-request' },
    },
    {
      method: 'put',
      path: '/v2/conversations/json-body-conversation',
      upstreamPath: '/v2/conversations/json-body-conversation',
      body: { topic_summary: 'Parsed conversation name' },
    },
    {
      method: 'post',
      path: '/v1/query',
      upstreamPath: '/v1/streaming_query',
      body: {
        model: 'test-model',
        provider: 'test-server',
        query: 'Explain "this"',
        attachments: [
          {
            attachment_type: 'configuration',
            content_type: 'text/plain',
            content: 'First line\nSecond line',
          },
        ],
      },
    },
  ] as const)(
    'parses and forwards JSON for $method $path',
    async ({ method, path, upstreamPath, body }) => {
      let forwardedBody: unknown;
      server.use(
        http[method](
          `${LIGHTSPEED_CORE_ADDR}${upstreamPath}`,
          async ({ request: upstreamRequest }) => {
            const text = await upstreamRequest.text();
            forwardedBody = text ? JSON.parse(text) : null;
            return path === '/v1/query'
              ? new HttpResponse('data: [DONE]\n\n', {
                  headers: { 'Content-Type': 'text/event-stream' },
                })
              : HttpResponse.json({ success: true });
          },
        ),
      );

      const response = await request(backendServer)
        [method](`/api/intelligent-assistant${path}`)
        .send(body);

      expect(response.status).toBe(200);
      expect(forwardedBody).toMatchObject(body);
    },
  );

  it('accepts a query attachment larger than the default JSON body limit', async () => {
    const content = 'x'.repeat(110 * 1024);
    let queryBody: unknown;
    server.use(
      http.post(
        `${LIGHTSPEED_CORE_ADDR}/v1/streaming_query`,
        async ({ request: upstreamRequest }) => {
          queryBody = await upstreamRequest.json();
          return new HttpResponse('data: [DONE]\n\n', {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        },
      ),
    );

    const response = await request(backendServer)
      .post('/api/intelligent-assistant/v1/query')
      .send({
        model: 'test-model',
        provider: 'test-server',
        query: 'Summarize this file',
        attachments: [
          {
            attachment_type: 'configuration',
            content_type: 'text/plain',
            content,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(queryBody).toMatchObject({ attachments: [{ content }] });
  });

  it('keeps the default JSON body limit for saved prompts', async () => {
    const response = await request(backendServer)
      .post('/api/intelligent-assistant/v1/saved-prompts')
      .send({ name: 'Large prompt', content: 'x'.repeat(110 * 1024) });

    expect(response.status).toBe(413);
  });

  it.each([
    { method: 'get', path: '/v1/shields' },
    { method: 'delete', path: '/v2/conversations/json-body-conversation' },
  ] as const)(
    'rejects oversized JSON on proxied $method $path',
    async ({ method, path }) => {
      const response = await request(backendServer)
        [method](`/api/intelligent-assistant${path}`)
        .send({ content: 'x'.repeat(110 * 1024) });

      expect(response.status).toBe(413);
    },
  );

  it('parses JSON for POST /v1/validate-model-vision', async () => {
    let probeBody: unknown;
    server.use(
      http.post(
        `${LIGHTSPEED_CORE_ADDR}/v1/responses`,
        async ({ request: upstreamRequest }) => {
          probeBody = await upstreamRequest.json();
          return HttpResponse.json({ id: 'vision-probe', output: [] });
        },
      ),
    );

    const response = await request(backendServer)
      .post('/api/intelligent-assistant/v1/validate-model-vision')
      .send({ model: 'json-body-model', provider: 'test-server' })
      .timeout(2000);

    expect(response.status).toBe(200);
    expect(probeBody).toMatchObject({ model: 'test-server/json-body-model' });
  });

  it('parses JSON for POST /mcp-servers/validate', async () => {
    const response = await request(backendServer)
      .post('/api/intelligent-assistant/mcp-servers/validate')
      .send({ url: MOCK_MCP_ADDR, token: MOCK_MCP_VALID_TOKEN });

    expect(response.status).toBe(200);
    // The MCP fixture accepts only this token from the submitted body.
    expect(response.body.valid).toBe(true);
  });

  it('parses JSON for PATCH /mcp-servers/:name', async () => {
    const response = await request(backendServer)
      .patch('/api/intelligent-assistant/mcp-servers/static-mcp')
      .send({ enabled: false, token: MOCK_MCP_VALID_TOKEN });

    expect(response.status).toBe(200);
    expect(response.body.server).toMatchObject({
      enabled: false,
      hasUserToken: true,
    });
    expect(response.body.validation.valid).toBe(true);
  });

  it.each(['post', 'put'] as const)(
    'parses JSON for %s notebook session requests',
    async method => {
      const body = {
        name: 'Parsed "notebook"',
        description: 'First line\nSecond line',
        metadata: { note: 'café' },
      };
      const path = '/api/intelligent-assistant/notebooks/v1/sessions';
      const response = await request(backendServer)
        [method](method === 'post' ? path : `${path}/${sessionId}`)
        .send(body);

      expect(response.status).toBe(200);
      expect(response.body.session).toMatchObject(body);
    },
  );

  it('parses JSON for PATCH /notebooks/v1/sessions/:sessionId/documents/:documentId', async () => {
    const file = await operator.files.create({
      file: { name: 'original.json', buffer: Buffer.from('{}') },
      purpose: 'assistants',
    });
    await operator.vectorStores.files.create(sessionId, {
      file_id: file.id,
      attributes: { title: 'Original', source_type: 'json' },
    });

    const response = await request(backendServer)
      .patch(
        `/api/intelligent-assistant/notebooks/v1/sessions/${sessionId}/documents/Original`,
      )
      .send({ title: 'Parsed document name' });

    expect(response.status).toBe(200);
    const files = await operator.vectorStores.files.list(sessionId);
    expect(files.data).toEqual([
      expect.objectContaining({
        attributes: expect.objectContaining({ title: 'Parsed document name' }),
      }),
    ]);
  });

  it('parses JSON for POST /notebooks/v1/sessions/:sessionId/query', async () => {
    let queryBody: unknown;
    server.use(
      http.post(
        `${LIGHTSPEED_CORE_ADDR}/v1/responses`,
        async ({ request: upstreamRequest }) => {
          queryBody = await upstreamRequest.json();
          return new HttpResponse('data: [DONE]\n\n', {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        },
      ),
    );

    const response = await request(backendServer)
      .post(
        `/api/intelligent-assistant/notebooks/v1/sessions/${sessionId}/query`,
      )
      .send({ query: 'Explain "this" notebook' });

    expect(response.status).toBe(200);
    expect(queryBody).toMatchObject({ input: 'Explain "this" notebook' });
  });
});
