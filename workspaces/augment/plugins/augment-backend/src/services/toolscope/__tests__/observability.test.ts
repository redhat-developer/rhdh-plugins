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

import { createTrace, Stopwatch } from '../observability';
import type { TraceSink, ToolScopeTrace } from '../observability';

describe('createTrace', () => {
  it('creates a trace with default values', () => {
    const trace = createTrace();
    expect(trace.mode).toBe('fresh');
    expect(trace.returnedTools).toBe(0);
    expect(trace.msTotal).toBe(0);
    expect(trace.candidates).toEqual([]);
  });

  it('sets sessionId and turnId', () => {
    const trace = createTrace('session-1', 'turn-2');
    expect(trace.sessionId).toBe('session-1');
    expect(trace.turnId).toBe('turn-2');
  });
});

describe('Stopwatch', () => {
  it('measures elapsed time in ms', () => {
    const sw = new Stopwatch();
    const elapsed = sw.ms();
    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(1000);
  });
});

describe('TraceSink', () => {
  it('receives emitted traces', () => {
    const traces: ToolScopeTrace[] = [];
    const sink: TraceSink = { emit: t => traces.push(t) };

    const trace = createTrace();
    trace.returnedTools = 5;
    sink.emit(trace);

    expect(traces).toHaveLength(1);
    expect(traces[0].returnedTools).toBe(5);
  });
});
