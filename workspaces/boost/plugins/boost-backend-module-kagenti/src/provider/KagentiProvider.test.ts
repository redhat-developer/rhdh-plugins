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

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
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
  });
});
