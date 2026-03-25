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
  extractContentFromItem,
  extractUserInputFromRaw,
  getInputText,
  processConversationItems,
} from './MessageProcessor';
import { createMockLogger } from '../../test-utils';
import type { ConversationItem } from './conversationTypes';

describe('MessageProcessor', () => {
  const logger = createMockLogger();

  describe('extractContentFromItem', () => {
    it('returns empty string for undefined', () => {
      expect(extractContentFromItem(undefined)).toBe('');
    });

    it('returns string content as-is', () => {
      expect(extractContentFromItem('Hello world')).toBe('Hello world');
    });

    it('extracts and joins text from input_text, output_text, and text parts', () => {
      const content = [
        { type: 'input_text', text: 'Part1' },
        { type: 'output_text', text: 'Part2' },
        { type: 'text', text: 'Part3' },
        { type: 'other', text: 'Ignored' },
      ];
      expect(extractContentFromItem(content)).toBe('Part1Part2Part3');
    });

    it('skips parts without text or with non-string text', () => {
      const content = [
        { type: 'input_text', text: 'Valid' },
        { type: 'text' },
        { type: 'output_text', text: 123 as unknown as string },
      ];
      expect(extractContentFromItem(content)).toBe('Valid');
    });

    it('returns empty string for empty array', () => {
      expect(extractContentFromItem([])).toBe('');
    });

    it('returns empty string for non-matching array', () => {
      const content = [{ type: 'image', url: 'x' }, { type: 'other' }];
      expect(
        extractContentFromItem(
          content as Array<{ type: string; text?: string }>,
        ),
      ).toBe('');
    });

    it('excludes input_text when excludeInputText is true', () => {
      const content = [
        { type: 'input_text', text: 'System prompt here' },
        { type: 'output_text', text: 'Model response' },
      ];
      expect(extractContentFromItem(content, true)).toBe('Model response');
    });

    it('includes input_text when excludeInputText is false (default)', () => {
      const content = [
        { type: 'input_text', text: 'User query' },
        { type: 'output_text', text: 'Reply' },
      ];
      expect(extractContentFromItem(content, false)).toBe('User queryReply');
      expect(extractContentFromItem(content)).toBe('User queryReply');
    });

    it('returns only output_text and text when excludeInputText is true', () => {
      const content = [
        { type: 'input_text', text: 'Instructions leaked' },
        { type: 'output_text', text: 'Here are the results' },
        { type: 'text', text: ' with details' },
      ];
      expect(extractContentFromItem(content, true)).toBe(
        'Here are the results with details',
      );
    });
  });

  describe('extractUserInputFromRaw', () => {
    it('returns string input as-is', () => {
      expect(extractUserInputFromRaw('User query')).toBe('User query');
    });

    it('extracts from message with role user and string content', () => {
      const input = [{ type: 'message', role: 'user', content: 'Hello' }];
      expect(extractUserInputFromRaw(input)).toBe('Hello');
    });

    it('extracts from message with role user and array content', () => {
      const input = [
        {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: 'From array' }],
        },
      ];
      expect(extractUserInputFromRaw(input)).toBe('From array');
    });

    it('extracts from input_text item', () => {
      const input = [{ type: 'input_text', text: 'Direct input' }];
      expect(extractUserInputFromRaw(input)).toBe('Direct input');
    });

    it('returns empty string for empty array', () => {
      expect(extractUserInputFromRaw([])).toBe('');
    });

    it('returns empty string when no user message or input_text', () => {
      const input = [
        { type: 'message', role: 'assistant', content: 'Hi' },
        { type: 'other' },
      ];
      expect(extractUserInputFromRaw(input)).toBe('');
    });

    it('skips null/undefined items in array', () => {
      const input = [null, { type: 'input_text', text: 'Valid' }];
      expect(extractUserInputFromRaw(input as unknown[])).toBe('Valid');
    });

    it('prefers user message over bare input_text (prevents instruction leak)', () => {
      const input = [
        { type: 'input_text', text: 'You are an AI assistant. Be helpful.' },
        { type: 'message', role: 'user', content: 'List namespaces' },
      ];
      expect(extractUserInputFromRaw(input)).toBe('List namespaces');
    });

    it('falls back to input_text only when no user message exists', () => {
      const input = [{ type: 'input_text', text: 'Direct user query' }];
      expect(extractUserInputFromRaw(input)).toBe('Direct user query');
    });
  });

  describe('getInputText', () => {
    it('returns string truncated to 80 chars with ellipsis', () => {
      const long = 'a'.repeat(100);
      expect(getInputText(long)).toBe(`${'a'.repeat(80)}...`);
    });

    it('returns short string without ellipsis', () => {
      expect(getInputText('Short')).toBe('Short');
    });

    it('returns empty string for non-array when input is not string', () => {
      expect(getInputText(null as unknown as string)).toBe('');
    });

    it('extracts from first message in array and truncates', () => {
      const input = [
        {
          type: 'message',
          role: 'user',
          content: 'x'.repeat(100),
        },
      ];
      expect(getInputText(input)).toBe(`${'x'.repeat(80)}...`);
    });

    it('returns empty string for array without message type', () => {
      const input = [{ type: 'other', content: 'x' }];
      expect(getInputText(input)).toBe('');
    });

    it('prefers user message over developer/system message for preview', () => {
      const input = [
        {
          type: 'message',
          role: 'developer',
          content: 'You are an AI assistant',
        },
        { type: 'message', role: 'user', content: 'List pods' },
      ];
      expect(getInputText(input)).toBe('List pods');
    });

    it('skips developer and system messages entirely', () => {
      const input = [
        { type: 'message', role: 'system', content: 'System prompt text' },
      ];
      expect(getInputText(input)).toBe('');
    });
  });

  describe('processConversationItems', () => {
    it('processes user and assistant messages', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Hello' },
        { type: 'message', role: 'assistant', content: 'Hi there' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ role: 'user', text: 'Hello' });
      expect(result[1]).toEqual({ role: 'assistant', text: 'Hi there' });
    });

    it('skips mcp_list_tools items', () => {
      const items: ConversationItem[] = [
        { type: 'mcp_list_tools' },
        { type: 'message', role: 'user', content: 'Hi' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Hi');
    });

    it('groups tool calls with next assistant message', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Use tool' },
        {
          type: 'mcp_call',
          id: 'tc1',
          name: 'my_tool',
          server_label: 'server1',
        },
        { type: 'message', role: 'assistant', content: 'Done' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[1].toolCalls).toHaveLength(1);
      expect(result[1].toolCalls![0].name).toBe('my_tool');
    });

    it('drops orphaned tool calls before user message', () => {
      const items: ConversationItem[] = [
        { type: 'mcp_call', id: 'tc1', name: 'tool' },
        { type: 'message', role: 'user', content: 'Hi' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('orphaned tool call'),
      );
    });

    it('processes file_search_call and attaches RAG sources', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Search' },
        {
          type: 'file_search_call',
          id: 'fs1',
          queries: ['q1'],
          results: [
            { filename: 'doc.txt', file_id: 'f1', text: 'chunk', score: 0.9 },
          ],
        },
        { type: 'message', role: 'assistant', content: 'Found it' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[1].ragSources).toHaveLength(1);
      expect(result[1].ragSources![0].filename).toBe('doc.txt');
      expect(result[1].ragSources![0].fileId).toBe('f1');
    });

    it('adds createdAt from created_at when present', () => {
      const items: ConversationItem[] = [
        {
          type: 'message',
          role: 'user',
          content: 'Hi',
          created_at: 1709107200, // Unix seconds
        },
      ];
      const result = processConversationItems(items, logger);
      expect(result[0].createdAt).toBe(
        new Date(1709107200 * 1000).toISOString(),
      );
    });

    it('skips messages with empty text', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: '   ' },
        { type: 'message', role: 'assistant', content: 'Reply' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Reply');
    });

    it('excludes system prompt (input_text) from assistant messages', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'List namespaces' },
        {
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'input_text',
              text: 'You are an intelligent AI assistant for the Application Platform.',
            },
            {
              type: 'output_text',
              text: 'Here are the namespaces in the cluster.',
            },
          ],
        },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[1].text).toBe('Here are the namespaces in the cluster.');
      expect(result[1].text).not.toContain('intelligent AI assistant');
    });

    it('preserves input_text in user messages', () => {
      const items: ConversationItem[] = [
        {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: 'User query here' }],
        },
        { type: 'message', role: 'assistant', content: 'Response' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('User query here');
    });

    it('extracts reasoning from summary_text and attaches to next assistant message', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Think about this' },
        {
          type: 'reasoning',
          id: 'rs_1',
          summary: [
            { type: 'summary_text', text: 'Let me analyze the request.' },
            { type: 'summary_text', text: 'The user wants reasoning.' },
          ],
        },
        { type: 'message', role: 'assistant', content: 'Here is my answer.' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[1].reasoning).toBe(
        'Let me analyze the request.\n\nThe user wants reasoning.',
      );
    });

    it('extracts reasoning from content when summary is absent', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Think' },
        {
          type: 'reasoning',
          id: 'rs_2',
          content: [{ type: 'text', text: 'Reasoning via content field.' }],
        },
        { type: 'message', role: 'assistant', content: 'Done' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[1].reasoning).toBe('Reasoning via content field.');
    });

    it('accumulates multiple reasoning items into one string', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Deep thought' },
        {
          type: 'reasoning',
          summary: [{ type: 'summary_text', text: 'Step 1' }],
        },
        {
          type: 'reasoning',
          summary: [{ type: 'summary_text', text: 'Step 2' }],
        },
        { type: 'message', role: 'assistant', content: 'Result' },
      ];
      const result = processConversationItems(items, logger);
      expect(result[1].reasoning).toBe('Step 1\n\nStep 2');
    });

    it('does not attach reasoning to user messages', () => {
      const items: ConversationItem[] = [
        {
          type: 'reasoning',
          summary: [{ type: 'summary_text', text: 'Orphaned reasoning' }],
        },
        { type: 'message', role: 'user', content: 'Hello' },
        { type: 'message', role: 'assistant', content: 'Hi' },
      ];
      const result = processConversationItems(items, logger);
      expect(result[0].reasoning).toBeUndefined();
      expect(result[1].reasoning).toBeUndefined();
    });

    it('infers agent name from transfer_to_* handoff function_call', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Route me' },
        {
          type: 'function_call',
          name: 'transfer_to_billing_agent',
          call_id: 'call_1',
          arguments: '{}',
        },
        {
          type: 'function_call_output',
          call_id: 'call_1',
          output: JSON.stringify({ assistant: 'Billing Agent' }),
        },
        {
          type: 'message',
          role: 'assistant',
          content: 'I can help with billing.',
        },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[1].agentName).toBe('Billing Agent');
      expect(result[1].toolCalls).toBeUndefined();
    });

    it('uses parsed function name when function_call_output lacks assistant field', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Route me' },
        {
          type: 'function_call',
          name: 'transfer_to_support_team',
          call_id: 'call_2',
          arguments: '{}',
        },
        {
          type: 'function_call_output',
          call_id: 'call_2',
          output: 'Some plain text',
        },
        {
          type: 'message',
          role: 'assistant',
          content: 'Support here.',
        },
      ];
      const result = processConversationItems(items, logger);
      expect(result[1].agentName).toBe('support team');
    });

    it('does not filter non-handoff function_calls from toolCalls', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Use a tool' },
        {
          type: 'function_call',
          name: 'get_weather',
          call_id: 'call_3',
          arguments: '{"city":"NYC"}',
        },
        {
          type: 'message',
          role: 'assistant',
          content: 'The weather is sunny.',
        },
      ];
      const result = processConversationItems(items, logger);
      expect(result[1].toolCalls).toHaveLength(1);
      expect(result[1].toolCalls![0].name).toBe('get_weather');
      expect(result[1].agentName).toBeUndefined();
    });

    it('handles reasoning + handoff together on one assistant message', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Complex request' },
        {
          type: 'reasoning',
          summary: [{ type: 'summary_text', text: 'Deciding which agent.' }],
        },
        {
          type: 'function_call',
          name: 'transfer_to_expert',
          call_id: 'call_4',
          arguments: '{}',
        },
        {
          type: 'function_call_output',
          call_id: 'call_4',
          output: JSON.stringify({ assistant: 'Expert Agent' }),
        },
        {
          type: 'message',
          role: 'assistant',
          content: 'Expert here to help.',
        },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[1].reasoning).toBe('Deciding which agent.');
      expect(result[1].agentName).toBe('Expert Agent');
      expect(result[1].toolCalls).toBeUndefined();
    });

    it('resets pending state when a user message appears', () => {
      const items: ConversationItem[] = [
        {
          type: 'reasoning',
          summary: [{ type: 'summary_text', text: 'Leftover reasoning' }],
        },
        {
          type: 'function_call',
          name: 'transfer_to_old_agent',
          call_id: 'call_5',
          arguments: '{}',
        },
        { type: 'message', role: 'user', content: 'New question' },
        { type: 'message', role: 'assistant', content: 'Fresh answer' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(2);
      expect(result[1].reasoning).toBeUndefined();
      expect(result[1].agentName).toBeUndefined();
    });

    it('handles multiple handoffs in sequence', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Route me' },
        {
          type: 'function_call',
          name: 'transfer_to_router',
          call_id: 'c1',
          arguments: '{}',
        },
        {
          type: 'function_call_output',
          call_id: 'c1',
          output: JSON.stringify({ assistant: 'Router' }),
        },
        {
          type: 'message',
          role: 'assistant',
          content: 'Let me redirect you.',
        },
        {
          type: 'function_call',
          name: 'transfer_to_specialist',
          call_id: 'c2',
          arguments: '{}',
        },
        {
          type: 'function_call_output',
          call_id: 'c2',
          output: JSON.stringify({ assistant: 'Specialist' }),
        },
        {
          type: 'message',
          role: 'assistant',
          content: 'I am the specialist.',
        },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(3);
      expect(result[1].agentName).toBe('Router');
      expect(result[2].agentName).toBe('Specialist');
    });

    it('ignores reasoning items with empty summary', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Hi' },
        { type: 'reasoning', summary: [] },
        { type: 'message', role: 'assistant', content: 'Hello' },
      ];
      const result = processConversationItems(items, logger);
      expect(result[1].reasoning).toBeUndefined();
    });

    it('logs debug when messages are skipped due to empty text', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Hello' },
        { type: 'message', role: 'assistant', content: '  ' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Skipping assistant message with empty text'),
      );
    });

    it('warns when all items are filtered out', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: '' },
        { type: 'message', role: 'assistant', content: '' },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('produced 0 messages'),
      );
    });

    it('skips assistant messages where all content is input_text', () => {
      const items: ConversationItem[] = [
        { type: 'message', role: 'user', content: 'Hello' },
        {
          type: 'message',
          role: 'assistant',
          content: [{ type: 'input_text', text: 'system prompt instructions' }],
        },
      ];
      const result = processConversationItems(items, logger);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
    });
  });
});
