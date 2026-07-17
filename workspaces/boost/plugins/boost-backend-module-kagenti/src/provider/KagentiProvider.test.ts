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
import type { InputItem } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { KagentiProvider } from './KagentiProvider';
import type { KagentiApiClient } from './KagentiApiClient';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function createSSEStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const data = events.map(e => `data: ${e}\n\n`).join('');
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(data));
      controller.close();
    },
  });
}

describe('KagentiProvider', () => {
  let provider: KagentiProvider;

  beforeEach(() => {
    provider = new KagentiProvider({
      connection: {
        baseUrl: 'http://kagenti:8080',
        defaultAgent: 'test-agent',
      },
      logger: createMockLogger(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('descriptor', () => {
    it('has correct provider identity', () => {
      expect(provider.descriptor.id).toBe('kagenti');
      expect(provider.descriptor.name).toBe('Kagenti');
    });

    it('declares expected capabilities', () => {
      expect(provider.descriptor.capabilities).toEqual({
        agentCatalog: true,
        namespaceScoping: true,
        devSpaces: false,
        buildPipelines: false,
      });
    });
  });

  describe('chat', () => {
    it('throws on empty text input', async () => {
      const messages: InputItem[] = [
        { type: 'file', url: 'http://example.com/file.txt' },
      ];
      await expect(provider.chat(messages)).rejects.toThrow(
        'No text input items provided',
      );
    });

    it('sends request to A2A tasks endpoint', async () => {
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'task-1',
          status: { state: 'completed' },
          message: {
            role: 'agent',
            parts: [{ type: 'text', text: 'Hello from Kagenti' }],
          },
        }),
      } as Response);

      const result = await provider.chat([{ type: 'text', text: 'Hello' }]);

      expect(result).toBe('Hello from Kagenti');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://kagenti:8080/a2a/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('throws on non-ok response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'server error',
      } as Response);

      await expect(
        provider.chat([{ type: 'text', text: 'Hello' }]),
      ).rejects.toThrow('Kagenti A2A API returned 500');
    });

    it('throws on fetch failure', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        provider.chat([{ type: 'text', text: 'Hello' }]),
      ).rejects.toThrow('Failed to connect to Kagenti endpoint');
    });

    it('throws on failed task status', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'task-1',
          status: { state: 'failed', message: 'Agent crashed' },
        }),
      } as Response);

      await expect(
        provider.chat([{ type: 'text', text: 'Hello' }]),
      ).rejects.toThrow('Agent crashed');
    });

    it('throws on canceled task status', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'task-1',
          status: { state: 'canceled' },
        }),
      } as Response);

      await expect(
        provider.chat([{ type: 'text', text: 'Hello' }]),
      ).rejects.toThrow('A2A task canceled');
    });

    it('returns empty string when response has no message', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'task-1',
          status: { state: 'completed' },
        }),
      } as Response);

      const result = await provider.chat([{ type: 'text', text: 'Hello' }]);
      expect(result).toBe('');
    });

    it('passes userRef to apiClient.requestCore', async () => {
      const mockRequestCore = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'task-1',
          status: { state: 'completed' },
          message: {
            role: 'agent',
            parts: [{ type: 'text', text: 'Hi Alice' }],
          },
        }),
      } as Response);

      const apiClient = {
        requestCore: mockRequestCore,
      } as unknown as KagentiApiClient;

      const authedProvider = new KagentiProvider({
        connection: {
          baseUrl: 'http://kagenti:8080',
          defaultAgent: 'test-agent',
        },
        logger: createMockLogger(),
        apiClient,
      });

      const result = await authedProvider.chat(
        [{ type: 'text', text: 'Hello' }],
        { userRef: 'user:default/alice' },
      );

      expect(result).toBe('Hi Alice');
      expect(mockRequestCore).toHaveBeenCalledWith(
        expect.objectContaining({
          userRef: 'user:default/alice',
        }),
      );
    });
  });

  describe('chatStream', () => {
    it('yields error on empty text input', async () => {
      const messages: InputItem[] = [
        { type: 'image', url: 'http://example.com/img.png' },
      ];
      const events = [];
      for await (const event of provider.chatStream(messages)) {
        events.push(event);
      }
      expect(events).toEqual([
        { type: 'error', message: 'No text input items provided' },
      ]);
    });

    it('yields error on fetch failure', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const events = [];
      for await (const event of provider.chatStream([
        { type: 'text', text: 'Hello' },
      ])) {
        events.push(event);
      }
      expect(events).toEqual([
        {
          type: 'error',
          message: 'Failed to connect to Kagenti endpoint',
        },
      ]);
    });

    it('yields error on non-ok response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => 'unavailable',
      } as Response);

      const events = [];
      for await (const event of provider.chatStream([
        { type: 'text', text: 'Hello' },
      ])) {
        events.push(event);
      }
      expect(events).toEqual([
        {
          type: 'error',
          message: 'Kagenti A2A API returned 503',
        },
      ]);
    });

    it('yields error event on canceled task status', async () => {
      const sseData = JSON.stringify({
        type: 'task.status.update',
        taskId: 'task-1',
        status: { state: 'canceled', message: 'User canceled the task' },
      });

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        body: createSSEStream([sseData]),
      } as Response);

      const events = [];
      for await (const event of provider.chatStream([
        { type: 'text', text: 'Hello' },
      ])) {
        events.push(event);
      }
      expect(events).toEqual([
        { type: 'error', message: 'User canceled the task' },
        { type: 'done' },
      ]);
    });

    it('yields default message when canceled with no status message', async () => {
      const sseData = JSON.stringify({
        type: 'task.status.update',
        taskId: 'task-1',
        status: { state: 'canceled' },
      });

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        body: createSSEStream([sseData]),
      } as Response);

      const events = [];
      for await (const event of provider.chatStream([
        { type: 'text', text: 'Hello' },
      ])) {
        events.push(event);
      }
      expect(events).toEqual([
        { type: 'error', message: 'A2A task canceled' },
        { type: 'done' },
      ]);
    });

    it('yields error and done for failed task status', async () => {
      const sseData = JSON.stringify({
        type: 'task.status.update',
        taskId: 'task-1',
        status: { state: 'failed', message: 'Agent error' },
      });

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        body: createSSEStream([sseData]),
      } as Response);

      const events = [];
      for await (const event of provider.chatStream([
        { type: 'text', text: 'Hello' },
      ])) {
        events.push(event);
      }
      expect(events).toEqual([
        { type: 'error', message: 'Agent error' },
        { type: 'done' },
      ]);
    });

    it('yields text and done for completed task', async () => {
      const sseData = JSON.stringify({
        type: 'task.status.update',
        taskId: 'task-1',
        status: { state: 'completed' },
        message: {
          role: 'agent',
          parts: [{ type: 'text', text: 'Final answer' }],
        },
      });

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        body: createSSEStream([sseData]),
      } as Response);

      const events = [];
      for await (const event of provider.chatStream([
        { type: 'text', text: 'Hello' },
      ])) {
        events.push(event);
      }
      expect(events).toEqual([
        { type: 'text', text: 'Final answer' },
        { type: 'done' },
      ]);
    });

    it('passes userRef to apiClient.requestCore in streaming', async () => {
      const sseData = JSON.stringify({
        type: 'task.status.update',
        taskId: 'task-1',
        status: { state: 'completed' },
        message: {
          role: 'agent',
          parts: [{ type: 'text', text: 'Streamed' }],
        },
      });

      const mockRequestCore = jest.fn().mockResolvedValue({
        ok: true,
        body: createSSEStream([sseData]),
      } as Response);

      const apiClient = {
        requestCore: mockRequestCore,
      } as unknown as KagentiApiClient;

      const authedProvider = new KagentiProvider({
        connection: {
          baseUrl: 'http://kagenti:8080',
          defaultAgent: 'test-agent',
        },
        logger: createMockLogger(),
        apiClient,
      });

      const events = [];
      for await (const event of authedProvider.chatStream(
        [{ type: 'text', text: 'Hello' }],
        { userRef: 'user:default/bob' },
      )) {
        events.push(event);
      }

      expect(mockRequestCore).toHaveBeenCalledWith(
        expect.objectContaining({
          userRef: 'user:default/bob',
        }),
      );
      expect(events).toContainEqual({ type: 'text', text: 'Streamed' });
    });
  });
});
