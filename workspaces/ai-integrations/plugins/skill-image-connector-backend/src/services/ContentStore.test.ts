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
});
