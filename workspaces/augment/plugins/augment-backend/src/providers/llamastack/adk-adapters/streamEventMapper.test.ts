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
import { mapAdkEventToFrontend } from './streamEventMapper';

jest.mock('@augment-adk/augment-adk', () => ({
  normalizeLlamaStackEvent: (data: string) => {
    try {
      const parsed = JSON.parse(data);
      return [{ type: `stream.${parsed.type || 'unknown'}`, ...parsed }];
    } catch {
      return [];
    }
  },
}));

describe('mapAdkEventToFrontend', () => {
  describe('raw_model_event', () => {
    it('delegates to normalizeLlamaStackEvent', () => {
      const result = mapAdkEventToFrontend({
        type: 'raw_model_event',
        data: JSON.stringify({ type: 'text.delta', delta: 'hello' }),
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed.delta).toBe('hello');
    });
  });

  describe('agent_start', () => {
    it('emits stream.agent.start', () => {
      const result = mapAdkEventToFrontend({
        type: 'agent_start',
        agentKey: 'router',
        agentName: 'Router Agent',
        turn: 1,
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed).toEqual({
        type: 'stream.agent.start',
        agentKey: 'router',
        agentName: 'Router Agent',
        turn: 1,
      });
    });
  });

  describe('agent_end', () => {
    it('emits stream.agent.end', () => {
      const result = mapAdkEventToFrontend({
        type: 'agent_end',
        agentKey: 'router',
        agentName: 'Router Agent',
        turn: 2,
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed).toEqual({
        type: 'stream.agent.end',
        agentKey: 'router',
        agentName: 'Router Agent',
        turn: 2,
      });
    });
  });

  describe('handoff_occurred', () => {
    it('emits stream.agent.handoff', () => {
      const result = mapAdkEventToFrontend({
        type: 'handoff_occurred',
        fromAgent: 'router',
        toAgent: 'analyst',
        reason: 'User needs data analysis',
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed).toEqual({
        type: 'stream.agent.handoff',
        fromAgent: 'router',
        toAgent: 'analyst',
        reason: 'User needs data analysis',
      });
    });
  });

  describe('tool_called', () => {
    it('emits stream.tool.started', () => {
      const result = mapAdkEventToFrontend({
        type: 'tool_called',
        callId: 'c1',
        toolName: 'list_namespaces',
        arguments: '{}',
        agentKey: 'k8s',
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed).toEqual({
        type: 'stream.tool.started',
        callId: 'c1',
        name: 'list_namespaces',
        serverLabel: 'function',
        arguments: '{}',
      });
    });
  });

  describe('tool_output', () => {
    it('emits stream.tool.completed for successful output', () => {
      const result = mapAdkEventToFrontend({
        type: 'tool_output',
        callId: 'c1',
        toolName: 'list_namespaces',
        output: '["default","kube-system"]',
        agentKey: 'k8s',
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed.type).toBe('stream.tool.completed');
      expect(parsed.callId).toBe('c1');
    });

    it('emits stream.tool.failed when output contains an error object', () => {
      const result = mapAdkEventToFrontend({
        type: 'tool_output',
        callId: 'c2',
        toolName: 'delete_pod',
        output: JSON.stringify({ error: 'Permission denied' }),
        agentKey: 'k8s',
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed.type).toBe('stream.tool.failed');
      expect(parsed.error).toBe(JSON.stringify({ error: 'Permission denied' }));
      expect(parsed.callId).toBe('c2');
    });

    it('treats non-JSON output as success', () => {
      const result = mapAdkEventToFrontend({
        type: 'tool_output',
        callId: 'c3',
        toolName: 'echo',
        output: 'plain text result',
        agentKey: 'misc',
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed.type).toBe('stream.tool.completed');
    });
  });

  describe('approval_requested', () => {
    it('emits stream.tool.approval', () => {
      const result = mapAdkEventToFrontend({
        type: 'approval_requested',
        toolName: 'delete_pod',
        arguments: '{"name":"foo"}',
        serverLabel: 'k8s-server',
        approvalRequestId: 'req-1',
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed).toEqual({
        type: 'stream.tool.approval',
        callId: 'req-1',
        name: 'delete_pod',
        serverLabel: 'k8s-server',
        arguments: '{"name":"foo"}',
      });
    });
  });

  describe('error', () => {
    it('emits stream.error', () => {
      const result = mapAdkEventToFrontend({
        type: 'error',
        message: 'Model timeout',
        code: 'timeout',
      });
      expect(result).toHaveLength(1);
      const parsed = JSON.parse(result[0]);
      expect(parsed).toEqual({
        type: 'stream.error',
        error: 'Model timeout',
        code: 'timeout',
      });
    });
  });

  describe('suppressed events', () => {
    it('suppresses text_delta (covered by raw normalization)', () => {
      expect(
        mapAdkEventToFrontend({
          type: 'text_delta',
          delta: 'hi',
          agentKey: 'a',
        }),
      ).toEqual([]);
    });

    it('suppresses reasoning_delta (covered by raw normalization)', () => {
      expect(
        mapAdkEventToFrontend({
          type: 'reasoning_delta',
          delta: 'thinking...',
          agentKey: 'a',
        }),
      ).toEqual([]);
    });

    it('suppresses text_done (covered by raw normalization)', () => {
      expect(
        mapAdkEventToFrontend({
          type: 'text_done',
          text: 'final text',
          agentKey: 'a',
        }),
      ).toEqual([]);
    });
  });
});
