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

import { InMemoryToolIndex } from '../InMemoryToolIndex';
import type { ToolDescriptor } from '../types';

function tool(
  serverId: string,
  name: string,
  description = '',
): ToolDescriptor {
  return { serverId, name, description };
}

describe('InMemoryToolIndex', () => {
  let index: InMemoryToolIndex;

  beforeEach(() => {
    index = new InMemoryToolIndex();
  });

  describe('upsert and size', () => {
    it('starts empty', () => {
      expect(index.size()).toBe(0);
    });

    it('adds tools', () => {
      index.upsert(
        [tool('s1', 'tool1'), tool('s1', 'tool2')],
        [
          [1, 0],
          [0, 1],
        ],
      );
      expect(index.size()).toBe(2);
    });

    it('updates existing tools by serverId+name', () => {
      index.upsert([tool('s1', 'tool1')], [[1, 0]]);
      index.upsert([tool('s1', 'tool1', 'updated')], [[0, 1]]);
      expect(index.size()).toBe(1);

      const results = index.search([0, 1], 1);
      expect(results[0].tool.description).toBe('updated');
      expect(results[0].score).toBeCloseTo(1.0, 5);
    });

    it('throws when tools and vectors have different lengths', () => {
      expect(() =>
        index.upsert([tool('s1', 'a'), tool('s1', 'b')], [[1, 0]]),
      ).toThrow('tools.length (2) must equal vectors.length (1)');
    });

    it('handles empty upsert', () => {
      index.upsert([], []);
      expect(index.size()).toBe(0);
    });
  });

  describe('search', () => {
    it('returns results sorted by cosine similarity descending', () => {
      const t1 = tool('s1', 'exact_match');
      const t2 = tool('s1', 'partial_match');
      const t3 = tool('s2', 'no_match');

      index.upsert(
        [t1, t2, t3],
        [
          [1, 0, 0],
          [0.7, 0.7, 0],
          [0, 0, 1],
        ],
      );

      const results = index.search([1, 0, 0], 3);
      expect(results).toHaveLength(3);
      expect(results[0].tool.name).toBe('exact_match');
      expect(results[1].tool.name).toBe('partial_match');
      expect(results[2].tool.name).toBe('no_match');
      expect(results[0].score).toBeGreaterThan(results[1].score);
      expect(results[1].score).toBeGreaterThan(results[2].score);
    });

    it('returns at most k results', () => {
      index.upsert(
        [tool('s1', 'a'), tool('s1', 'b'), tool('s1', 'c')],
        [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
      );

      const results = index.search([1, 0, 0], 2);
      expect(results).toHaveLength(2);
    });

    it('returns all results when k > index size', () => {
      index.upsert([tool('s1', 'only')], [[1, 0]]);
      const results = index.search([1, 0], 10);
      expect(results).toHaveLength(1);
    });

    it('returns empty array when index is empty', () => {
      const results = index.search([1, 0], 5);
      expect(results).toEqual([]);
    });

    it('returns 0 score for orthogonal vectors', () => {
      index.upsert([tool('s1', 'orthogonal')], [[1, 0]]);
      const results = index.search([0, 1], 1);
      expect(results[0].score).toBeCloseTo(0, 5);
    });

    it('returns 1.0 score for identical normalized vectors', () => {
      const norm = 1 / Math.sqrt(2);
      index.upsert([tool('s1', 'identical')], [[norm, norm]]);
      const results = index.search([norm, norm], 1);
      expect(results[0].score).toBeCloseTo(1.0, 5);
    });

    it('returns empty array when k is 0', () => {
      index.upsert([tool('s1', 'a')], [[1, 0]]);
      const results = index.search([1, 0], 0);
      expect(results).toEqual([]);
    });

    it('handles mismatched query vector dimensions gracefully', () => {
      index.upsert([tool('s1', 'a')], [[1, 0, 0]]);
      const results = index.search([1, 0], 1);
      expect(results[0].score).toBe(0);
    });

    it('returns 0 score when vectors contain NaN', () => {
      index.upsert([tool('s1', 'nan_tool')], [[NaN, 1]]);
      const results = index.search([1, 0], 1);
      expect(results[0].score).toBe(0);
    });
  });

  describe('removeStale', () => {
    it('removes tools not in the current set', () => {
      const t1 = tool('s1', 'keep');
      const t2 = tool('s1', 'remove');
      index.upsert(
        [t1, t2],
        [
          [1, 0],
          [0, 1],
        ],
      );

      const removed = index.removeStale([t1]);
      expect(removed).toBe(1);
      expect(index.size()).toBe(1);
    });

    it('keeps all tools when all are current', () => {
      const tools = [tool('s1', 'a'), tool('s2', 'b')];
      index.upsert(tools, [
        [1, 0],
        [0, 1],
      ]);

      const removed = index.removeStale(tools);
      expect(removed).toBe(0);
      expect(index.size()).toBe(2);
    });

    it('removes all when current set is empty', () => {
      index.upsert([tool('s1', 'a')], [[1, 0]]);
      const removed = index.removeStale([]);
      expect(removed).toBe(1);
      expect(index.size()).toBe(0);
    });

    it('selectively removes across multiple servers', () => {
      const t1 = tool('s1', 'keep');
      const t2 = tool('s1', 'remove');
      const t3 = tool('s2', 'keep');
      const t4 = tool('s2', 'remove');
      index.upsert(
        [t1, t2, t3, t4],
        [
          [1, 0],
          [0, 1],
          [1, 1],
          [0, 0],
        ],
      );

      const removed = index.removeStale([t1, t3]);
      expect(removed).toBe(2);
      expect(index.size()).toBe(2);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      index.upsert([tool('s1', 'a')], [[1]]);
      index.clear();
      expect(index.size()).toBe(0);
    });
  });
});
