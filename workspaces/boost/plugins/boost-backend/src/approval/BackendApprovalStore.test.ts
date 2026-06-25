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

import type {
  CacheService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { ApprovalRequest } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { BackendApprovalStore } from './BackendApprovalStore';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function createMockCache(): CacheService {
  const store = new Map<string, unknown>();
  const cache: CacheService = {
    get: jest.fn(async (key: string) => store.get(key)) as CacheService['get'],
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    withOptions: jest.fn().mockReturnThis(),
  };
  return cache;
}

function createPendingRequest(
  overrides?: Partial<ApprovalRequest>,
): ApprovalRequest {
  return {
    requestId: 'req-1',
    conversationId: 'conv-1',
    toolCallId: 'tc-1',
    toolName: 'deploy-service',
    args: '{"service":"my-app","env":"production"}',
    status: 'pending',
    userRef: 'user:default/developer',
    createdAt: '2026-01-01T00:00:00.000Z',
    message: 'Deploy my-app to production?',
    ...overrides,
  };
}

describe('BackendApprovalStore', () => {
  let cache: CacheService;
  let store: BackendApprovalStore;

  beforeEach(() => {
    cache = createMockCache();
    store = new BackendApprovalStore({
      cache,
      logger: createMockLogger(),
    });
  });

  it('uses cacheService withOptions for namespace isolation', () => {
    expect(cache.withOptions).toHaveBeenCalledWith({
      defaultTtl: BackendApprovalStore.TTL_MS,
    });
  });

  it('has a 10-minute TTL', () => {
    expect(BackendApprovalStore.TTL_MS).toBe(10 * 60 * 1000);
  });

  describe('create and get', () => {
    it('stores and retrieves an approval request', async () => {
      const request = createPendingRequest();
      await store.create(request);
      const result = await store.get('req-1');
      expect(result).toEqual(request);
    });

    it('returns undefined for unknown request', async () => {
      const result = await store.get('unknown');
      expect(result).toBeUndefined();
    });

    it('handles auto-deserialized object from cache backend', async () => {
      const request = createPendingRequest();
      // Simulate a cache backend that auto-deserializes JSON
      (cache.get as jest.Mock).mockResolvedValueOnce(request);
      const result = await store.get('req-1');
      expect(result).toEqual(request);
    });

    it('returns undefined for corrupt cache entry', async () => {
      (cache.get as jest.Mock).mockResolvedValueOnce('not-valid-json{');
      const result = await store.get('req-1');
      expect(result).toBeUndefined();
    });

    it('returns undefined for non-approval object in cache', async () => {
      (cache.get as jest.Mock).mockResolvedValueOnce({ unrelated: true });
      const result = await store.get('req-1');
      expect(result).toBeUndefined();
    });
  });

  describe('approve', () => {
    it('approves a pending request with original args', async () => {
      await store.create(createPendingRequest());
      const result = await store.approve('req-1');

      expect(result).toBeDefined();
      expect(result!.status).toBe('approved');
      expect(result!.resolvedAt).toBeDefined();
      expect(result!.resolvedArgs).toBe(
        '{"service":"my-app","env":"production"}',
      );
    });

    it('approves with edited arguments', async () => {
      await store.create(createPendingRequest());
      const editedArgs = '{"service":"my-app","env":"staging"}';
      const result = await store.approve('req-1', editedArgs);

      expect(result).toBeDefined();
      expect(result!.status).toBe('approved');
      expect(result!.resolvedArgs).toBe(editedArgs);
    });

    it('returns undefined for unknown request', async () => {
      const result = await store.approve('unknown');
      expect(result).toBeUndefined();
    });

    it('returns undefined for already-approved request', async () => {
      await store.create(createPendingRequest());
      await store.approve('req-1');
      const result = await store.approve('req-1');
      expect(result).toBeUndefined();
    });

    it('returns undefined for already-rejected request', async () => {
      await store.create(createPendingRequest());
      await store.reject('req-1');
      const result = await store.approve('req-1');
      expect(result).toBeUndefined();
    });
  });

  describe('reject', () => {
    it('rejects a pending request', async () => {
      await store.create(createPendingRequest());
      const result = await store.reject('req-1');

      expect(result).toBeDefined();
      expect(result!.status).toBe('rejected');
      expect(result!.resolvedAt).toBeDefined();
      expect(result!.resolvedArgs).toBeUndefined();
    });

    it('returns undefined for unknown request', async () => {
      const result = await store.reject('unknown');
      expect(result).toBeUndefined();
    });

    it('returns undefined for already-resolved request', async () => {
      await store.create(createPendingRequest());
      await store.approve('req-1');
      const result = await store.reject('req-1');
      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('removes an approval request', async () => {
      await store.create(createPendingRequest());
      await store.delete('req-1');
      const result = await store.get('req-1');
      expect(result).toBeUndefined();
    });
  });
});
