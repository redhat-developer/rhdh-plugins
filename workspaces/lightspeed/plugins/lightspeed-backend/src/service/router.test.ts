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

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';

import { handlers, LOCAL_AI_ADDR } from '../../__fixtures__/handlers';
import { lcsHandlers, LOCAL_LCS_ADDR } from '../../__fixtures__/lcsHandlers';
import { lightspeedPlugin } from '../plugin';
import { ModelCapabilitiesCache } from './attachment-validation';
import { VectorStoresOperator } from './notebooks/VectorStoresOperator';

const mockUserId = `user: default/user1`;
const mockConversationId = 'conversation-id-1';
const encodedConversationId = encodeURIComponent(mockConversationId);
const mockConversationId2 = `conversation-id-2`;

const mockAnotherConversationId = `another-conversation-id`;

const mockModel = 'test-model';
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

const splitJsonObjects = (response: { text: string }): string[] =>
  response.text
    .split('\n') // Split by newlines
    .filter(line => line.startsWith('data: ')) // Keep only JSON lines
    .map(line => line.replace('data: ', '')); // Remove the "data: " prefix

describe('lightspeed router tests', () => {
  const server = setupServer(...handlers);
  const rcs = setupServer(...lcsHandlers);

  beforeAll(() => {
    server.listen({
      /*
       *  This is required so that msw doesn't throw
       *  warnings when the backend is requesting an endpoint
       */
      onUnhandledRequest: (req, print) => {
        if (req.url.includes('/api/lightspeed')) {
          // bypass
          return;
        }
        print.warning();
      },
    });

    rcs.listen({
      /*
       *  This is required so that msw doesn't throw
       *  warnings when the backend is requesting an endpoint
       */
      onUnhandledRequest: (req, print) => {
        if (req.url.includes('/api/lightspeed')) {
          // bypass
          return;
        }
        print.warning();
      },
    });
  });

  afterAll(() => {
    server.close();
    rcs.close();
  });

  beforeEach(() => {
    VectorStoresOperator.resetInstance(); // Reset singleton before each test
  });

  afterEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
    rcs.resetHandlers();
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

  async function startBackendServerWithThrowingPermissions(
    config?: Record<PropertyKey, unknown>,
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
          authorize: async () => {
            throw new Error('Permission service unavailable');
          },
        }).factory,
        mockServices.userInfo.factory(),
      ];
    return (await startTestBackend({ features })).server;
  }

  describe('GET /health', () => {
    it('returns ok', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        '/api/lightspeed/health',
      );

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET v1/models', () => {
    it('should load available models', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        '/api/lightspeed/v1/models',
      );

      expect(response.status).toBe(200);
      const responseData = response.body;
      expect(responseData.models).toBeDefined();
      expect(Array.isArray(responseData.models)).toBe(true);
      expect(responseData.models.length).toBe(2);
      expect(responseData.models[0].identifier).toBeDefined();
      expect(responseData.models[1].identifier).toBeDefined();
    });
  });

  describe('GET /v1/shields', () => {
    it('should load available shields without injecting user_id', async () => {
      const upstreamUrls: URL[] = [];
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/shields`, ({ request: req }) => {
          upstreamUrls.push(new URL(req.url));
          return HttpResponse.json({
            shields: [
              {
                identifier: 'topic-detection-shield',
                provider_resource_id: 'topic-detection',
                type: 'shield',
              },
            ],
          });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        '/api/lightspeed/v1/shields',
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        shields: [
          {
            identifier: 'topic-detection-shield',
            provider_resource_id: 'topic-detection',
            type: 'shield',
          },
        ],
      });
      expect(upstreamUrls).toHaveLength(1);
      expect(upstreamUrls[0].searchParams.get('user_id')).toBeNull();
    });

    it('should fail with unauthorized error while loading shields', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const response = await request(backendServer).get(
        '/api/lightspeed/v1/shields',
      );

      expect(response.statusCode).toEqual(403);
    });
  });

  describe('GET /v2/conversations', () => {
    it('load conversations list with summary', async () => {
      const mockSummary = 'dummy summary';
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        `/api/lightspeed/v2/conversations`,
      );
      expect(response.statusCode).toEqual(200);
      // Parse response body
      const responseData = response.body;

      // Check that responseData is an array
      expect(responseData.conversations).toBeDefined();
      expect(Array.isArray(responseData.conversations)).toBe(true);
      expect(responseData.conversations.length).toBe(2);
      const ids = responseData.conversations.map(
        (item: any) => item.conversation_id,
      );

      // Check if both expected IDs are present
      expect(ids).toContain(mockConversationId);
      expect(ids).toContain(mockConversationId2);

      // check the summary
      expect(responseData.conversations[0].topic_summary).toBe(mockSummary);
      expect(responseData.conversations[1].topic_summary).toBe(mockSummary);

      // check the timestamp is in descending order
      expect(
        responseData.conversations[0].last_message_timestamp,
      ).toBeDefined();
      expect(
        responseData.conversations[1].last_message_timestamp,
      ).toBeDefined();
    });

    it('should fail with unauthorized error while loading conversations list', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const response = await request(backendServer).get(
        '/api/lightspeed/v2/conversations',
      );

      expect(response.statusCode).toEqual(403);
    });
  });

  describe('PUT /v2/conversations/:conversation_id', () => {
    it('should successfully update topic summary', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .put(`/api/lightspeed/v2/conversations/${encodedConversationId}`)
        .send({
          topic_summary: 'new topic',
        });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        conversation_id: mockConversationId,
        success: true,
        message: 'Topic summary updated successfully',
      });
    });

    it('should fail with unauthorized error while updating topic summary', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const response = await request(backendServer)
        .put(`/api/lightspeed/v2/conversations/${encodedConversationId}`)
        .send({
          topic_summary: 'new topic',
        });

      expect(response.statusCode).toEqual(403);
      expect(response.body.error).toBeDefined();
    });

    it('should return upstream status code when conversation does not exist', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .put(`/api/lightspeed/v2/conversations/${mockAnotherConversationId}`)
        .send({
          topic_summary: 'new topic',
        });

      expect(response.statusCode).toEqual(404);
      expect(response.body.error).toContain(
        'Error from lightspeed-core server',
      );
    });

    it('should handle upstream server errors properly', async () => {
      const backendServer = await startBackendServer();
      // Override the handler to simulate an error from upstream
      rcs.use(
        http.put(`${LOCAL_LCS_ADDR}/v2/conversations/:conversation_id`, () => {
          return new HttpResponse(
            JSON.stringify({
              error: {
                message:
                  'Model gpt-4-0613 failed with OpenAI API error: rate limit exceeded for organization org-abc123',
              },
              detail: {
                cause: 'OpenAIError: Rate limit reached',
                provider: 'openai',
                model_id: 'gpt-4-0613',
              },
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }),
      );

      const response = await request(backendServer)
        .put(`/api/lightspeed/v2/conversations/${encodedConversationId}`)
        .send({
          topic_summary: 'new topic',
        });

      expect(response.statusCode).toEqual(500);
      expect(response.body.error).toContain(
        'Error from lightspeed-core server',
      );
      // Verify internal details are NOT exposed
      expect(response.body.error).not.toContain('gpt-4');
      expect(response.body.error).not.toContain('OpenAI');
      expect(response.body.error).not.toContain('org-abc123');
      expect(response.body.error).not.toContain('openai');
      expect(response.body.error).not.toContain('rate limit');
    });
  });

  describe('GET and DELETE /v2/conversations/:conversation_id', () => {
    it('load history', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        `/api/lightspeed/v2/conversations/${encodedConversationId}`,
      );
      expect(response.statusCode).toEqual(200);
      // Parse response body
      const responseData = response.body;

      // New format: chat_history is a list of sessions containing messages
      expect(responseData.chat_history).toBeDefined();
      expect(Array.isArray(responseData.chat_history)).toBe(true);
      expect(responseData.chat_history.length).toBe(1);

      const session = responseData.chat_history[0];
      expect(Array.isArray(session.messages)).toBe(true);
      expect(session.messages.length).toBe(2);
      expect(session.messages[0]).toEqual(
        expect.objectContaining({ type: 'user', content: expect.any(String) }),
      );
      expect(session.messages[1]).toEqual(
        expect.objectContaining({
          type: 'assistant',
          content: expect.any(String),
        }),
      );
      expect(session.started_at).toBeDefined();
      expect(session.completed_at).toBeDefined();
      expect(session.provider).toBeDefined();
      expect(session.model).toBeDefined();
    });

    it('should fail with unauthorized error while fetching conversation history', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const response = await request(backendServer).get(
        `/api/lightspeed/v2/conversations/${encodedConversationId}`,
      );
      expect(response.statusCode).toEqual(403);
    });

    it('delete history', async () => {
      // delete request
      const backendServer = await startBackendServer();
      const deleteResponse = await request(backendServer).delete(
        `/api/lightspeed/v2/conversations/${encodedConversationId}`,
      );
      expect(deleteResponse.statusCode).toEqual(200);
    });

    it('should fail with unauthorized error while deleting a conversation history', async () => {
      // delete request
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const deleteResponse = await request(backendServer).delete(
        `/api/lightspeed/v2/conversations/${encodedConversationId}`,
      );
      expect(deleteResponse.statusCode).toEqual(403);
    });

    it('load history with deleted conversation_id', async () => {
      // await deleteHistory(mockConversationId);
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        `/api/lightspeed/v2/conversations/${encodedConversationId}`,
      );
      expect(response.statusCode).toEqual(500);
      expect(response.body.error).toContain('not found');
    });

    it('load history from a non-exist conversation_id should error out', async () => {
      const backendServer = await startBackendServer();

      const response = await request(backendServer).get(
        `/api/lightspeed/v2/conversations/${mockAnotherConversationId}`,
      );
      expect(response.statusCode).toEqual(500);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /v1/feedback', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should send the feedback successfully', async () => {
      const backendServer = await startBackendServer();

      const response = await request(backendServer)
        .post('/api/lightspeed/v1/feedback')
        .send({
          conversation_id: '12345678-abcd-0000-0123-456789abcdef',
          llm_response: 'bar',
          sentiment: 1,
          user_feedback: 'Great service!',
          user_question: 'foo',
        });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        response: 'feedback received',
      });
    });

    it('should fail with unauthorized error in feedback API', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const feedbackResponse = await request(backendServer)
        .post('/api/lightspeed/v1/feedback')
        .send({
          conversation_id: '12345678-abcd-0000-0123-456789abcdef',
          llm_response: 'bar',
          sentiment: 1,
          user_feedback: 'Great service!',
          user_question: 'foo',
        });
      expect(feedbackResponse.statusCode).toEqual(403);
    });

    it('should handle upstream server errors properly', async () => {
      const backendServer = await startBackendServer();
      rcs.use(
        http.post(`${LOCAL_LCS_ADDR}/v1/feedback`, () => {
          return new HttpResponse(
            JSON.stringify({
              error: {
                message:
                  'Database connection failed at /app/db/postgres.py:142',
              },
              detail: {
                cause: 'PostgreSQL connection timeout',
                trace_id: 'req_xyz789',
              },
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }),
      );

      const response = await request(backendServer)
        .post('/api/lightspeed/v1/feedback')
        .send({
          conversation_id: '12345678-abcd-0000-0123-456789abcdef',
          llm_response: 'bar',
          sentiment: 1,
          user_feedback: 'Great service!',
          user_question: 'foo',
        });

      expect(response.statusCode).toEqual(500);
      expect(response.body.error).toContain(
        'Error from lightspeed-core server',
      );
      // Verify internal details are NOT exposed
      expect(response.body.error).not.toContain('Database');
      expect(response.body.error).not.toContain('postgres.py');
      expect(response.body.error).not.toContain('PostgreSQL');
      expect(response.body.error).not.toContain('req_xyz789');
    });
  });

  describe('GET /v1/feedback/status', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should send the feedback successfully', async () => {
      const backendServer = await startBackendServer();

      const response = await request(backendServer).get(
        '/api/lightspeed/v1/feedback/status',
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        functionality: 'feedback',
        status: { enabled: true },
      });
    });

    it('should fail with unauthorized error in feedback staus API', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const feedbackResponse = await request(backendServer).get(
        '/api/lightspeed/v1/feedback/status',
      );

      expect(feedbackResponse.statusCode).toEqual(403);
    });
  });

  describe('POST /v1/query', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('chat completions', async () => {
      const backendServer = await startBackendServer();

      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          query: 'Hello',
          provider: 'test-server',
        });

      expect(response.statusCode).toEqual(200);
      const expectedData = 'Mockup AI Message';
      let receivedData = '';
      const chunkList = splitJsonObjects(response);

      expect(chunkList.length).toEqual(4);
      // Parse each chunk individually
      chunkList.forEach(chunk => {
        const parsedChunk = JSON.parse(chunk);
        if (parsedChunk.choices[0]?.finish_reason !== 'stop') {
          receivedData += parsedChunk.choices[0]?.delta?.content;
          receivedData += ' ';
        }
      });
      receivedData = receivedData.trimEnd(); // remove space at the last chunk
      expect(receivedData).toEqual(expectedData);
    });

    it('should send MCP headers for multiple MCP servers', async () => {
      let capturedMcpHeaders: string | null = null;

      rcs.use(
        http.post(
          `${LOCAL_LCS_ADDR}/v1/streaming_query`,
          ({ request: req }) => {
            capturedMcpHeaders = req.headers.get('MCP-HEADERS');
            const textEncoder = new TextEncoder();
            const mockData = [
              {
                choices: [{ delta: { content: 'Test' }, finish_reason: null }],
              },
              { choices: [{ delta: {}, finish_reason: 'stop' }] },
            ];
            const stream = new ReadableStream({
              start(controller) {
                mockData.forEach((chunk: any) => {
                  controller.enqueue(
                    textEncoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
                  );
                });
                controller.close();
              },
            });
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/plain' },
            });
          },
        ),
      );

      const backendServer = await startBackendServer({
        'intelligent-assistant': {
          ...BASE_CONFIG['intelligent-assistant'],
          mcpServers: [
            { name: 'mcp-server-1', token: 'token-1' },
            { name: 'mcp-server-2', token: 'token-2' },
          ],
        },
      });

      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          query: 'Hello',
          provider: 'test-server',
        });

      expect(response.statusCode).toEqual(200);
      expect(capturedMcpHeaders).not.toBeNull();

      const parsedHeaders = JSON.parse(capturedMcpHeaders!);
      expect(parsedHeaders).toEqual({
        'mcp-server-1': { Authorization: 'token-1' },
        'mcp-server-2': { Authorization: 'token-2' },
      });
    });

    it('should send empty MCP headers when no MCP servers configured', async () => {
      let capturedMcpHeaders: string | null = null;

      rcs.use(
        http.post(
          `${LOCAL_LCS_ADDR}/v1/streaming_query`,
          ({ request: req }) => {
            capturedMcpHeaders = req.headers.get('MCP-HEADERS');
            const textEncoder = new TextEncoder();
            const mockData = [
              {
                choices: [{ delta: { content: 'Test' }, finish_reason: null }],
              },
              { choices: [{ delta: {}, finish_reason: 'stop' }] },
            ];
            const stream = new ReadableStream({
              start(controller) {
                mockData.forEach((chunk: any) => {
                  controller.enqueue(
                    textEncoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
                  );
                });
                controller.close();
              },
            });
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/plain' },
            });
          },
        ),
      );

      const backendServer = await startBackendServer();

      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          query: 'Hello',
          provider: 'test-server',
        });

      expect(response.statusCode).toEqual(200);
      expect(capturedMcpHeaders).toBe('');
    });

    it('should send MCP headers for single MCP server', async () => {
      let capturedMcpHeaders: string | null = null;

      rcs.use(
        http.post(
          `${LOCAL_LCS_ADDR}/v1/streaming_query`,
          ({ request: req }) => {
            capturedMcpHeaders = req.headers.get('MCP-HEADERS');
            const textEncoder = new TextEncoder();
            const mockData = [
              {
                choices: [{ delta: { content: 'Test' }, finish_reason: null }],
              },
              { choices: [{ delta: {}, finish_reason: 'stop' }] },
            ];
            const stream = new ReadableStream({
              start(controller) {
                mockData.forEach((chunk: any) => {
                  controller.enqueue(
                    textEncoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
                  );
                });
                controller.close();
              },
            });
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/plain' },
            });
          },
        ),
      );

      const backendServer = await startBackendServer({
        'intelligent-assistant': {
          ...BASE_CONFIG['intelligent-assistant'],
          mcpServers: [{ name: 'single-mcp-server', token: 'single-token' }],
        },
      });

      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          query: 'Hello',
          provider: 'test-server',
        });

      expect(response.statusCode).toEqual(200);
      expect(capturedMcpHeaders).not.toBeNull();

      const parsedHeaders = JSON.parse(capturedMcpHeaders!);
      expect(parsedHeaders).toEqual({
        'single-mcp-server': { Authorization: 'single-token' },
      });
    });

    it('should fail with unauthorized error in chat completion API', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const chatCompletionResponse = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          conversation_id: mockConversationId,
          query: 'Hello',
          provider: 'test-server',
        });
      expect(chatCompletionResponse.statusCode).toEqual(403);
    });

    it('returns 400 if provider is missing', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          conversation_id: mockConversationId,
          query: 'hello',
        });
      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toBe(
        'provider is required and must be a non-empty string',
      );
    });

    it('returns 400 if model is missing', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          conversation_id: mockConversationId,
          provider: 'test-server',
        });
      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toBe(
        'model is required and must be a non-empty string',
      );
    });

    it('returns 400 if query is missing', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          conversation_id: mockConversationId,
          provider: 'test-server',
        });
      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toBe(
        'query is required and must be a non-empty string',
      );
    });

    it('returns upstream status code on error', async () => {
      const backendServer = await startBackendServer();
      const nonExistentModel = 'nonexistent-model';
      rcs.use(
        http.post(`${LOCAL_LCS_ADDR}/v1/streaming_query`, () => {
          return new HttpResponse(
            JSON.stringify({
              error: {
                message: `model "${nonExistentModel}" not found, try pulling it first`,
                type: 'api_error',
              },
            }),
            { status: 404 },
          );
        }),
      );
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: nonExistentModel,
          conversation_id: mockConversationId,
          provider: 'test-server',
          query: 'Hello',
        });
      expect(response.statusCode).toEqual(404);
      expect(response.body.error).toContain(
        'Error from lightspeed-core server',
      );
    });
  });

  describe('GET /notebook-conversation-ids', () => {
    it('returns conversation IDs for the authenticated user', async () => {
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/vector-stores`, () => {
          return HttpResponse.json({
            data: [
              {
                id: 'vs-1',
                name: 'session-1',
                metadata: {
                  user_id: mockUserId,
                  conversation_id: 'conv-abc',
                },
              },
              {
                id: 'vs-2',
                name: 'session-2',
                metadata: {
                  user_id: mockUserId,
                  conversation_id: 'conv-def',
                },
              },
              {
                id: 'vs-3',
                name: 'other-user-session',
                metadata: {
                  user_id: 'user:default/other',
                  conversation_id: 'conv-other',
                },
              },
              {
                id: 'vs-4',
                name: 'no-conv-id',
                metadata: {
                  user_id: mockUserId,
                  conversation_id: null,
                },
              },
            ],
          });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        '/api/lightspeed/notebook-conversation-ids',
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body.conversation_ids).toEqual(['conv-abc', 'conv-def']);
    });

    it('returns empty array when user has no notebook sessions', async () => {
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/vector-stores`, () => {
          return HttpResponse.json({
            data: [
              {
                id: 'vs-1',
                name: 'other-session',
                metadata: {
                  user_id: 'user:default/other',
                  conversation_id: 'conv-other',
                },
              },
            ],
          });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        '/api/lightspeed/notebook-conversation-ids',
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body.conversation_ids).toEqual([]);
    });
  });

  // Regression guard: /v1/query intentionally runs validation before
  // authorization so malformed requests are rejected cheaply without a
  // permission-service round-trip. These tests arm the auth layer with DENY
  // and send invalid bodies — getting 400 (not 403) proves validation still
  // executes first regardless of permission state.
  describe('POST /v1/query validation-before-auth ordering', () => {
    it('returns 400 for missing provider even when permission is denied', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          conversation_id: mockConversationId,
          query: 'hello',
        });
      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toBe(
        'provider is required and must be a non-empty string',
      );
    });

    it('returns 400 for missing model even when permission is denied', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          conversation_id: mockConversationId,
          provider: 'test-server',
        });
      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toBe(
        'model is required and must be a non-empty string',
      );
    });

    it('returns 400 for missing query even when permission is denied', async () => {
      const backendServer = await startBackendServer({}, AuthorizeResult.DENY);
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          conversation_id: mockConversationId,
          provider: 'test-server',
        });
      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toBe(
        'query is required and must be a non-empty string',
      );
    });
  });

  describe('POST /v1/query input size validation', () => {
    it('returns 400 when query exceeds maximum length', async () => {
      const backendServer = await startBackendServer();
      const longQuery = 'a'.repeat(32001);
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          provider: 'test-server',
          query: longQuery,
        });
      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toContain(
        'query exceeds maximum length of 32000 characters',
      );
    });

    it('accepts query at exactly maximum length', async () => {
      const backendServer = await startBackendServer();
      const maxQuery = 'a'.repeat(32000);
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          provider: 'test-server',
          query: maxQuery,
        });
      expect(response.statusCode).not.toEqual(400);
    });
  });

  describe('POST /v1/query stream error handling', () => {
    it('returns 500 when upstream stream errors', async () => {
      const backendServer = await startBackendServer();
      rcs.use(
        http.post(`${LOCAL_LCS_ADDR}/v1/streaming_query`, () => {
          const stream = new ReadableStream({
            start(controller) {
              controller.error(new Error('Connection reset'));
            },
          });
          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/plain' },
          });
        }),
      );
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: mockModel,
          provider: 'test-server',
          query: 'Hello',
        });
      expect(response.statusCode).toEqual(500);
      expect(response.body.error).toContain('Stream error occurred');
    });
  });

  // Locks in the 500 contract when the permission service itself fails
  // (e.g. network error) as opposed to a deliberate DENY. Ensures the
  // middleware responds with a generic error rather than leaking internals.
  describe('unexpected authorization failure', () => {
    it('returns 500 when permission service throws on a proxy route', async () => {
      const backendServer = await startBackendServerWithThrowingPermissions();
      const response = await request(backendServer).get(
        '/api/lightspeed/v2/conversations',
      );
      expect(response.statusCode).toEqual(500);
      expect(response.body.error).toBe('Internal authorization error');
    });
  });

  describe('unregistered paths', () => {
    it('should return 404 for unregistered path /v1/admin', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        '/api/lightspeed/v1/admin',
      );
      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        error: 'Requested path is not available',
      });
    });

    it('should return 404 for unregistered path /internal/config', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        '/api/lightspeed/internal/config',
      );
      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        error: 'Requested path is not available',
      });
    });

    it('should return 404 for POST to arbitrary path', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/some/arbitrary/path')
        .send({});
      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        error: 'Requested path is not available',
      });
    });

    it.each([
      '/api/lightspeed/v1/models-secret',
      '/api/lightspeed/v1/shieldsadmin',
      '/api/lightspeed/v2/conversationsextra',
      '/api/lightspeed/v1/feedbackextra',
    ])('should return 404 for prefix-adjacent path %s', async path => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(path);

      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        error: 'Requested path is not available',
      });
    });

    it('should reject dot-segment path traversal attempts', async () => {
      const backendServer = await startBackendServer();
      const response = await request(backendServer).get(
        '/api/lightspeed/v1/models/../admin',
      );
      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        error: 'Requested path is not available',
      });
    });
  });

  describe('POST /v1/query/interrupt', () => {
    it('returns success when interrupt succeeds', async () => {
      const backendServer = await startBackendServer();

      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query/interrupt')
        .send({ request_id: 'req-123' });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({ success: true });
    });

    it('returns 403 when user lacks permission', async () => {
      const backendServer = await startBackendServer(
        undefined,
        AuthorizeResult.DENY,
      );

      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query/interrupt')
        .send({ request_id: 'req-123' });

      expect(response.statusCode).toEqual(403);
    });
  });

  describe('POST /v1/validate-model-vision', () => {
    beforeEach(() => {
      ModelCapabilitiesCache.clear();
    });

    it('returns true when model supports vision', async () => {
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/models`, () => {
          return HttpResponse.json({
            models: [
              {
                identifier: 'gpt-4o',
                provider_resource_id: 'gpt-4o',
                supports_vision: true,
              },
            ],
          });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/validate-model-vision')
        .send({ model: 'gpt-4o', provider: 'test-server' });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({ supports_vision: true });
    });

    it('returns false when model lacks vision', async () => {
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/models`, () => {
          return HttpResponse.json({
            models: [
              {
                identifier: 'gpt-3.5-turbo',
                provider_resource_id: 'gpt-3.5-turbo',
                supports_vision: false,
              },
            ],
          });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/validate-model-vision')
        .send({ model: 'gpt-3.5-turbo', provider: 'test-server' });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({ supports_vision: false });
    });

    it('returns 400 when model is not found', async () => {
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/models`, () => {
          return HttpResponse.json({ models: [] });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/validate-model-vision')
        .send({ model: 'unknown-model', provider: 'test-server' });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        error: 'Model unknown-model not found',
      });
    });
  });

  describe('POST /v1/query attachment validation', () => {
    beforeEach(() => {
      ModelCapabilitiesCache.clear();
    });

    it('rejects attachments when model lacks vision', async () => {
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/models`, () => {
          return HttpResponse.json({
            models: [
              {
                identifier: 'gpt-3.5-turbo',
                provider_resource_id: 'gpt-3.5-turbo',
                supports_vision: false,
              },
            ],
          });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: 'gpt-3.5-turbo',
          provider: 'test-server',
          query: 'What is this?',
          attachments: [
            {
              attachment_type: 'image',
              content_type: 'image/jpeg',
              content: 'base64data',
            },
          ],
        });

      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toContain(
        'Model gpt-3.5-turbo does not support image attachments',
      );
    });

    it('accepts attachments when model supports vision', async () => {
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/models`, () => {
          return HttpResponse.json({
            models: [
              {
                identifier: 'gpt-4o',
                provider_resource_id: 'gpt-4o',
                supports_vision: true,
              },
            ],
          });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: 'gpt-4o',
          provider: 'test-server',
          query: 'What is this?',
          attachments: [
            {
              attachment_type: 'image',
              content_type: 'image/jpeg',
              content: 'base64data',
            },
          ],
        });

      expect(response.statusCode).toEqual(200);
    });

    it('accepts empty attachments regardless of vision support', async () => {
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/models`, () => {
          return HttpResponse.json({
            models: [
              {
                identifier: 'gpt-3.5-turbo',
                provider_resource_id: 'gpt-3.5-turbo',
                supports_vision: false,
              },
            ],
          });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: 'gpt-3.5-turbo',
          provider: 'test-server',
          query: 'Hello',
          attachments: [],
        });

      expect(response.statusCode).toEqual(200);
    });

    it('accepts no attachments field regardless of vision support', async () => {
      rcs.use(
        http.get(`${LOCAL_LCS_ADDR}/v1/models`, () => {
          return HttpResponse.json({
            models: [
              {
                identifier: 'gpt-3.5-turbo',
                provider_resource_id: 'gpt-3.5-turbo',
                supports_vision: false,
              },
            ],
          });
        }),
      );

      const backendServer = await startBackendServer();
      const response = await request(backendServer)
        .post('/api/lightspeed/v1/query')
        .send({
          model: 'gpt-3.5-turbo',
          provider: 'test-server',
          query: 'Hello',
        });

      expect(response.statusCode).toEqual(200);
    });
  });
});
