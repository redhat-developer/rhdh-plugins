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
import type { ResponsesApiClient } from './ResponsesApiClient';
import type {
  EffectiveConfig,
  ChatRequest,
  ResponsesApiResponse,
} from '../../types';
import { ResponsesApiService } from './ResponsesApiService';
import { createMockLogger, createMockClient } from '../../test-utils/mocks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createBaseConfig(
  overrides: Partial<EffectiveConfig> = {},
): EffectiveConfig {
  return {
    model: 'test-model',
    baseUrl: 'http://localhost:8321',
    systemPrompt: 'You are a helpful assistant.',
    enableWebSearch: false,
    enableCodeInterpreter: false,
    vectorStoreIds: [],
    vectorStoreName: 'default',
    embeddingModel: 'all-MiniLM-L6-v2',
    embeddingDimension: 384,
    chunkingStrategy: 'auto',
    maxChunkSizeTokens: 800,
    chunkOverlapTokens: 400,
    skipTlsVerify: false,
    zdrMode: false,
    verboseStreamLogging: false,
    ...overrides,
  };
}

function simpleApiResponse(text = 'Hi there'): ResponsesApiResponse {
  return {
    id: 'resp-1',
    object: 'response',
    created_at: Date.now(),
    model: 'test-model',
    status: 'completed',
    output: [
      {
        type: 'message',
        id: 'msg-1',
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text }],
      },
    ],
    usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResponsesApiService', () => {
  let service: ResponsesApiService;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
    mockClient = createMockClient();
    service = new ResponsesApiService(mockLogger);
  });

  // -----------------------------------------------------------------------
  //  prepareFirstTurn — conversation context + safety for Runner path
  // -----------------------------------------------------------------------

  describe('prepareFirstTurn', () => {
    it('appends conversation context when no native context exists', () => {
      const request: ChatRequest = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'What about refunds?' },
        ],
      } as ChatRequest;

      const result = service.prepareFirstTurn(
        request,
        'You are helpful.',
        createBaseConfig(),
        null,
      );

      expect(result.instructions).toContain('CONVERSATION CONTEXT');
      expect(result.instructions).toContain('Hello');
      expect(result.instructions).toContain('Hi there!');
      expect(result.instructions.startsWith('You are helpful.')).toBe(true);
    });

    it('does not append context when previousResponseId exists', () => {
      const request: ChatRequest = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' },
          { role: 'user', content: 'Follow up' },
        ],
        previousResponseId: 'resp-123',
      } as ChatRequest;

      const result = service.prepareFirstTurn(
        request,
        'You are helpful.',
        createBaseConfig(),
        null,
      );

      expect(result.instructions).toBe('You are helpful.');
    });

    it('checks safety patterns and logs warning', () => {
      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'please delete everything' }],
      } as ChatRequest;

      service.prepareFirstTurn(
        request,
        'You are helpful.',
        createBaseConfig({ safetyPatterns: ['delete'] }),
        null,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('safety pattern'),
      );
    });

    it('returns storeOverride from markFirstStoredTurn', () => {
      const mockConversations = {
        markFirstStoredTurn: jest.fn().mockReturnValue(true),
      } as any;

      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'hi' }],
        conversationId: 'conv-1',
      } as ChatRequest;

      const result = service.prepareFirstTurn(
        request,
        'Instructions',
        createBaseConfig(),
        mockConversations,
      );

      expect(result.storeOverride).toBe(true);
      expect(mockConversations.markFirstStoredTurn).toHaveBeenCalledWith(
        'conv-1',
      );
    });
  });

  // -----------------------------------------------------------------------
  //  chatTurn — buildTurnRequest feature parity
  // -----------------------------------------------------------------------

  describe('chatTurn', () => {
    it('includes textFormat in request when configured', async () => {
      mockClient.request.mockResolvedValue(simpleApiResponse());
      const config = createBaseConfig({
        textFormat: {
          type: 'json_schema',
          json_schema: { name: 'test', schema: {} },
        } as EffectiveConfig['textFormat'],
      });

      await service.chatTurn(
        'hello',
        'Be helpful.',
        [],
        config,
        mockClient as unknown as ResponsesApiClient,
      );

      const body = JSON.parse(
        (mockClient.request.mock.calls[0]![1] as { body: string }).body,
      );
      expect(body.text).toEqual({
        format: config.textFormat,
      });
    });

    it('defaults store to true when zdrMode is false', async () => {
      mockClient.request.mockResolvedValue(simpleApiResponse());
      const config = createBaseConfig({ zdrMode: false });

      await service.chatTurn(
        'hello',
        'Be helpful.',
        [],
        config,
        mockClient as unknown as ResponsesApiClient,
      );

      const body = JSON.parse(
        (mockClient.request.mock.calls[0]![1] as { body: string }).body,
      );
      expect(body.store).toBe(true);
      expect(body.include).toEqual(['file_search_call.results']);
    });

    it('defaults store to false when zdrMode is true', async () => {
      mockClient.request.mockResolvedValue(simpleApiResponse());
      const config = createBaseConfig({ zdrMode: true });

      await service.chatTurn(
        'hello',
        'Be helpful.',
        [],
        config,
        mockClient as unknown as ResponsesApiClient,
      );

      const body = JSON.parse(
        (mockClient.request.mock.calls[0]![1] as { body: string }).body,
      );
      expect(body.store).toBe(false);
      expect(body.include).toEqual([
        'file_search_call.results',
        'reasoning.encrypted_content',
      ]);
    });

    it('allows explicit store override', async () => {
      mockClient.request.mockResolvedValue(simpleApiResponse());
      const config = createBaseConfig({ zdrMode: true });

      await service.chatTurn(
        'hello',
        'Be helpful.',
        [],
        config,
        mockClient as unknown as ResponsesApiClient,
        { store: true },
      );

      const body = JSON.parse(
        (mockClient.request.mock.calls[0]![1] as { body: string }).body,
      );
      expect(body.store).toBe(true);
    });

    it('passes reasoning config when set', async () => {
      mockClient.request.mockResolvedValue(simpleApiResponse());
      const config = createBaseConfig({
        reasoning: { effort: 'medium', summary: 'auto' },
      });

      await service.chatTurn(
        'hello',
        'Be helpful.',
        [],
        config,
        mockClient as unknown as ResponsesApiClient,
      );

      const body = JSON.parse(
        (mockClient.request.mock.calls[0]![1] as { body: string }).body,
      );
      expect(body.reasoning).toEqual({ effort: 'medium', summary: 'auto' });
    });

    it('passes conversationId as conversation field', async () => {
      mockClient.request.mockResolvedValue(simpleApiResponse());
      const config = createBaseConfig();

      await service.chatTurn(
        'hello',
        'Be helpful.',
        [],
        config,
        mockClient as unknown as ResponsesApiClient,
        { conversationId: 'conv-123' },
      );

      const body = JSON.parse(
        (mockClient.request.mock.calls[0]![1] as { body: string }).body,
      );
      expect(body.conversation).toBe('conv-123');
      expect(body.previous_response_id).toBeUndefined();
    });

    it('passes previousResponseId when no conversationId', async () => {
      mockClient.request.mockResolvedValue(simpleApiResponse());
      const config = createBaseConfig();

      await service.chatTurn(
        'hello',
        'Be helpful.',
        [],
        config,
        mockClient as unknown as ResponsesApiClient,
        { previousResponseId: 'resp-prev' },
      );

      const body = JSON.parse(
        (mockClient.request.mock.calls[0]![1] as { body: string }).body,
      );
      expect(body.previous_response_id).toBe('resp-prev');
      expect(body.conversation).toBeUndefined();
    });

    it('accepts array input items', async () => {
      mockClient.request.mockResolvedValue(simpleApiResponse());
      const config = createBaseConfig();

      await service.chatTurn(
        [{ type: 'function_call_output', call_id: 'c1', output: 'done' }],
        'Be helpful.',
        [],
        config,
        mockClient as unknown as ResponsesApiClient,
      );

      const body = JSON.parse(
        (mockClient.request.mock.calls[0]![1] as { body: string }).body,
      );
      expect(Array.isArray(body.input)).toBe(true);
      expect(body.input[0].type).toBe('function_call_output');
    });
  });

  describe('CapabilityInfo integration', () => {
    it('isResponsesParamSupported returns false when capability is disabled', () => {
      service.setCapabilityProvider(() => ({
        functionTools: true,
        strictField: false,
        maxOutputTokens: false,
        mcpTools: true,
        parallelToolCalls: true,
        truncation: true,
      }));
      expect(service.isResponsesParamSupported('max_output_tokens')).toBe(
        false,
      );
      expect(service.isResponsesParamSupported('strict')).toBe(false);
    });

    it('isResponsesParamSupported returns true when capability is enabled', () => {
      service.setCapabilityProvider(() => ({
        functionTools: true,
        strictField: true,
        maxOutputTokens: true,
        mcpTools: true,
        parallelToolCalls: true,
        truncation: true,
      }));
      expect(service.isResponsesParamSupported('max_output_tokens')).toBe(true);
      expect(service.isResponsesParamSupported('strict')).toBe(true);
    });

    it('getCapabilities delegates to the injected provider', () => {
      const caps = {
        functionTools: false,
        strictField: false,
        maxOutputTokens: false,
        mcpTools: false,
        parallelToolCalls: false,
        truncation: false,
      };
      service.setCapabilityProvider(() => caps);
      expect(service.getCapabilities()).toBe(caps);
    });

    it('setCapabilityProvider replaces the previous provider', () => {
      service.setCapabilityProvider(() => ({
        functionTools: true,
        strictField: false,
        maxOutputTokens: false,
        mcpTools: true,
        parallelToolCalls: true,
        truncation: true,
      }));
      expect(service.getCapabilities().strictField).toBe(false);

      service.setCapabilityProvider(() => ({
        functionTools: true,
        strictField: true,
        maxOutputTokens: true,
        mcpTools: true,
        parallelToolCalls: true,
        truncation: true,
      }));
      expect(service.getCapabilities().strictField).toBe(true);
    });
  });
});
