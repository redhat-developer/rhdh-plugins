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

import type { ConversationApiDeps } from './conversationEndpoints';
import { createConversation } from './conversationEndpoints';

describe('conversationEndpoints', () => {
  const baseUrl = 'http://localhost:7007/api/augment';

  function createDeps(
    overrides: Partial<ConversationApiDeps> = {},
  ): ConversationApiDeps {
    return {
      fetchJson: jest.fn(),
      fetchJsonSafe: jest.fn(),
      discoveryApi: {
        getBaseUrl: jest.fn().mockResolvedValue(baseUrl),
      } as unknown as ConversationApiDeps['discoveryApi'],
      fetchApi: {
        fetch: jest.fn(),
      } as unknown as ConversationApiDeps['fetchApi'],
      ...overrides,
    };
  }

  describe('createConversation', () => {
    it('should create and return conversationId', async () => {
      const deps = createDeps();
      (deps.fetchJson as jest.Mock).mockResolvedValue({
        conversationId: 'conv-new-123',
      });

      const result = await createConversation(deps);

      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/conversations/create',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        }),
      );
      expect(result).toEqual({ conversationId: 'conv-new-123' });
    });

    it('should propagate fetch errors', async () => {
      const deps = createDeps();
      (deps.fetchJson as jest.Mock).mockRejectedValue(
        new Error('Create failed'),
      );

      await expect(createConversation(deps)).rejects.toThrow('Create failed');
    });
  });
});
