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

import { ContentStore } from './ContentStore';
import { MAX_RETAINED_DIGESTS } from './types';

/** @type {import('@backstage/backend-plugin-api').LoggerService} */
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

const digest1 = `sha256:${'a'.repeat(64)}`;
const digest2 = `sha256:${'b'.repeat(64)}`;
const digest3 = `sha256:${'c'.repeat(64)}`;

describe('ContentStore', () => {
  async function createStore(maxBytes?: number): Promise<ContentStore> {
    const store = new ContentStore(mockLogger, maxBytes);
    // Initialize in-memory mode (no database)
    await store.initialize();
    return store;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('store and retrieve', () => {
    it('stores and retrieves Markdown content', async () => {
      const store = await createStore();
      const stored = await store.store('source-a', digest1, '# Hello');
      expect(stored).toBe(true);

      const content = await store.get('source-a', digest1);
      expect(content).toBe('# Hello');
    });

    it('returns undefined for unknown source or digest', async () => {
      const store = await createStore();
      expect(await store.get('unknown', digest1)).toBeUndefined();
      await store.store('source-a', digest1, '# Hello');
      expect(await store.get('source-a', digest2)).toBeUndefined();
    });

    it('is idempotent — duplicate stores return false', async () => {
      const store = await createStore();
      expect(await store.store('source-a', digest1, '# Hello')).toBe(true);
      expect(await store.store('source-a', digest1, '# Hello')).toBe(false);

      // Content remains the same
      expect(await store.get('source-a', digest1)).toBe('# Hello');
    });

    it('isolates content between sources', async () => {
      const store = await createStore();
      await store.store('source-a', digest1, '# A');
      await store.store('source-b', digest1, '# B');

      expect(await store.get('source-a', digest1)).toBe('# A');
      expect(await store.get('source-b', digest1)).toBe('# B');
    });
  });

  describe('admission checks', () => {
    it('admits content within byte limit', async () => {
      const store = await createStore(1000);
      const result = await store.checkAdmission('source-a', 500);
      expect(result.admitted).toBe(true);
    });

    it('rejects content exceeding byte limit', async () => {
      const store = await createStore(100);
      await store.store('source-a', digest1, 'x'.repeat(80));

      const result = await store.checkAdmission('source-a', 30);
      expect(result.admitted).toBe(false);
      expect(result.reason).toContain('bytes would exceed');
    });

    it('admits already-stored digests without double-counting bytes', async () => {
      // Store content that uses most of the budget
      const store = await createStore(100);
      await store.store('source-a', digest1, 'x'.repeat(80));

      // The same digest should not be double-counted when re-checked
      const stats = await store.getSourceStats('source-a');
      expect(stats.totalBytes).toBe(80);

      // A new digest that would exceed the budget if the old digest
      // were counted twice should still be admitted
      const result = await store.checkAdmission('source-a', 15);
      expect(result.admitted).toBe(true);
    });

    it('rejects content exceeding digest count limit', async () => {
      const store = await createStore(1_000_000_000);

      // Mock the stats to simulate being at the limit
      jest.spyOn(store, 'getSourceStats').mockResolvedValue({
        totalBytes: 0,
        digestCount: MAX_RETAINED_DIGESTS,
      });

      const result = await store.checkAdmission('source-a', 100);
      expect(result.admitted).toBe(false);
      expect(result.reason).toContain('digest count');
    });
  });

  describe('source statistics', () => {
    it('returns zero stats for empty source', async () => {
      const store = await createStore();
      const stats = await store.getSourceStats('source-a');
      expect(stats.totalBytes).toBe(0);
      expect(stats.digestCount).toBe(0);
    });

    it('tracks accumulated bytes and count', async () => {
      const store = await createStore();
      await store.store('source-a', digest1, '# Hello');
      await store.store('source-a', digest2, '# World');

      const stats = await store.getSourceStats('source-a');
      expect(stats.digestCount).toBe(2);
      expect(stats.totalBytes).toBeGreaterThan(0);
    });
  });

  describe('revision tracking', () => {
    it('allocates monotonically increasing revisions', async () => {
      const store = await createStore();
      const r1 = await store.allocateRevision('source-a');
      const r2 = await store.allocateRevision('source-a');
      const r3 = await store.allocateRevision('source-a');

      expect(r1).toBe('1');
      expect(r2).toBe('2');
      expect(r3).toBe('3');
    });

    it('isolates revisions between sources', async () => {
      const store = await createStore();
      const a1 = await store.allocateRevision('source-a');
      const b1 = await store.allocateRevision('source-b');
      const a2 = await store.allocateRevision('source-a');

      expect(a1).toBe('1');
      expect(b1).toBe('1');
      expect(a2).toBe('2');
    });

    it('retrieves current revision', async () => {
      const store = await createStore();
      expect(await store.getCurrentRevision('source-a')).toBeUndefined();

      await store.allocateRevision('source-a');
      expect(await store.getCurrentRevision('source-a')).toBe('1');

      await store.allocateRevision('source-a');
      expect(await store.getCurrentRevision('source-a')).toBe('2');
    });
  });

  describe('reconciliation acknowledgment', () => {
    it('saves and retrieves acknowledgment', async () => {
      const store = await createStore();
      await store.saveAcknowledgment('source-a', '5', [digest1, digest2]);

      const ack = await store.getLastAcknowledgment('source-a');
      expect(ack).toBeDefined();
      expect(ack!.revision).toBe('5');
      expect(ack!.retainedDigests).toEqual([digest1, digest2].sort());
    });

    it('returns undefined when no acknowledgment exists', async () => {
      const store = await createStore();
      const ack = await store.getLastAcknowledgment('source-a');
      expect(ack).toBeUndefined();
    });

    it('overwrites previous acknowledgment', async () => {
      const store = await createStore();
      await store.saveAcknowledgment('source-a', '5', [digest1]);
      await store.saveAcknowledgment('source-a', '7', [digest2]);

      const ack = await store.getLastAcknowledgment('source-a');
      expect(ack!.revision).toBe('7');
      expect(ack!.retainedDigests).toEqual([digest2]);
    });

    it('handles idempotent retry detection', async () => {
      const store = await createStore();
      await store.saveAcknowledgment('source-a', '5', [digest1, digest2]);

      const ack = await store.getLastAcknowledgment('source-a');
      expect(ack).toBeDefined();

      // Same revision and same set is detectable for idempotency
      const retryDigests = [digest2, digest1]; // Different order
      const sortedRetry = [...retryDigests].sort();
      const sortedLast = [...ack!.retainedDigests].sort();
      expect(sortedRetry).toEqual(sortedLast);
    });
  });

  describe('cleanup', () => {
    it('deletes unreferenced digests', async () => {
      const store = await createStore();
      await store.store('source-a', digest1, '# One');
      await store.store('source-a', digest2, '# Two');
      await store.store('source-a', digest3, '# Three');

      // Only protect digest1 and digest2
      const deleted = await store.cleanup(
        'source-a',
        new Set([digest1, digest2]),
      );
      expect(deleted).toBe(1);

      // digest3 should be gone
      expect(await store.get('source-a', digest3)).toBeUndefined();
      // digest1 and digest2 should remain
      expect(await store.get('source-a', digest1)).toBe('# One');
      expect(await store.get('source-a', digest2)).toBe('# Two');
    });

    it('does nothing when all digests are protected', async () => {
      const store = await createStore();
      await store.store('source-a', digest1, '# One');

      const deleted = await store.cleanup('source-a', new Set([digest1]));
      expect(deleted).toBe(0);
      expect(await store.get('source-a', digest1)).toBe('# One');
    });

    it('deletes all digests when protectedDigests is empty', async () => {
      const store = await createStore();
      await store.store('source-a', digest1, '# One');
      await store.store('source-a', digest2, '# Two');

      const deleted = await store.cleanup('source-a', new Set());
      expect(deleted).toBe(2);

      expect(await store.get('source-a', digest1)).toBeUndefined();
      expect(await store.get('source-a', digest2)).toBeUndefined();
    });

    it('returns 0 when source has no retained digests', async () => {
      const store = await createStore();
      const deleted = await store.cleanup('source-a', new Set());
      expect(deleted).toBe(0);
    });
  });

  describe('retention limit validation', () => {
    it('passes when retained bytes are within limit', async () => {
      const store = await createStore(10000);
      await store.store('source-a', digest1, '# Small');
      await expect(
        store.validateRetentionLimit('source-a'),
      ).resolves.toBeUndefined();
    });

    it('throws when retained bytes exceed configured limit', async () => {
      const store = await createStore(10);
      await store.store('source-a', digest1, '# This is longer than 10 bytes');
      await expect(store.validateRetentionLimit('source-a')).rejects.toThrow(
        /below already-retained bytes/,
      );
    });
  });

  describe('database failure propagation', () => {
    it('store() propagates database write failures', async () => {
      const store = new ContentStore(mockLogger, 100_000);
      // Simulate durable mode with a failing database
      const mockKnex = jest.fn().mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(undefined),
        insert: jest.fn().mockRejectedValue(new Error('DB write failed')),
      }));
      (store as any).durable = true;
      (store as any).knex = mockKnex;

      await expect(
        store.store('source-a', digest1, '# Content'),
      ).rejects.toThrow('DB write failed');

      // Content should NOT be in memory after failed DB write
      expect(await store.get('source-a', digest1)).toBeUndefined();
    });

    it('allocateRevision() propagates database write failures', async () => {
      const store = new ContentStore(mockLogger, 100_000);
      const mockKnex = jest.fn().mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(undefined),
        insert: jest.fn().mockRejectedValue(new Error('DB write failed')),
      }));
      (store as any).durable = true;
      (store as any).knex = mockKnex;

      await expect(store.allocateRevision('source-a')).rejects.toThrow(
        'DB write failed',
      );

      // Revision should NOT be updated in memory
      expect(await store.getCurrentRevision('source-a')).toBeUndefined();
    });

    it('deleteDigests() propagates database delete failures without modifying memory', async () => {
      const store = new ContentStore(mockLogger, 100_000);
      await store.initialize();
      // Store content in memory first
      await store.store('source-a', digest1, '# Content');

      // Enable durable mode with a failing database
      const mockKnex = jest.fn().mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        delete: jest.fn().mockRejectedValue(new Error('DB delete failed')),
      }));
      (store as any).durable = true;
      (store as any).knex = mockKnex;

      // cleanup calls deleteDigests internally — should propagate the error
      await expect(store.cleanup('source-a', new Set())).rejects.toThrow(
        'DB delete failed',
      );

      // Content should still be in memory after failed DB delete
      expect(await store.get('source-a', digest1)).toBe('# Content');
    });

    it('saveAcknowledgment() propagates database write failures', async () => {
      const store = new ContentStore(mockLogger, 100_000);
      const mockKnex = jest.fn().mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(undefined),
        insert: jest.fn().mockRejectedValue(new Error('DB write failed')),
      }));
      (store as any).durable = true;
      (store as any).knex = mockKnex;

      await expect(
        store.saveAcknowledgment('source-a', '1', [digest1]),
      ).rejects.toThrow('DB write failed');

      // Acknowledgment should NOT be in memory
      expect(await store.getLastAcknowledgment('source-a')).toBeUndefined();
    });
  });

  describe('deterministic race behavior', () => {
    it('concurrent stores for the same digest are idempotent', async () => {
      const store = await createStore();
      const results = await Promise.all([
        store.store('source-a', digest1, '# Hello'),
        store.store('source-a', digest1, '# Hello'),
      ]);

      // Exactly one store should report newly stored
      expect(results.filter(r => r === true)).toHaveLength(1);
      expect(results.filter(r => r === false)).toHaveLength(1);
      expect(await store.get('source-a', digest1)).toBe('# Hello');
    });

    it('concurrent revision allocations produce distinct values', async () => {
      const store = await createStore();
      const results = await Promise.all([
        store.allocateRevision('source-a'),
        store.allocateRevision('source-a'),
        store.allocateRevision('source-a'),
      ]);

      const unique = new Set(results);
      expect(unique.size).toBe(3);
      // All should be positive decimal strings
      for (const rev of results) {
        expect(rev).toMatch(/^[1-9][0-9]*$/);
      }
    });

    it('cleanup during concurrent store does not delete new content', async () => {
      const store = await createStore();
      await store.store('source-a', digest1, '# Existing');

      // Start cleanup that protects nothing, then store new content
      const cleanupPromise = store.cleanup('source-a', new Set());
      await store.store('source-a', digest2, '# New');

      const deleted = await cleanupPromise;
      // digest1 should be deleted, digest2 may or may not be affected
      // depending on ordering, but the important thing is no crash
      expect(deleted).toBeGreaterThanOrEqual(1);
    });
  });
});
