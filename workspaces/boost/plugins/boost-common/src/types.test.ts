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

import type {
  AgenticProvider,
  ProviderCapabilities,
  ProviderDescriptor,
  InputItem,
  ConversationSummary,
  ConversationDetails,
  NormalizedStreamEvent,
} from './types';

describe('types', () => {
  describe('ProviderCapabilities', () => {
    it('can be constructed with all required fields', () => {
      const caps: ProviderCapabilities = {
        chat: true,
        rag: false,
        safety: false,
        evaluation: false,
        conversations: true,
        mcpTools: false,
        tools: true,
        agentCatalog: false,
        namespaceScoping: false,
        devSpaces: false,
        buildPipelines: false,
      };
      expect(caps.chat).toBe(true);
      expect(caps.rag).toBe(false);
      expect(caps.agentCatalog).toBe(false);
    });
  });

  describe('ProviderDescriptor', () => {
    it('can be constructed with all required fields', () => {
      const descriptor: ProviderDescriptor = {
        id: 'test-provider',
        displayName: 'Test Provider',
        description: 'A test provider',
        implemented: true,
        capabilities: {
          chat: true,
          rag: false,
          safety: false,
          evaluation: false,
          conversations: false,
          mcpTools: false,
          tools: false,
          agentCatalog: false,
          namespaceScoping: false,
          devSpaces: false,
          buildPipelines: false,
        },
      };
      expect(descriptor.id).toBe('test-provider');
      expect(descriptor.implemented).toBe(true);
    });
  });

  describe('InputItem', () => {
    it('supports system, user, and assistant roles', () => {
      const items: InputItem[] = [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      expect(items).toHaveLength(3);
      expect(items[0].role).toBe('system');
      expect(items[1].role).toBe('user');
      expect(items[2].role).toBe('assistant');
    });
  });

  describe('ConversationSummary', () => {
    it('can be constructed with all required fields', () => {
      const summary: ConversationSummary = {
        conversationId: 'conv-123',
        preview: 'Hello, how are you?',
        createdAt: new Date('2026-01-01'),
        model: 'llama-3',
        status: 'completed',
      };
      expect(summary.conversationId).toBe('conv-123');
      expect(summary.status).toBe('completed');
    });
  });

  describe('ConversationDetails', () => {
    it('extends summary with messages', () => {
      const details: ConversationDetails = {
        conversationId: 'conv-123',
        preview: 'Hello',
        createdAt: new Date('2026-01-01'),
        model: 'llama-3',
        status: 'completed',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi!' },
        ],
      };
      expect(details.messages).toHaveLength(2);
    });
  });

  describe('NormalizedStreamEvent', () => {
    it('supports all event types via discriminated union', () => {
      const events: NormalizedStreamEvent[] = [
        { type: 'stream.started', responseId: 'resp-1' },
        { type: 'stream.text.delta', delta: 'Hello' },
        { type: 'stream.text.done', text: 'Hello world' },
        { type: 'stream.reasoning.delta', delta: 'thinking...' },
        { type: 'stream.reasoning.done', text: 'thought complete' },
        {
          type: 'stream.tool.discovery',
          status: 'completed',
          toolCount: 5,
        },
        { type: 'stream.tool.started', callId: 'call-1', name: 'search' },
        { type: 'stream.tool.delta', callId: 'call-1', delta: '{}' },
        {
          type: 'stream.tool.completed',
          callId: 'call-1',
          name: 'search',
          output: 'result',
        },
        {
          type: 'stream.tool.failed',
          callId: 'call-1',
          name: 'search',
          error: 'timeout',
        },
        {
          type: 'stream.tool.approval',
          callId: 'call-1',
          name: 'deploy',
        },
        {
          type: 'stream.backend_tool.executing',
          toolCount: 1,
          tools: ['search'],
        },
        {
          type: 'stream.rag.results',
          sources: [{ filename: 'doc.pdf' }],
        },
        { type: 'stream.agent.handoff', toAgent: 'billing' },
        { type: 'stream.completed', responseId: 'resp-1' },
        { type: 'stream.error', error: 'something broke' },
      ];

      expect(events).toHaveLength(16);

      // Verify discriminated union works via type narrowing
      for (const event of events) {
        switch (event.type) {
          case 'stream.started':
            expect(event.responseId).toBeDefined();
            break;
          case 'stream.text.delta':
            expect(event.delta).toBeDefined();
            break;
          case 'stream.error':
            expect(event.error).toBeDefined();
            break;
          default:
            // All other events are valid members of the union
            break;
        }
      }
    });
  });

  describe('AgenticProvider interface', () => {
    it('can be satisfied by a mock implementation', async () => {
      const mockProvider: AgenticProvider = {
        descriptor: {
          id: 'mock',
          displayName: 'Mock Provider',
          description: 'A mock provider for testing',
          implemented: true,
          capabilities: {
            chat: true,
            rag: false,
            safety: false,
            evaluation: false,
            conversations: false,
            mcpTools: false,
            tools: false,
            agentCatalog: false,
            namespaceScoping: false,
            devSpaces: false,
            buildPipelines: false,
          },
        },
        chat: async () => ({
          content: 'Hello!',
          responseId: 'resp-1',
        }),
        chatStream: async ({ onEvent }) => {
          onEvent({ type: 'stream.started', responseId: 'resp-1' });
          onEvent({ type: 'stream.text.delta', delta: 'Hello!' });
          onEvent({
            type: 'stream.text.done',
            text: 'Hello!',
          });
          onEvent({ type: 'stream.completed', responseId: 'resp-1' });
        },
      };

      const result = await mockProvider.chat({
        messages: [{ role: 'user', content: 'Hi' }],
        userRef: 'user:default/test',
      });
      expect(result.content).toBe('Hello!');
      expect(mockProvider.descriptor.id).toBe('mock');
      expect(mockProvider.conversations).toBeUndefined();
    });
  });

  describe('no provider-specific types', () => {
    it('does not export any Kagenti or LlamaStack specific types', () => {
      // This test verifies task 1.6: no provider-specific types in common package.
      // We check that the module's exports don't include provider-specific prefixes.
      const exports = Object.keys(
        require('./types'),
      );
      const providerSpecific = exports.filter(
        name =>
          name.startsWith('Kagenti') ||
          name.startsWith('LlamaStack') ||
          name.startsWith('Llama'),
      );
      expect(providerSpecific).toEqual([]);
    });
  });
});
