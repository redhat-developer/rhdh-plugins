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
  createInitialStreamingState,
  updateStreamingState,
} from './StreamingMessage.reducer';
import { STREAMING_PHASES, EVENT_TYPES } from './StreamingMessage.constants';
import { StreamingEvent } from '../../types';

/**
 * Integration tests that simulate complete Kagenti streaming sequences
 * through the reducer, verifying state transitions match expected UX.
 */
describe('Kagenti streaming integration', () => {
  function replay(events: StreamingEvent[]) {
    let state = createInitialStreamingState();
    for (const event of events) {
      state = updateStreamingState(state, event);
    }
    return state;
  }

  describe('simple text response', () => {
    it('progresses from connecting to completed with text', () => {
      const state = replay([
        {
          type: EVENT_TYPES.STREAM_STARTED,
          responseId: 'r1',
          model: 'ns/agent',
        },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'Hello ' },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'world!' },
        { type: EVENT_TYPES.STREAM_TEXT_DONE, text: 'Hello world!' },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.text).toBe('Hello world!');
      expect(state.completed).toBe(true);
      expect(state.responseId).toBe('r1');
      expect(state.phase).toBe(STREAMING_PHASES.COMPLETED);
    });
  });

  describe('tool call flow', () => {
    it('tracks tool call lifecycle', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_TOOL_STARTED,
          callId: 'tc1',
          name: 'web_search',
          serverLabel: 'mcp-server',
        },
        {
          type: EVENT_TYPES.STREAM_TOOL_COMPLETED,
          callId: 'tc1',
          name: 'web_search',
          output: 'search results',
        },
        {
          type: EVENT_TYPES.STREAM_TEXT_DELTA,
          delta: 'Based on the search...',
        },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.toolCalls).toHaveLength(1);
      expect(state.toolCalls[0].name).toBe('web_search');
      expect(state.toolCalls[0].output).toBe('search results');
      expect(state.toolCalls[0].status).toBe('completed');
      expect(state.text).toBe('Based on the search...');
    });

    it('handles multiple concurrent tool calls', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_TOOL_STARTED,
          callId: 'tc1',
          name: 'search',
        },
        {
          type: EVENT_TYPES.STREAM_TOOL_STARTED,
          callId: 'tc2',
          name: 'calculator',
        },
        {
          type: EVENT_TYPES.STREAM_TOOL_COMPLETED,
          callId: 'tc1',
          name: 'search',
          output: 'res1',
        },
        {
          type: EVENT_TYPES.STREAM_TOOL_COMPLETED,
          callId: 'tc2',
          name: 'calculator',
          output: 'res2',
        },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.toolCalls).toHaveLength(2);
      expect(state.toolCalls.every(tc => tc.status === 'completed')).toBe(true);
    });

    it('handles tool failure', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_TOOL_STARTED,
          callId: 'tc1',
          name: 'api_call',
        },
        {
          type: EVENT_TYPES.STREAM_TOOL_FAILED,
          callId: 'tc1',
          name: 'api_call',
          error: 'timeout',
        },
        {
          type: EVENT_TYPES.STREAM_TEXT_DELTA,
          delta: 'Tool failed, trying another approach...',
        },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.toolCalls).toHaveLength(1);
      expect(state.toolCalls[0].status).toBe('failed');
      expect(state.toolCalls[0].error).toBe('timeout');
    });
  });

  describe('reasoning steps', () => {
    it('captures reasoning content and transitions', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        { type: EVENT_TYPES.STREAM_REASONING_DELTA, delta: 'Let me think...' },
        { type: EVENT_TYPES.STREAM_REASONING_DELTA, delta: ' about this.' },
        {
          type: EVENT_TYPES.STREAM_REASONING_DONE,
          text: 'Let me think... about this.',
        },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'Answer here.' },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.reasoning).toBe('Let me think... about this.');
      expect(state.text).toBe('Answer here.');
      expect(state.phase).toBe(STREAMING_PHASES.COMPLETED);
    });
  });

  describe('tool approval (HITL) flow', () => {
    it('transitions to pending_approval phase', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_TOOL_APPROVAL,
          callId: 'tc1',
          name: 'database_write',
          arguments: '{"sql":"DELETE FROM users"}',
          responseId: 'r1',
        },
      ]);

      expect(state.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
      expect(state.pendingApproval).toBeDefined();
      expect(state.pendingApproval?.toolName).toBe('database_write');
      expect(state.pendingApproval?.toolCallId).toBe('tc1');
    });

    it('blocks text events while pending approval', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_TOOL_APPROVAL,
          callId: 'tc1',
          name: 'db_write',
          arguments: '{}',
          responseId: 'r1',
        },
        {
          type: EVENT_TYPES.STREAM_TEXT_DELTA,
          delta: 'This should be ignored',
        },
      ]);

      expect(state.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
      expect(state.text).toBe('');
    });
  });

  describe('form input flow', () => {
    it('transitions to form_input phase', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_FORM_REQUEST,
          taskId: 't1',
          contextId: 'ctx1',
          form: {
            title: 'User Details',
            description: 'Please fill in your details',
            fields: [
              { name: 'name', type: 'string', required: true, label: 'Name' },
              { name: 'age', type: 'number', label: 'Age' },
            ],
          },
        },
      ]);

      expect(state.phase).toBe(STREAMING_PHASES.FORM_INPUT);
      expect(state.pendingForm).toBeDefined();
      expect(state.pendingForm?.form.title).toBe('User Details');
      expect(state.pendingForm?.form.fields).toHaveLength(2);
    });

    it('blocks text events while form input is pending', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_FORM_REQUEST,
          taskId: 't1',
          contextId: 'ctx1',
          form: { title: 'Input', fields: [] },
        },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'Blocked' },
      ]);

      expect(state.phase).toBe(STREAMING_PHASES.FORM_INPUT);
      expect(state.text).toBe('');
    });
  });

  describe('auth required flow', () => {
    it('transitions to auth_required phase for OAuth', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_AUTH_REQUIRED,
          taskId: 't1',
          authType: 'oauth',
          url: 'https://oauth.example.com/auth',
        },
      ]);

      expect(state.phase).toBe(STREAMING_PHASES.AUTH_REQUIRED);
      expect(state.pendingAuth).toBeDefined();
      expect(state.pendingAuth?.authType).toBe('oauth');
      expect(state.pendingAuth?.url).toBe('https://oauth.example.com/auth');
    });

    it('transitions to auth_required phase for secrets', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_AUTH_REQUIRED,
          taskId: 't1',
          authType: 'secret',
          demands: {
            secrets: [
              { name: 'API_KEY', description: 'Your API key' },
              { name: 'SECRET', description: 'Your secret' },
            ],
          },
        },
      ]);

      expect(state.phase).toBe(STREAMING_PHASES.AUTH_REQUIRED);
      expect(state.pendingAuth?.authType).toBe('secret');
      expect(state.pendingAuth?.demands?.secrets).toHaveLength(2);
    });
  });

  describe('multi-agent handoff', () => {
    it('captures handoff events and updates currentAgent', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_AGENT_HANDOFF,
          fromAgent: 'router',
          toAgent: 'specialist',
        },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'Specialist response.' },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.currentAgent).toBe('specialist');
      expect(state.handoffs).toHaveLength(1);
      expect(state.handoffs[0].from).toBe('router');
      expect(state.handoffs[0].to).toBe('specialist');
      expect(state.text).toBe('Specialist response.');
    });

    it('tracks multiple handoffs', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_AGENT_HANDOFF,
          fromAgent: 'router',
          toAgent: 'agent-a',
        },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'from A' },
        {
          type: EVENT_TYPES.STREAM_AGENT_HANDOFF,
          fromAgent: 'agent-a',
          toAgent: 'agent-b',
        },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: ' and B' },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.handoffs).toHaveLength(2);
      expect(state.currentAgent).toBe('agent-b');
      expect(state.text).toBe('from A and B');
    });
  });

  describe('error handling', () => {
    it('handles stream error event', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'Partial...' },
        {
          type: EVENT_TYPES.STREAM_ERROR,
          error: 'Agent timed out',
          code: 'timeout',
        },
      ]);

      expect(state.errorCode).toBe('timeout');
      expect(state.completed).toBe(true);
      expect(state.text).toBe('Partial...');
    });

    it('fills in error text when no prior text exists', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_ERROR,
          error: 'Connection lost',
          code: 'network',
        },
      ]);

      expect(state.text).toBe('Error: Connection lost');
      expect(state.completed).toBe(true);
    });
  });

  describe('artifact events', () => {
    it('captures artifacts', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_ARTIFACT,
          artifactId: 'a1',
          name: 'chart.png',
          content: 'base64data',
        },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.artifacts).toHaveLength(1);
      expect(state.artifacts![0].artifactId).toBe('a1');
      expect(state.artifacts![0].name).toBe('chart.png');
    });

    it('appends to existing artifact with append flag', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_ARTIFACT,
          artifactId: 'a1',
          name: 'data',
          content: 'chunk1',
        },
        {
          type: EVENT_TYPES.STREAM_ARTIFACT,
          artifactId: 'a1',
          append: true,
          content: 'chunk2',
          lastChunk: true,
        },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.artifacts).toHaveLength(1);
      expect(state.artifacts![0].content).toBe('chunk1chunk2');
      expect(state.artifacts![0].lastChunk).toBe(true);
    });
  });

  describe('citation events', () => {
    it('captures citations', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_TEXT_DELTA,
          delta: 'According to source...',
        },
        {
          type: EVENT_TYPES.STREAM_CITATION,
          citations: [
            {
              title: 'RFC 9110',
              url: 'https://www.rfc-editor.org/rfc/rfc9110',
              snippet: 'HTTP Semantics',
            },
          ],
        },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.citations).toHaveLength(1);
      expect(state.citations![0].title).toBe('RFC 9110');
      expect(state.ragSources).toBeDefined();
    });

    it('deduplicates citations by URL', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_CITATION,
          citations: [{ title: 'A', url: 'https://example.com' }],
        },
        {
          type: EVENT_TYPES.STREAM_CITATION,
          citations: [{ title: 'A', url: 'https://example.com' }],
        },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.citations).toHaveLength(1);
    });
  });

  describe('RAG search flow', () => {
    it('captures RAG sources', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_RAG_RESULTS,
          sources: [
            {
              filename: 'deployment.yaml',
              text: 'apiVersion: apps/v1',
              score: 0.95,
            },
            { filename: 'values.yaml', text: 'replicas: 3', score: 0.85 },
          ],
        },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'Based on config...' },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.ragSources).toHaveLength(2);
      expect(state.filesSearched).toContain('deployment.yaml');
      expect(state.filesSearched).toContain('values.yaml');
    });
  });

  describe('backend tool execution', () => {
    it('transitions to executing_backend_tools phase', () => {
      const state = replay([
        { type: EVENT_TYPES.STREAM_STARTED, responseId: 'r1' },
        {
          type: EVENT_TYPES.STREAM_BACKEND_TOOL_EXECUTING,
          toolCount: 0,
          tools: [],
        },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'Done.' },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      expect(state.text).toBe('Done.');
    });
  });

  describe('tool discovery', () => {
    it('transitions through discovery phase', () => {
      let state = createInitialStreamingState();
      state = updateStreamingState(state, {
        type: EVENT_TYPES.STREAM_STARTED,
        responseId: 'r1',
      });
      state = updateStreamingState(state, {
        type: EVENT_TYPES.STREAM_TOOL_DISCOVERY,
        status: 'in_progress',
      });
      expect(state.phase).toBe(STREAMING_PHASES.DISCOVERING_TOOLS);

      state = updateStreamingState(state, {
        type: EVENT_TYPES.STREAM_TOOL_DISCOVERY,
        status: 'completed',
      });
      expect(state.phase).toBe(STREAMING_PHASES.THINKING);
    });
  });

  describe('full multi-step Kagenti agent flow', () => {
    it('handles reasoning → tool → handoff → text → complete', () => {
      const state = replay([
        {
          type: EVENT_TYPES.STREAM_STARTED,
          responseId: 'r1',
          model: 'default/orchestrator',
        },
        {
          type: EVENT_TYPES.STREAM_REASONING_DELTA,
          delta: 'I need to search first.',
        },
        {
          type: EVENT_TYPES.STREAM_REASONING_DONE,
          text: 'I need to search first.',
        },
        {
          type: EVENT_TYPES.STREAM_TOOL_STARTED,
          callId: 'tc1',
          name: 'web_search',
        },
        {
          type: EVENT_TYPES.STREAM_TOOL_COMPLETED,
          callId: 'tc1',
          name: 'web_search',
          output: 'Results found',
        },
        {
          type: EVENT_TYPES.STREAM_AGENT_HANDOFF,
          fromAgent: 'orchestrator',
          toAgent: 'analyst',
        },
        { type: EVENT_TYPES.STREAM_TEXT_DELTA, delta: 'The analysis shows...' },
        { type: EVENT_TYPES.STREAM_COMPLETED, responseId: 'r1' },
      ]);

      // reasoning is cleared on handoff (by design — each agent starts fresh)
      expect(state.reasoning).toBeUndefined();
      expect(state.toolCalls).toHaveLength(1);
      expect(state.toolCalls[0].status).toBe('completed');
      expect(state.currentAgent).toBe('analyst');
      expect(state.handoffs).toHaveLength(1);
      expect(state.text).toBe('The analysis shows...');
      expect(state.completed).toBe(true);
      expect(state.model).toBe('default/orchestrator');
    });
  });
});
