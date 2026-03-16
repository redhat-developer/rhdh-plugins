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

import { HttpEmbeddingProvider } from '../HttpEmbedder';

const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

describe('HttpEmbeddingProvider', () => {
  let provider: HttpEmbeddingProvider;

  beforeEach(() => {
    mockFetch.mockReset();
    provider = new HttpEmbeddingProvider({
      endpoint: 'https://embed.example.com/v1/embed',
      model: 'test-model',
      timeoutMs: 5000,
    });
  });

  it('embedTexts throws with async guidance', () => {
    expect(() => provider.embedTexts(['hello'])).toThrow('async-only');
  });

  describe('embedTextsAsync', () => {
    it('calls the endpoint and returns vectors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          vectors: [
            [1, 0],
            [0, 1],
          ],
        }),
      });

      const result = await provider.embedTextsAsync(['hello', 'world']);
      expect(result).toEqual([
        [1, 0],
        [0, 1],
      ]);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://embed.example.com/v1/embed',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            texts: ['hello', 'world'],
            model: 'test-model',
          }),
        }),
      );
    });

    it('throws on non-OK response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(provider.embedTextsAsync(['test'])).rejects.toThrow(
        '500 Internal Server Error',
      );
    });

    it('throws when response has no vectors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await expect(provider.embedTextsAsync(['test'])).rejects.toThrow(
        'no vectors',
      );
    });

    it('sends custom headers', async () => {
      const customProvider = new HttpEmbeddingProvider({
        endpoint: 'https://embed.example.com/v1/embed',
        headers: { Authorization: 'Bearer token123' },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ vectors: [[1]] }),
      });

      await customProvider.embedTextsAsync(['test']);

      const callHeaders = mockFetch.mock.calls[0][1]?.headers;
      expect(callHeaders?.Authorization).toBe('Bearer token123');
    });
  });
});
