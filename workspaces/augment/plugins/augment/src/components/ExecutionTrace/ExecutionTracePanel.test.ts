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

import type { StreamingState } from '../StreamingMessage/StreamingMessage.types';
import { buildTraceSpans, type TraceSpan } from './ExecutionTracePanel';

function createBaseState(
  overrides: Partial<StreamingState> = {},
): StreamingState {
  return {
    phase: 'completed',
    text: '',
    completed: false,
    toolCalls: [],
    filesSearched: [],
    handoffs: [],
    reasoningSpans: [],
    ...overrides,
  };
}

describe('buildTraceSpans', () => {
  it('returns empty array for empty state', () => {
    const spans = buildTraceSpans(createBaseState());
    expect(spans).toEqual([]);
  });

  it('produces a reasoning span from reasoningSpans array', () => {
    const state = createBaseState({
      reasoningSpans: [
        {
          agentName: 'Planner',
          text: 'Thinking about the task',
          startedAt: 1000,
          endedAt: 3000,
          durationMs: 2000,
        },
      ],
    });
    const spans = buildTraceSpans(state);

    expect(spans).toHaveLength(1);
    expect(spans[0]).toMatchObject({
      id: 'reasoning-0',
      type: 'reasoning',
      status: 'completed',
      agentName: 'Planner',
      startedAt: 1000,
      durationMs: 2000,
    });
  });

  it('produces current in-progress reasoning span', () => {
    const now = Date.now();
    const state = createBaseState({
      reasoning: 'Working on it...',
      reasoningStartTime: now - 500,
    });
    const spans = buildTraceSpans(state);

    expect(spans).toHaveLength(1);
    expect(spans[0]).toMatchObject({
      id: 'reasoning-0',
      type: 'reasoning',
      status: 'running',
      startedAt: now - 500,
    });
    expect(spans[0].durationMs).toBeGreaterThanOrEqual(400);
  });

  it('marks reasoning completed when reasoningDuration is set', () => {
    const state = createBaseState({
      reasoning: 'Done thinking',
      reasoningStartTime: 1000,
      reasoningDuration: 2,
    });
    const spans = buildTraceSpans(state);

    expect(spans).toHaveLength(1);
    expect(spans[0].status).toBe('completed');
    expect(spans[0].durationMs).toBe(2000);
  });

  it('preserves multiple reasoning spans across handoffs', () => {
    const state = createBaseState({
      reasoningSpans: [
        {
          agentName: 'Agent-A',
          text: 'First thought',
          startedAt: 1000,
          endedAt: 2000,
          durationMs: 1000,
        },
        {
          agentName: 'Agent-B',
          text: 'Second thought',
          startedAt: 3000,
          endedAt: 4000,
          durationMs: 1000,
        },
      ],
      handoffs: [{ from: 'Agent-A', to: 'Agent-B', timestamp: 2500 }],
    });
    const spans = buildTraceSpans(state);

    const reasoningSpans = spans.filter(s => s.type === 'reasoning');
    expect(reasoningSpans).toHaveLength(2);
    expect(reasoningSpans[0].agentName).toBe('Agent-A');
    expect(reasoningSpans[1].agentName).toBe('Agent-B');
  });

  it('builds tool call spans with correct status', () => {
    const state = createBaseState({
      toolCalls: [
        {
          id: 'tc-1',
          type: 'function_call',
          name: 'get_weather',
          status: 'completed',
          output: '{"temp": 72}',
          startedAt: 1000,
          endedAt: 2500,
        },
        {
          id: 'tc-2',
          type: 'function_call',
          name: 'send_email',
          status: 'failed',
          error: 'Permission denied',
          startedAt: 3000,
          endedAt: 3500,
        },
        {
          id: 'tc-3',
          type: 'function_call',
          name: 'search_docs',
          status: 'in_progress',
          startedAt: 4000,
        },
      ],
    });
    const spans = buildTraceSpans(state);

    expect(spans).toHaveLength(3);
    expect(spans[0]).toMatchObject({
      id: 'tool-tc-1',
      label: 'get_weather',
      status: 'completed',
      durationMs: 1500,
    });
    expect(spans[1]).toMatchObject({
      id: 'tool-tc-2',
      label: 'send_email',
      status: 'failed',
      durationMs: 500,
    });
    expect(spans[2]).toMatchObject({
      id: 'tool-tc-3',
      label: 'search_docs',
      status: 'running',
    });
  });

  it('builds handoff spans', () => {
    const state = createBaseState({
      handoffs: [
        {
          from: 'Coordinator',
          to: 'Weather',
          reason: 'Need weather data',
          timestamp: 2000,
        },
      ],
    });
    const spans = buildTraceSpans(state);

    expect(spans).toHaveLength(1);
    expect(spans[0]).toMatchObject({
      type: 'handoff',
      label: 'Coordinator → Weather',
      status: 'completed',
      detail: 'Need weather data',
      startedAt: 2000,
    });
  });

  it('builds generation span for in-progress text', () => {
    const now = Date.now();
    const state = createBaseState({
      text: 'Hello, here is the weather...',
      completed: false,
      textStartedAt: now - 1000,
    });
    const spans = buildTraceSpans(state);

    const gen = spans.find(s => s.type === 'generation');
    expect(gen).toBeDefined();
    expect(gen!.status).toBe('running');
    expect(gen!.label).toBe('Generating response');
    expect(gen!.durationMs).toBeGreaterThanOrEqual(900);
  });

  it('builds generation span for completed text', () => {
    const state = createBaseState({
      text: 'The weather is sunny.',
      completed: true,
      textStartedAt: 5000,
    });
    const spans = buildTraceSpans(state);

    const gen = spans.find(s => s.type === 'generation');
    expect(gen).toBeDefined();
    expect(gen!.status).toBe('completed');
    expect(gen!.label).toBe('Response generated');
  });

  it('sorts all spans chronologically by startedAt', () => {
    const state = createBaseState({
      reasoningSpans: [
        {
          agentName: 'Planner',
          text: 'Thinking',
          startedAt: 1000,
          endedAt: 2000,
          durationMs: 1000,
        },
      ],
      toolCalls: [
        {
          id: 'tc-1',
          type: 'function_call',
          name: 'search',
          status: 'completed',
          startedAt: 3000,
          endedAt: 4000,
        },
      ],
      handoffs: [{ from: 'Planner', to: 'Executor', timestamp: 2500 }],
      text: 'Done',
      completed: true,
      textStartedAt: 5000,
    });

    const spans = buildTraceSpans(state);

    expect(spans.length).toBe(4);
    expect(spans[0].type).toBe('reasoning');
    expect(spans[0].startedAt).toBe(1000);
    expect(spans[1].type).toBe('handoff');
    expect(spans[1].startedAt).toBe(2500);
    expect(spans[2].type).toBe('tool');
    expect(spans[2].startedAt).toBe(3000);
    expect(spans[3].type).toBe('generation');
    expect(spans[3].startedAt).toBe(5000);
  });

  it('pushes spans without startedAt to the end', () => {
    const state = createBaseState({
      toolCalls: [
        {
          id: 'tc-no-time',
          type: 'function_call',
          name: 'mystery_tool',
          status: 'completed',
        },
      ],
      reasoningSpans: [
        {
          agentName: 'Agent',
          text: 'Thinking',
          startedAt: 1000,
          endedAt: 2000,
          durationMs: 1000,
        },
      ],
    });
    const spans = buildTraceSpans(state);

    expect(spans).toHaveLength(2);
    expect(spans[0].type).toBe('reasoning');
    expect(spans[1].type).toBe('tool');
    expect(spans[1].startedAt).toBeUndefined();
  });

  it('handles a full multi-agent scenario end-to-end', () => {
    const state = createBaseState({
      reasoningSpans: [
        {
          agentName: 'Coordinator',
          text: 'Planning',
          startedAt: 100,
          endedAt: 500,
          durationMs: 400,
        },
        {
          agentName: 'Weather',
          text: 'Looking up weather',
          startedAt: 600,
          endedAt: 800,
          durationMs: 200,
        },
      ],
      handoffs: [
        { from: 'Coordinator', to: 'Weather', timestamp: 550 },
        { from: 'Weather', to: 'Coordinator', timestamp: 1200 },
      ],
      toolCalls: [
        {
          id: 'tc-wx',
          type: 'function_call',
          name: 'get_weather',
          status: 'completed',
          output: '72F',
          startedAt: 900,
          endedAt: 1100,
        },
      ],
      text: 'The weather is 72F and sunny.',
      completed: true,
      textStartedAt: 1300,
    });

    const spans = buildTraceSpans(state);
    const types = spans.map(s => s.type);

    expect(types).toEqual([
      'reasoning',
      'handoff',
      'reasoning',
      'tool',
      'handoff',
      'generation',
    ]);

    const withTimestamps = spans.filter(s => s.startedAt !== undefined);
    for (let i = 1; i < withTimestamps.length; i++) {
      expect(withTimestamps[i].startedAt!).toBeGreaterThanOrEqual(
        withTimestamps[i - 1].startedAt!,
      );
    }
  });
});
