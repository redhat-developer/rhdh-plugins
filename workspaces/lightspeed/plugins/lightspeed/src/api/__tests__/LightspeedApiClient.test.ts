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

import { ConfigApi, FetchApi } from '@backstage/core-plugin-api';

import { TEMP_CONVERSATION_ID } from '../../const';
import { LightspeedApiClient } from '../LightspeedApiClient';

describe('LightspeedApiClient', () => {
  let mockConfigApi: jest.Mocked<ConfigApi>;
  let mockFetchApi: jest.Mocked<FetchApi>;
  let client: LightspeedApiClient;

  beforeEach(() => {
    mockConfigApi = {
      getString: jest.fn().mockReturnValue('http://localhost:7007'),
    } as unknown as jest.Mocked<ConfigApi>;

    mockFetchApi = {
      fetch: jest.fn(),
    } as unknown as jest.Mocked<FetchApi>;

    client = new LightspeedApiClient({
      configApi: mockConfigApi,
      fetchApi: mockFetchApi,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBaseUrl', () => {
    it('should return the correct base URL', async () => {
      const baseUrl = await client.getBaseUrl();
      expect(baseUrl).toBe('http://localhost:7007/api/lightspeed');
      expect(mockConfigApi.getString).toHaveBeenCalledWith('backend.baseUrl');
    });
  });

  describe('getAllModels', () => {
    it('should return models when API call succeeds', async () => {
      const mockModels = [
        { identifier: 'model1', type: 'model' },
        { identifier: 'model2', type: 'model' },
      ];

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ models: mockModels }),
      } as unknown as Response);

      const result = await client.getAllModels();

      expect(result).toEqual(mockModels);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/v1/models',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should return empty array when models is undefined', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response);

      const result = await client.getAllModels();
      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as unknown as Response);

      await expect(client.getAllModels()).rejects.toThrow(
        'failed to fetch data, status 500: Internal Server Error',
      );
    });
  });

  describe('getConversations', () => {
    it('should return conversations when API call succeeds', async () => {
      const mockConversations = [
        { conversation_id: 'conv1', topic_summary: 'Test' },
      ];

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ conversations: mockConversations }),
      } as unknown as Response);

      const result = await client.getConversations();

      expect(result).toEqual(mockConversations);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/v2/conversations',
        expect.any(Object),
      );
    });

    it('should return empty array when conversations is undefined', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response);

      const result = await client.getConversations();
      expect(result).toEqual([]);
    });
  });

  describe('getConversationMessages', () => {
    it('should return empty array for temp conversation ID', async () => {
      const result = await client.getConversationMessages(TEMP_CONVERSATION_ID);
      expect(result).toEqual([]);
      expect(mockFetchApi.fetch).not.toHaveBeenCalled();
    });

    it('should return messages when API call succeeds', async () => {
      const mockMessages = [{ id: 1, content: 'Hello' }];

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ chat_history: mockMessages }),
      } as unknown as Response);

      const result = await client.getConversationMessages('conv-123');

      expect(result).toEqual(mockMessages);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/v2/conversations/conv-123',
        expect.any(Object),
      );
    });

    it('should return empty array when chat_history is undefined', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response);

      const result = await client.getConversationMessages('conv-123');
      expect(result).toEqual([]);
    });
  });

  describe('deleteConversation', () => {
    it('should return success when delete succeeds', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
      } as unknown as Response);

      const result = await client.deleteConversation('conv-123');

      expect(result).toEqual({ success: true });
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/v2/conversations/conv-123',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('should throw error when delete fails', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response);

      await expect(client.deleteConversation('conv-123')).rejects.toThrow(
        'failed to delete conversation, status 404: Not Found',
      );
    });
  });

  describe('renameConversation', () => {
    it('should return success when rename succeeds', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
      } as unknown as Response);

      const result = await client.renameConversation('conv-123', 'New Name');

      expect(result).toEqual({ success: true });
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/v2/conversations/conv-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ topic_summary: 'New Name' }),
        }),
      );
    });

    it('should throw error when rename fails', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as unknown as Response);

      await expect(
        client.renameConversation('conv-123', 'New Name'),
      ).rejects.toThrow(
        'failed to rename conversation, status 400: Bad Request',
      );
    });
  });

  describe('getFeedbackStatus', () => {
    it('should return true when feedback is enabled', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ status: { enabled: true } }),
      } as unknown as Response);

      const result = await client.getFeedbackStatus();

      expect(result).toBe(true);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/v1/feedback/status',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should return false when feedback is disabled', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ status: { enabled: false } }),
      } as unknown as Response);

      const result = await client.getFeedbackStatus();
      expect(result).toBe(false);
    });

    it('should return false when status is undefined', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response);

      const result = await client.getFeedbackStatus();
      expect(result).toBe(false);
    });

    it('should throw error when API call fails', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as unknown as Response);

      await expect(client.getFeedbackStatus()).rejects.toThrow(
        'failed to GET feedback status, status 500: Internal Server Error',
      );
    });
  });

  describe('captureFeedback', () => {
    it('should return response when feedback is captured', async () => {
      const mockPayload = {
        conversation_id: 'conv-123',
        user_question: 'test question',
        llm_response: 'test response',
        user_feedback: 'Great!',
        sentiment: 1,
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ response: 'success' }),
      } as unknown as Response);

      const result = await client.captureFeedback(mockPayload);

      expect(result).toEqual({ response: 'success' });
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/v1/feedback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockPayload),
        }),
      );
    });

    it('should throw error when capture fails', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as unknown as Response);

      await expect(
        client.captureFeedback({
          conversation_id: 'conv-123',
          user_question: 'test',
          llm_response: 'test',
          user_feedback: 'test',
          sentiment: 1,
        }),
      ).rejects.toThrow('failed to capture feedback, status 400: Bad Request');
    });
  });

  describe('isTopicRestrictionEnabled', () => {
    it('should return true when valid shield is present', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          shields: [
            {
              provider_resource_id: 'lightspeed_question_validity-shield',
            },
          ],
        }),
      } as unknown as Response);

      const result = await client.isTopicRestrictionEnabled();
      expect(result).toBe(true);
    });

    it('should return false when no valid shield is present', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          shields: [{ provider_resource_id: 'other-shield' }],
        }),
      } as unknown as Response);

      const result = await client.isTopicRestrictionEnabled();
      expect(result).toBe(false);
    });

    it('should return false when shields array is empty', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ shields: [] }),
      } as unknown as Response);

      const result = await client.isTopicRestrictionEnabled();
      expect(result).toBe(false);
    });

    it('should return false when shields is not an array', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response);

      const result = await client.isTopicRestrictionEnabled();
      expect(result).toBe(false);
    });
  });

  describe('createMessage', () => {
    it('should return readable stream reader when message is created', async () => {
      const mockReader = {
        read: jest.fn(),
      };
      const mockBody = {
        getReader: jest.fn().mockReturnValue(mockReader),
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        body: mockBody,
      } as unknown as Response);

      const result = await client.createMessage(
        'Hello',
        'granite',
        'openai',
        'conv-123',
        [],
      );

      expect(result).toBe(mockReader);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/v1/query',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            conversation_id: 'conv-123',
            model: 'granite',
            provider: 'openai',
            query: 'Hello',
            attachments: [],
          }),
        }),
      );
    });

    it('should send undefined conversation_id for temp conversation', async () => {
      const mockReader = { read: jest.fn() };
      const mockBody = { getReader: jest.fn().mockReturnValue(mockReader) };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        body: mockBody,
      } as unknown as Response);

      await client.createMessage(
        'Hello',
        'granite',
        'openai',
        TEMP_CONVERSATION_ID,
        [],
      );

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            conversation_id: undefined,
            model: 'granite',
            provider: 'openai',
            query: 'Hello',
            attachments: [],
          }),
        }),
      );
    });

    it('should throw error when response has no body', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        body: null,
      } as unknown as Response);

      await expect(
        client.createMessage('Hello', 'granite', 'openai', 'conv-123', []),
      ).rejects.toThrow(
        'Readable stream is not supported or there is no body.',
      );
    });

    it('should throw error with message from response when not ok', async () => {
      const errorMessage = { error: 'Invalid request' };
      const mockReader = {
        read: jest.fn().mockResolvedValue({
          done: false,
          value: new TextEncoder().encode(JSON.stringify(errorMessage)),
        }),
      };
      const mockBody = {
        getReader: jest.fn().mockReturnValue(mockReader),
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        body: mockBody,
      } as unknown as Response);

      await expect(
        client.createMessage('Hello', 'granite', 'openai', 'conv-123', []),
      ).rejects.toThrow('failed to create message: Invalid request');
    });
  });
});
