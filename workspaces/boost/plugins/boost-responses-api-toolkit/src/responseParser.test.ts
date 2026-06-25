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

import type { ResponsesApiResponse, ResponsesApiStreamEvent } from './types';
import {
  extractTextFromResponse,
  normalizeStreamEvent,
} from './responseParser';

describe('extractTextFromResponse', () => {
  it('extracts text from message outputs', () => {
    const response: ResponsesApiResponse = {
      id: 'resp-1',
      model: 'test-model',
      output: [
        {
          type: 'message',
          content: [
            { type: 'output_text', text: 'Hello ' },
            { type: 'output_text', text: 'world' },
          ],
        },
      ],
    };

    expect(extractTextFromResponse(response)).toBe('Hello world');
  });

  it('ignores non-message outputs', () => {
    const response: ResponsesApiResponse = {
      id: 'resp-1',
      model: 'test-model',
      output: [
        { type: 'mcp_call', id: 'call-1', server_label: 'test' },
        {
          type: 'message',
          content: [{ type: 'output_text', text: 'result' }],
        },
      ],
    };

    expect(extractTextFromResponse(response)).toBe('result');
  });

  it('returns empty string for empty output', () => {
    const response: ResponsesApiResponse = {
      id: 'resp-1',
      model: 'test-model',
      output: [],
    };

    expect(extractTextFromResponse(response)).toBe('');
  });
});

describe('normalizeStreamEvent', () => {
  it('normalizes text delta events', () => {
    const event: ResponsesApiStreamEvent = {
      type: 'response.output_text.delta',
      delta: 'Hello',
    };

    expect(normalizeStreamEvent(event)).toEqual([
      { type: 'text', text: 'Hello' },
    ]);
  });

  it('skips text delta without delta content', () => {
    const event: ResponsesApiStreamEvent = {
      type: 'response.output_text.delta',
    };

    expect(normalizeStreamEvent(event)).toEqual([]);
  });

  it('normalizes MCP call in_progress events', () => {
    const event: ResponsesApiStreamEvent = {
      type: 'response.mcp_call.in_progress',
      item: {
        type: 'mcp_call',
        id: 'call-1',
        server_label: 'my-tool',
      },
    };

    expect(normalizeStreamEvent(event)).toEqual([
      {
        type: 'tool_call',
        toolCallId: 'call-1',
        toolName: 'my-tool',
        args: '{}',
      },
    ]);
  });

  it('skips MCP call in_progress without id or server_label', () => {
    const event: ResponsesApiStreamEvent = {
      type: 'response.mcp_call.in_progress',
      item: { type: 'mcp_call' },
    };

    expect(normalizeStreamEvent(event)).toEqual([]);
  });

  it('normalizes MCP call completed events', () => {
    const event: ResponsesApiStreamEvent = {
      type: 'response.mcp_call.completed',
      item: {
        type: 'mcp_call',
        id: 'call-1',
        content: [{ type: 'output_text', text: 'tool output' }],
      },
    };

    expect(normalizeStreamEvent(event)).toEqual([
      {
        type: 'tool_result',
        toolCallId: 'call-1',
        content: 'tool output',
      },
    ]);
  });

  it('normalizes completed events', () => {
    const event: ResponsesApiStreamEvent = {
      type: 'response.completed',
    };

    expect(normalizeStreamEvent(event)).toEqual([{ type: 'done' }]);
  });

  it('returns empty array for unknown event types', () => {
    const event: ResponsesApiStreamEvent = {
      type: 'response.unknown_event',
    };

    expect(normalizeStreamEvent(event)).toEqual([]);
  });
});
