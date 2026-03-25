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
import {
  STREAMING_PHASES,
  EVENT_TYPES,
  TOOL_STATUS,
} from './StreamingMessage.constants';
import { StreamingEvent } from '../../types';
import { StreamingState } from './StreamingMessage.types';

describe('StreamingMessage.reducer', () => {
  describe('createInitialStreamingState', () => {
    it('creates initial state with connecting phase', () => {
      const state = createInitialStreamingState();

      expect(state.phase).toBe(STREAMING_PHASES.CONNECTING);
      expect(state.toolCalls).toEqual([]);
      expect(state.filesSearched).toEqual([]);
      expect(state.ragSources).toEqual([]);
      expect(state.text).toBe('');
      expect(state.completed).toBe(false);
    });
  });

  describe('updateStreamingState', () => {
    describe('response lifecycle events', () => {
      it('handles stream.started - transitions to thinking', () => {
        const state = createInitialStreamingState();
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_STARTED,
          responseId: 'resp-123',
          model: 'gemini-2.5-flash',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.THINKING);
        expect(newState.model).toBe('gemini-2.5-flash');
        expect(newState.responseId).toBe('resp-123');
      });

      it('stream.started resets reasoning state for new turn', () => {
        const stateWithReasoning: StreamingState = {
          ...createInitialStreamingState(),
          phase: STREAMING_PHASES.REASONING,
          reasoning: 'Previous agent reasoning...',
          reasoningDuration: 3,
          reasoningStartTime: Date.now() - 3000,
        };

        const newState = updateStreamingState(stateWithReasoning, {
          type: EVENT_TYPES.STREAM_STARTED,
          responseId: 'resp-new',
          model: 'test-model',
        } as StreamingEvent);

        expect(newState.phase).toBe(STREAMING_PHASES.THINKING);
        expect(newState.reasoning).toBeUndefined();
        expect(newState.reasoningDuration).toBeUndefined();
        expect(newState.reasoningStartTime).toBeUndefined();
        expect(newState.responseId).toBe('resp-new');
      });

      it('handles stream.completed - marks as completed', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'generating',
          text: 'Hello world',
        };
        const event: StreamingEvent = { type: EVENT_TYPES.STREAM_COMPLETED };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.COMPLETED);
        expect(newState.completed).toBe(true);
      });

      it('handles stream.completed with usage data', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'generating',
          text: 'Hello world',
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_COMPLETED,
          usage: {
            input_tokens: 150,
            output_tokens: 42,
            total_tokens: 192,
          },
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.COMPLETED);
        expect(newState.completed).toBe(true);
        expect(newState.usage).toEqual({
          input_tokens: 150,
          output_tokens: 42,
          total_tokens: 192,
        });
      });

      it('handles stream.completed without usage - usage remains undefined', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'generating',
          text: 'Hello world',
        };
        const event: StreamingEvent = { type: EVENT_TYPES.STREAM_COMPLETED };

        const newState = updateStreamingState(state, event);

        expect(newState.usage).toBeUndefined();
      });

      it('handles stream.completed - preserves pending_approval phase', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'pending_approval',
        };
        const event: StreamingEvent = { type: EVENT_TYPES.STREAM_COMPLETED };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
        expect(newState.completed).toBe(true);
      });

      it('handles stream.completed with usage during pending_approval', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'pending_approval',
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_COMPLETED,
          usage: {
            input_tokens: 200,
            output_tokens: 50,
            total_tokens: 250,
          },
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
        expect(newState.completed).toBe(true);
        expect(newState.usage).toEqual({
          input_tokens: 200,
          output_tokens: 50,
          total_tokens: 250,
        });
      });

      it('handles stream.error - sets error message', () => {
        const state = createInitialStreamingState();
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_ERROR,
          error: 'Network error',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.COMPLETED);
        expect(newState.completed).toBe(true);
        expect(newState.text).toBe('Error: Network error');
      });
    });

    describe('tool discovery events', () => {
      it('handles stream.tool.discovery in_progress', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'thinking',
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_DISCOVERY,
          status: 'in_progress',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.DISCOVERING_TOOLS);
      });

      it('handles stream.tool.discovery completed', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'discovering_tools',
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_DISCOVERY,
          status: 'completed',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.THINKING);
      });
    });

    describe('tool call events', () => {
      it('handles stream.tool.started - adds tool to toolCalls', () => {
        const state = createInitialStreamingState();
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_STARTED,
          callId: 'tool-1',
          name: 'pods_log',
          serverLabel: 'openshift-server',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.CALLING_TOOLS);
        expect(newState.toolCalls).toHaveLength(1);
        expect(newState.toolCalls[0].id).toBe('tool-1');
        expect(newState.toolCalls[0].name).toBe('pods_log');
        expect(newState.toolCalls[0].serverLabel).toBe('openshift-server');
        expect(newState.toolCalls[0].status).toBe(TOOL_STATUS.IN_PROGRESS);
      });

      it('handles stream.tool.completed - updates tool with output', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          toolCalls: [
            {
              id: 'tool-1',
              type: 'tool_call',
              name: 'pods_log',
              status: TOOL_STATUS.IN_PROGRESS,
            },
          ],
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_COMPLETED,
          callId: 'tool-1',
          name: 'pods_log',
          output: 'Log output here...',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.toolCalls[0].status).toBe(TOOL_STATUS.COMPLETED);
        expect(newState.toolCalls[0].output).toBe('Log output here...');
      });

      it('handles stream.tool.failed - marks tool as failed', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          toolCalls: [
            {
              id: 'tool-1',
              type: 'tool_call',
              name: 'pods_log',
              status: TOOL_STATUS.IN_PROGRESS,
            },
          ],
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_FAILED,
          callId: 'tool-1',
          name: 'pods_log',
          error: 'Pod not found',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.toolCalls[0].status).toBe(TOOL_STATUS.FAILED);
        expect(newState.toolCalls[0].error).toBe('Pod not found');
      });
    });

    describe('arguments delta events', () => {
      it('handles stream.tool.delta - appends to arguments', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          toolCalls: [
            {
              id: 'tool-1',
              type: 'tool_call',
              name: 'pods_log',
              status: TOOL_STATUS.IN_PROGRESS,
              arguments: '{"namespace":',
            },
          ],
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_DELTA,
          callId: 'tool-1',
          delta: '"default"}',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.toolCalls[0].arguments).toBe('{"namespace":"default"}');
      });
    });

    describe('content streaming events', () => {
      it('handles stream.text.delta - appends text', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'generating',
          text: 'Hello',
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TEXT_DELTA,
          delta: ' world',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.text).toBe('Hello world');
        expect(newState.phase).toBe(STREAMING_PHASES.GENERATING);
      });

      it('handles stream.text.done - sets final text', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          text: 'partial',
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TEXT_DONE,
          text: 'Complete response text',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.text).toBe('Complete response text');
      });
    });

    describe('RAG events', () => {
      it('handles stream.rag.results - populates RAG sources', () => {
        const state = createInitialStreamingState();
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_RAG_RESULTS,
          sources: [
            {
              filename: 'doc1.md',
              fileId: 'file-123',
              text: 'Some relevant text',
              score: 0.95,
              title: 'Document 1',
              sourceUrl: 'https://example.com/doc1',
            },
          ],
          filesSearched: ['doc1.md'],
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.SEARCHING);
        expect(newState.ragSources).toHaveLength(1);
        expect(newState.ragSources![0].filename).toBe('Document 1');
        expect(newState.ragSources![0].score).toBe(0.95);
        expect(newState.filesSearched).toContain('Document 1');
      });

      it('deduplicates RAG sources by sourceUrl', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          ragSources: [
            { filename: 'doc1.md', sourceUrl: 'https://example.com/doc1' },
          ],
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_RAG_RESULTS,
          sources: [
            {
              filename: 'doc1.md',
              sourceUrl: 'https://example.com/doc1',
              text: 'chunk 2',
            },
            {
              filename: 'doc2.md',
              sourceUrl: 'https://example.com/doc2',
              text: 'new doc',
            },
          ],
        };

        const newState = updateStreamingState(state, event);

        expect(newState.ragSources).toHaveLength(2);
      });
    });

    describe('tool approval events', () => {
      it('handles stream.tool.approval - sets pending approval', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          responseId: 'resp-123',
          toolCalls: [
            {
              id: 'tool-1',
              type: 'tool_call',
              name: 'delete_pod',
              status: TOOL_STATUS.IN_PROGRESS,
            },
          ],
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_APPROVAL,
          callId: 'tool-1',
          name: 'delete_pod',
          serverLabel: 'openshift-server',
          arguments: '{"name": "pod-1"}',
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
        expect(newState.pendingApproval).toBeDefined();
        expect(newState.pendingApproval!.toolCallId).toBe('tool-1');
        expect(newState.pendingApproval!.toolName).toBe('delete_pod');
        expect(newState.toolCalls[0].status).toBe(TOOL_STATUS.PENDING_APPROVAL);
        expect(newState.toolCalls[0].requiresApproval).toBe(true);
      });
    });

    describe('backend tool executing events', () => {
      it('handles stream.backend_tool.executing - sets executing phase only', () => {
        const state = createInitialStreamingState();
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_BACKEND_TOOL_EXECUTING,
          toolCount: 2,
          tools: ['ocp-mcp__list_pods', 'sn__find_tickets'],
        };

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.EXECUTING_BACKEND_TOOLS);
        expect(newState.toolCalls).toHaveLength(0);
      });

      it('handles stream.backend_tool.executing without tools array', () => {
        const state = createInitialStreamingState();
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_BACKEND_TOOL_EXECUTING,
          toolCount: 1,
        } as unknown as StreamingEvent;

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.EXECUTING_BACKEND_TOOLS);
        expect(newState.toolCalls).toHaveLength(0);
      });

      it('is blocked during pending_approval phase', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: STREAMING_PHASES.PENDING_APPROVAL,
        };
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_BACKEND_TOOL_EXECUTING,
          toolCount: 1,
          tools: ['ocp-mcp__list_pods'],
        } as unknown as StreamingEvent;

        const newState = updateStreamingState(state, event);

        expect(newState.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
      });

      it('stream.tool.started creates entries and stream.tool.completed updates them', () => {
        let state = createInitialStreamingState();

        state = updateStreamingState(state, {
          type: EVENT_TYPES.STREAM_BACKEND_TOOL_EXECUTING,
          toolCount: 1,
          tools: ['my_tool'],
        } as unknown as StreamingEvent);

        expect(state.toolCalls).toHaveLength(0);

        state = updateStreamingState(state, {
          type: EVENT_TYPES.STREAM_TOOL_STARTED,
          callId: 'call-1',
          name: 'my_tool',
          serverLabel: 'server-a',
          arguments: '{"ns":"default"}',
        } as unknown as StreamingEvent);

        expect(state.toolCalls).toHaveLength(1);
        const startedTool = state.toolCalls.find(tc => tc.id === 'call-1');
        expect(startedTool).toBeDefined();
        expect(startedTool!.status).toBe(TOOL_STATUS.IN_PROGRESS);
        expect(startedTool!.arguments).toBe('{"ns":"default"}');

        state = updateStreamingState(state, {
          type: EVENT_TYPES.STREAM_TOOL_COMPLETED,
          callId: 'call-1',
          name: 'my_tool',
          serverLabel: 'server-a',
          arguments: '{"ns":"default"}',
          output: '{"result": "ok"}',
        } as unknown as StreamingEvent);

        const completedTool = state.toolCalls.find(tc => tc.id === 'call-1');
        expect(completedTool).toBeDefined();
        expect(completedTool!.status).toBe(TOOL_STATUS.COMPLETED);
        expect(completedTool!.output).toBe('{"result": "ok"}');
        expect(completedTool!.arguments).toBe('{"ns":"default"}');
      });
    });

    describe('HITL pending_approval phase guard', () => {
      const pendingApprovalState: StreamingState = {
        ...createInitialStreamingState(),
        phase: STREAMING_PHASES.PENDING_APPROVAL,
        text: 'Pre-approval text',
        responseId: 'resp-123',
        pendingApproval: {
          toolCallId: 'tool-1',
          toolName: 'projects_list',
          serverLabel: 'aap-mcp',
          arguments: '{}',
          responseId: 'resp-123',
          requestedAt: new Date().toISOString(),
        },
        toolCalls: [
          {
            id: 'tool-1',
            type: 'tool_call',
            name: 'projects_list',
            status: TOOL_STATUS.PENDING_APPROVAL,
            requiresApproval: true,
          },
        ],
      };

      it('blocks text.delta from overriding pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TEXT_DELTA,
          delta: 'This is hallucinated text',
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
        expect(newState.text).toBe('Pre-approval text');
        expect(newState).toBe(pendingApprovalState);
      });

      it('blocks text.done from overriding pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TEXT_DONE,
          text: 'Full hallucinated text',
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState).toBe(pendingApprovalState);
      });

      it('blocks reasoning.delta from overriding pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_REASONING_DELTA,
          delta: 'Thinking...',
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState).toBe(pendingApprovalState);
      });

      it('blocks tool.discovery from overriding pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_DISCOVERY,
          status: 'in_progress',
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState).toBe(pendingApprovalState);
      });

      it('blocks rag.results from overriding pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_RAG_RESULTS,
          sources: [{ filename: 'doc.md', text: 'content' }],
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState).toBe(pendingApprovalState);
      });

      it('blocks tool.started from overriding pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_STARTED,
          callId: 'tool-2',
          name: 'other_tool',
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState).toBe(pendingApprovalState);
      });

      it('allows stream.completed during pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_COMPLETED,
          usage: { input_tokens: 100, output_tokens: 10, total_tokens: 110 },
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
        expect(newState.completed).toBe(true);
        expect(newState.usage).toBeDefined();
      });

      it('allows stream.error during pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_ERROR,
          error: 'Connection lost',
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState.phase).toBe(STREAMING_PHASES.COMPLETED);
        expect(newState.completed).toBe(true);
      });

      it('allows stream.started during pending_approval (new stream)', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_STARTED,
          responseId: 'resp-new',
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState.phase).toBe(STREAMING_PHASES.THINKING);
        expect(newState.responseId).toBe('resp-new');
      });

      it('allows tool.completed during pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_COMPLETED,
          callId: 'tool-1',
          name: 'projects_list',
          output: '{"count": 2}',
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
        expect(newState.toolCalls[0].status).toBe(TOOL_STATUS.COMPLETED);
        expect(newState.toolCalls[0].output).toBe('{"count": 2}');
      });

      it('allows tool.failed during pending_approval', () => {
        const event: StreamingEvent = {
          type: EVENT_TYPES.STREAM_TOOL_FAILED,
          callId: 'tool-1',
          name: 'test-tool',
          error: 'Connection refused',
        };

        const newState = updateStreamingState(pendingApprovalState, event);

        expect(newState.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
        expect(newState.toolCalls[0].status).toBe(TOOL_STATUS.FAILED);
      });
    });

    describe('agent handoff events', () => {
      it('handles stream.agent.handoff - sets currentAgent and appends to handoffs', () => {
        const state = createInitialStreamingState();
        const event = {
          type: EVENT_TYPES.STREAM_AGENT_HANDOFF,
          fromAgent: 'Triage Agent',
          toAgent: 'Billing Agent',
        } as unknown as StreamingEvent;

        const newState = updateStreamingState(state, event);

        expect(newState.currentAgent).toBe('Billing Agent');
        expect(newState.handoffs).toHaveLength(1);
        expect(newState.handoffs[0]).toEqual({
          from: 'Triage Agent',
          to: 'Billing Agent',
        });
      });

      it('accumulates multiple handoffs', () => {
        let state = createInitialStreamingState();
        state = updateStreamingState(state, {
          type: EVENT_TYPES.STREAM_AGENT_HANDOFF,
          fromAgent: 'Triage',
          toAgent: 'Sales',
        } as unknown as StreamingEvent);
        state = updateStreamingState(state, {
          type: EVENT_TYPES.STREAM_AGENT_HANDOFF,
          fromAgent: 'Sales',
          toAgent: 'Support',
        } as unknown as StreamingEvent);

        expect(state.currentAgent).toBe('Support');
        expect(state.handoffs).toHaveLength(2);
        expect(state.handoffs[0]).toEqual({ from: 'Triage', to: 'Sales' });
        expect(state.handoffs[1]).toEqual({ from: 'Sales', to: 'Support' });
      });

      it('ignores handoff with missing toAgent', () => {
        const state = createInitialStreamingState();
        const event = {
          type: EVENT_TYPES.STREAM_AGENT_HANDOFF,
          fromAgent: 'Triage',
        } as unknown as StreamingEvent;

        const newState = updateStreamingState(state, event);

        expect(newState).toBe(state);
      });

      it('initial state has empty handoffs array', () => {
        const state = createInitialStreamingState();
        expect(state.handoffs).toEqual([]);
        expect(state.currentAgent).toBeUndefined();
      });

      it('resets reasoning state on handoff for clean slate', () => {
        const stateWithReasoning: StreamingState = {
          ...createInitialStreamingState(),
          phase: STREAMING_PHASES.REASONING,
          reasoning: 'Agent A was thinking...',
          reasoningDuration: 5,
          reasoningStartTime: Date.now() - 5000,
        };

        const newState = updateStreamingState(stateWithReasoning, {
          type: EVENT_TYPES.STREAM_AGENT_HANDOFF,
          fromAgent: 'Agent A',
          toAgent: 'Agent B',
        } as unknown as StreamingEvent);

        expect(newState.currentAgent).toBe('Agent B');
        expect(newState.reasoning).toBeUndefined();
        expect(newState.reasoningDuration).toBeUndefined();
        expect(newState.reasoningStartTime).toBeUndefined();
      });
    });

    describe('stream.completed with agentName', () => {
      it('sets currentAgent from agentName when not already set', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'generating',
          text: 'Hello',
        };
        const event = {
          type: EVENT_TYPES.STREAM_COMPLETED,
          agentName: 'Default Agent',
        } as unknown as StreamingEvent;

        const newState = updateStreamingState(state, event);

        expect(newState.currentAgent).toBe('Default Agent');
        expect(newState.completed).toBe(true);
      });

      it('does not override currentAgent if already set by handoff', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'generating',
          text: 'Hello',
          currentAgent: 'Billing Agent',
          handoffs: [{ from: 'Triage', to: 'Billing Agent' }],
        };
        const event = {
          type: EVENT_TYPES.STREAM_COMPLETED,
          agentName: 'Some Other Agent',
        } as unknown as StreamingEvent;

        const newState = updateStreamingState(state, event);

        expect(newState.currentAgent).toBe('Billing Agent');
      });

      it('sets currentAgent during pending_approval when not already set', () => {
        const state: StreamingState = {
          ...createInitialStreamingState(),
          phase: 'pending_approval',
        };
        const event = {
          type: EVENT_TYPES.STREAM_COMPLETED,
          agentName: 'Tool Agent',
        } as unknown as StreamingEvent;

        const newState = updateStreamingState(state, event);

        expect(newState.currentAgent).toBe('Tool Agent');
        expect(newState.phase).toBe(STREAMING_PHASES.PENDING_APPROVAL);
      });
    });

    describe('edge cases', () => {
      it('returns same state for null event', () => {
        const state = createInitialStreamingState();
        const newState = updateStreamingState(
          state,
          null as unknown as StreamingEvent,
        );

        expect(newState).toBe(state);
      });

      it('returns same state for event without type', () => {
        const state = createInitialStreamingState();
        const newState = updateStreamingState(state, {} as StreamingEvent);

        expect(newState).toBe(state);
      });

      it('returns same state for unknown event type', () => {
        const state = createInitialStreamingState();
        const event = {
          type: 'unknown.event.type',
        } as unknown as StreamingEvent;

        const newState = updateStreamingState(state, event);

        expect(newState).toBe(state);
      });
    });
  });
});
