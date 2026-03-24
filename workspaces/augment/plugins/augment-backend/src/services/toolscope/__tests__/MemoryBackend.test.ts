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

import { MemoryBackend } from '../backends/memory';
import type { CanonicalTool } from '../types';

function tool(name: string, tags: string[] = []): CanonicalTool {
  return {
    name,
    description: `Description of ${name}`,
    inputSchema: {},
    fingerprint: { value: `fp_${name}` },
    tags,
  };
}

describe('MemoryBackend', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    backend = new MemoryBackend();
  });

  describe('ensureNamespace', () => {
    it('creates a new namespace', () => {
      expect(() => backend.ensureNamespace(null, 3)).not.toThrow();
    });

    it('allows same dimension on repeat call', () => {
      backend.ensureNamespace('ns1', 3);
      expect(() => backend.ensureNamespace('ns1', 3)).not.toThrow();
    });

    it('throws on dimension mismatch', () => {
      backend.ensureNamespace('ns1', 3);
      expect(() => backend.ensureNamespace('ns1', 5)).toThrow('dim 3, got 5');
    });
  });

  describe('upsert and get', () => {
    it('inserts and retrieves tools', () => {
      const t = tool('a');
      backend.upsert(['fp_a'], [[1, 0, 0]], [t]);

      const result = backend.get(['fp_a']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('a');
    });

    it('updates existing tools', () => {
      const t1 = tool('a');
      const t2 = { ...t1, description: 'updated' };
      backend.upsert(['fp_a'], [[1, 0]], [t1]);
      backend.upsert(['fp_a'], [[0, 1]], [t2]);

      const result = backend.get(['fp_a']);
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('updated');
    });

    it('handles empty upsert', () => {
      backend.upsert([], [], []);
      expect(backend.get([])).toEqual([]);
    });

    it('throws on dimension mismatch within upsert', () => {
      backend.ensureNamespace(null, 2);
      expect(() => backend.upsert(['fp_a'], [[1, 0, 0]], [tool('a')])).toThrow(
        'dim 2, got 3',
      );
    });

    it('skips unknown ids in get', () => {
      backend.upsert(['fp_a'], [[1, 0]], [tool('a')]);
      const result = backend.get(['fp_a', 'fp_b']);
      expect(result).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('removes records by id', () => {
      backend.upsert(
        ['fp_a', 'fp_b'],
        [
          [1, 0],
          [0, 1],
        ],
        [tool('a'), tool('b')],
      );
      backend.delete(['fp_a']);

      expect(backend.get(['fp_a'])).toEqual([]);
      expect(backend.get(['fp_b'])).toHaveLength(1);
    });

    it('handles non-existent namespace gracefully', () => {
      expect(() => backend.delete(['fp_a'], 'nonexistent')).not.toThrow();
    });
  });

  describe('search', () => {
    it('returns top-k results by cosine similarity', () => {
      const tools = [tool('exact'), tool('partial'), tool('none')];
      backend.upsert(
        ['fp_exact', 'fp_partial', 'fp_none'],
        [
          [1, 0, 0],
          [0.7, 0.7, 0],
          [0, 0, 1],
        ],
        tools,
      );

      const results = backend.search([1, 0, 0], 3);
      expect(results).toHaveLength(3);
      expect(results[0][0]).toBe('fp_exact');
      expect(results[0][1]).toBeCloseTo(1.0, 5);
      expect(results[1][0]).toBe('fp_partial');
    });

    it('returns at most k results', () => {
      backend.upsert(
        ['a', 'b', 'c'],
        [
          [1, 0],
          [0, 1],
          [1, 1],
        ],
        [tool('a'), tool('b'), tool('c')],
      );
      const results = backend.search([1, 0], 2);
      expect(results).toHaveLength(2);
    });

    it('returns empty for non-existent namespace', () => {
      expect(backend.search([1, 0], 5, 'nonexistent')).toEqual([]);
    });
  });

  describe('tag filtering in search', () => {
    beforeEach(() => {
      backend.upsert(
        ['fp_jira', 'fp_k8s', 'fp_both'],
        [
          [1, 0],
          [0, 1],
          [1, 1],
        ],
        [
          tool('jira_tool', ['jira']),
          tool('k8s_tool', ['kubernetes']),
          tool('both_tool', ['jira', 'kubernetes']),
        ],
      );
    });

    it('filters by allow_tags', () => {
      const results = backend.search([1, 1], 10, null, {
        allow_tags: ['jira'],
      });
      expect(results.every(([id]) => id !== 'fp_k8s')).toBe(true);
    });

    it('filters by deny_tags', () => {
      const results = backend.search([1, 1], 10, null, {
        deny_tags: ['kubernetes'],
      });
      expect(results.every(([id]) => id !== 'fp_k8s')).toBe(true);
      expect(results.every(([id]) => id !== 'fp_both')).toBe(true);
    });

    it('combines allow and deny', () => {
      const results = backend.search([1, 1], 10, null, {
        allow_tags: ['jira'],
        deny_tags: ['kubernetes'],
      });
      expect(results).toHaveLength(1);
      expect(results[0][0]).toBe('fp_jira');
    });
  });

  describe('namespaces', () => {
    it('isolates data between namespaces', () => {
      backend.upsert(['a'], [[1, 0]], [tool('a')], 'ns1');
      backend.upsert(['b'], [[0, 1]], [tool('b')], 'ns2');

      expect(backend.get(['a'], 'ns1')).toHaveLength(1);
      expect(backend.get(['a'], 'ns2')).toHaveLength(0);
      expect(backend.get(['b'], 'ns2')).toHaveLength(1);
    });
  });
});
