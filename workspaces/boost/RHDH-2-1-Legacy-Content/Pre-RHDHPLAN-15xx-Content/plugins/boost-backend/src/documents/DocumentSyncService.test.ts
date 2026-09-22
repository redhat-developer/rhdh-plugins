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
import { DocumentSyncService } from './DocumentSyncService';

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
  return {
    get: jest.fn(async (key: string) => store.get(key)) as CacheService['get'],
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    withOptions: jest.fn().mockReturnThis(),
  };
}

describe('DocumentSyncService', () => {
  let service: DocumentSyncService;
  let mockCache: CacheService;
  let mockLogger: LoggerService;

  beforeEach(() => {
    mockCache = createMockCache();
    mockLogger = createMockLogger();
    service = new DocumentSyncService({
      cache: mockCache,
      logger: mockLogger,
    });
  });

  it('uses cacheService with 365-day TTL', () => {
    expect(mockCache.withOptions).toHaveBeenCalledWith({
      defaultTtl: 365 * 24 * 60 * 60 * 1000,
    });
  });

  it('sets and gets a content hash', async () => {
    await service.setHash('doc-1', 'abc123');
    const result = await service.getHash('doc-1');
    expect(result).toBe('abc123');
  });

  it('returns undefined for unknown document ID', async () => {
    const result = await service.getHash('unknown');
    expect(result).toBeUndefined();
  });

  it('deletes a content hash', async () => {
    await service.setHash('doc-1', 'abc123');
    await service.deleteHash('doc-1');
    const result = await service.getHash('doc-1');
    expect(result).toBeUndefined();
  });

  it('warns on unexpected non-string cache value', async () => {
    (mockCache.get as jest.Mock).mockResolvedValueOnce(42);
    const result = await service.getHash('doc-1');
    expect(result).toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unexpected cache value type'),
    );
  });

  it('uses namespaced cache keys', async () => {
    await service.setHash('doc-1', 'abc123');
    expect(mockCache.set).toHaveBeenCalledWith('doc-sync:doc-1', 'abc123');
  });

  describe('hasChanged', () => {
    it('returns true for a new document', async () => {
      const result = await service.hasChanged('doc-new', 'hash1');
      expect(result).toBe(true);
    });

    it('returns false when hash matches', async () => {
      await service.setHash('doc-1', 'hash1');
      const result = await service.hasChanged('doc-1', 'hash1');
      expect(result).toBe(false);
    });

    it('returns true when hash differs', async () => {
      await service.setHash('doc-1', 'hash1');
      const result = await service.hasChanged('doc-1', 'hash2');
      expect(result).toBe(true);
    });
  });
});
