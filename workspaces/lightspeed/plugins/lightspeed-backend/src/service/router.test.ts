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

const mockUserId = `user: default/user1`;
const mockConversationId = 'conversation-id-1';
const encodedConversationId = encodeURIComponent(mockConversationId);
const mockConversationId2 = `conversation-id-2`;

const mockAnotherConversationId = `another-conversation-id`;

const mockModel = 'test-model';
const mockToken = 'dummy-token';

const BASE_CONFIG = {
  lightspeed: {
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

    it('returns 500 if unexpected error', async () => {
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
      expect(response.statusCode).toEqual(500);
    });
  });
});
