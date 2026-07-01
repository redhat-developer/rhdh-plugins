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
import type { NormalizedStreamEvent } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { ResponsesApiProvider } from './ResponsesApiProvider';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

// Helper to collect all events from an async iterable
async function collectEvents(
  iterable: AsyncIterable<NormalizedStreamEvent>,
): Promise<NormalizedStreamEvent[]> {
  const events: NormalizedStreamEvent[] = [];
  for await (const event of iterable) {
    events.push(event);
  }
  return events;
}

describe('ResponsesApiProvider', () => {
  let provider: ResponsesApiProvider;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    provider = new ResponsesApiProvider({
      connection: {
        baseUrl: 'http://localhost:8321',
        defaultModel: 'meta-llama/Llama-3.1-8B-Instruct',
        apiKey: 'test-key',
      },
      logger: createMockLogger(),
    });

    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('descriptor', () => {
    it('has correct provider identity', () => {
      expect(provider.descriptor.id).toBe('llamastack');
      expect(provider.descriptor.name).toBe('Llama Stack');
      expect(provider.descriptor.capabilities.agentCatalog).toBe(true);
      expect(provider.descriptor.capabilities.namespaceScoping).toBe(false);
    });
  });

  describe('chat', () => {
    it('sends a non-streaming request and returns text', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'resp-1',
          model: 'meta-llama/Llama-3.1-8B-Instruct',
          output: [
            {
              type: 'message',
              content: [{ type: 'output_text', text: 'Hello, world!' }],
            },
          ],
        }),
      });

      const result = await provider.chat([{ type: 'text', text: 'Say hello' }]);

      expect(result).toBe('Hello, world!');
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8321/v1/responses',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-key',
          },
        }),
      );
    });

    it('concatenates multiple output parts', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'resp-2',
          model: 'meta-llama/Llama-3.1-8B-Instruct',
          output: [
            {
              type: 'message',
              content: [
                { type: 'output_text', text: 'Part 1' },
                { type: 'output_text', text: ' Part 2' },
              ],
            },
          ],
        }),
      });

      const result = await provider.chat([{ type: 'text', text: 'Test' }]);
      expect(result).toBe('Part 1 Part 2');
    });

    it('throws on API error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error detail',
      });

      await expect(
        provider.chat([{ type: 'text', text: 'Test' }]),
      ).rejects.toThrow('Llama Stack Responses API returned 500');
    });
  });

  describe('chatStream', () => {
    it('yields text events from SSE stream', async () => {
      const sseData = [
        'data: {"type":"response.output_text.delta","delta":"Hello"}',
        '',
        'data: {"type":"response.output_text.delta","delta":" world"}',
        '',
        'data: {"type":"response.completed"}',
        '',
      ].join('\n');

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseData));
          controller.close();
        },
      });

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const events = await collectEvents(
        provider.chatStream([{ type: 'text', text: 'Test' }]),
      );

      expect(events).toEqual([
        { type: 'text', text: 'Hello' },
        { type: 'text', text: ' world' },
        { type: 'done' },
      ]);
    });

    it('yields error event on API failure', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => 'Overloaded',
      });

      const events = await collectEvents(
        provider.chatStream([{ type: 'text', text: 'Test' }]),
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('error');
    });

    it('yields error when response body is empty', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const events = await collectEvents(
        provider.chatStream([{ type: 'text', text: 'Test' }]),
      );

      expect(events).toEqual([
        { type: 'error', message: 'Response body is empty' },
      ]);
    });

    it('handles [DONE] sentinel', async () => {
      const sseData = [
        'data: {"type":"response.output_text.delta","delta":"Hi"}',
        '',
        'data: [DONE]',
        '',
      ].join('\n');

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseData));
          controller.close();
        },
      });

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const events = await collectEvents(
        provider.chatStream([{ type: 'text', text: 'Test' }]),
      );

      expect(events).toEqual([{ type: 'text', text: 'Hi' }, { type: 'done' }]);
    });

    it('filters non-text input items', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'resp-1',
          model: 'meta-llama/Llama-3.1-8B-Instruct',
          output: [
            {
              type: 'message',
              content: [{ type: 'output_text', text: 'response' }],
            },
          ],
        }),
      });

      await provider.chat([
        { type: 'text', text: 'hello' },
        { type: 'image', url: 'http://example.com/img.png' },
        { type: 'file', url: 'http://example.com/doc.pdf' },
      ]);

      const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(callBody.input).toEqual([{ role: 'user', content: 'hello' }]);
    });
  });
});
