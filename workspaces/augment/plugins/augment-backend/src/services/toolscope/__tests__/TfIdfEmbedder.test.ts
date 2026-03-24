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

import { TfIdfEmbedder } from '../TfIdfEmbedder';

describe('TfIdfEmbedder', () => {
  let embedder: TfIdfEmbedder;

  beforeEach(() => {
    embedder = new TfIdfEmbedder();
  });

  describe('embed without fit', () => {
    it('returns empty vectors when vocabulary is empty', () => {
      const result = embedder.embedTexts(['hello world']);
      expect(result).toEqual([[]]);
    });

    it('returns empty array for empty input', () => {
      const result = embedder.embedTexts([]);
      expect(result).toEqual([]);
    });
  });

  describe('fit with empty corpus', () => {
    it('produces empty vectors after fitting empty corpus', () => {
      embedder.fit([]);
      const result = embedder.embedTexts(['hello world']);
      expect(result).toEqual([[]]);
    });
  });

  describe('fit and embed', () => {
    it('produces consistent vectors for the same input', () => {
      const corpus = ['list pods in kubernetes', 'create github issue'];
      embedder.fit(corpus);

      const v1 = embedder.embedTexts(['list pods in kubernetes']);
      const v2 = embedder.embedTexts(['list pods in kubernetes']);

      expect(v1).toEqual(v2);
    });

    it('produces different vectors for different inputs', () => {
      const corpus = [
        'list pods in kubernetes cluster',
        'create issue on github repository',
      ];
      embedder.fit(corpus);

      const [v1] = embedder.embedTexts(['list pods in kubernetes cluster']);
      const [v2] = embedder.embedTexts(['create issue on github repository']);

      expect(v1).not.toEqual(v2);
    });

    it('produces L2-normalized vectors', () => {
      const corpus = ['deploy application', 'scale deployment replicas'];
      embedder.fit(corpus);

      const [vec] = embedder.embedTexts(['deploy application']);
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      expect(norm).toBeCloseTo(1.0, 5);
    });

    it('handles empty string input', () => {
      embedder.fit(['hello world', 'foo bar']);
      const [vec] = embedder.embedTexts(['']);
      expect(vec.every(v => v === 0)).toBe(true);
    });

    it('handles single-word descriptions', () => {
      embedder.fit(['deploy', 'search']);
      const [v1] = embedder.embedTexts(['deploy']);
      const [v2] = embedder.embedTexts(['search']);
      expect(v1.length).toBe(v2.length);
      expect(v1.length).toBeGreaterThan(0);
    });

    it('rebuilds vocabulary on refit', () => {
      embedder.fit(['alpha bravo']);
      const [v1] = embedder.embedTexts(['alpha bravo']);
      const dim1 = v1.length;

      embedder.fit(['charlie delta echo']);
      const [v2] = embedder.embedTexts(['charlie delta echo']);
      const dim2 = v2.length;

      expect(dim1).not.toBe(dim2);
    });

    it('embeds multiple texts at once', () => {
      embedder.fit(['pods list', 'create issue', 'deploy app']);
      const results = embedder.embedTexts(['pods list', 'create issue']);
      expect(results).toHaveLength(2);
      expect(results[0].length).toBe(results[1].length);
    });

    it('filters stop words and short tokens', () => {
      embedder.fit(['the quick brown fox', 'a lazy dog']);
      const [v1] = embedder.embedTexts(['the is a']);
      expect(v1.every(v => v === 0)).toBe(true);
    });

    it('similar queries produce similar vectors', () => {
      const corpus = [
        'list pods kubernetes cluster',
        'create github issue tracker',
        'deploy application server',
      ];
      embedder.fit(corpus);

      const [qVec] = embedder.embedTexts(['pods kubernetes']);
      const [podVec] = embedder.embedTexts(['list pods kubernetes cluster']);
      const [issueVec] = embedder.embedTexts(['create github issue tracker']);

      const dotSimilar = qVec.reduce((s, v, i) => s + v * podVec[i], 0);
      const dotDissimilar = qVec.reduce((s, v, i) => s + v * issueVec[i], 0);

      expect(dotSimilar).toBeGreaterThan(dotDissimilar);
    });
  });

  describe('camelCase splitting', () => {
    it('splits camelCase tool names into separate tokens', () => {
      const corpus = ['createIssue on GitHub', 'listPods in cluster'];
      embedder.fit(corpus);

      const [vec] = embedder.embedTexts(['create issue']);
      const hasNonZero = vec.some(v => v !== 0);
      expect(hasNonZero).toBe(true);
    });

    it('matches camelCase tool name from natural language query', () => {
      const corpus = [
        'createIssue Create a new issue',
        'getContainerLogs Get container logs',
        'listDeployments List all deployments',
      ];
      embedder.fit(corpus);

      const [qVec] = embedder.embedTexts(['create issue']);
      const [createVec] = embedder.embedTexts([
        'createIssue Create a new issue',
      ]);
      const [logsVec] = embedder.embedTexts([
        'getContainerLogs Get container logs',
      ]);

      const dotCreate = qVec.reduce((s, v, i) => s + v * createVec[i], 0);
      const dotLogs = qVec.reduce((s, v, i) => s + v * logsVec[i], 0);

      expect(dotCreate).toBeGreaterThan(dotLogs);
    });

    it('handles PascalCase names', () => {
      embedder.fit(['ListAllPods in namespace']);
      const [vec] = embedder.embedTexts(['list pods']);
      const hasNonZero = vec.some(v => v !== 0);
      expect(hasNonZero).toBe(true);
    });

    it('handles snake_case names (unchanged behavior)', () => {
      embedder.fit(['list_pods in namespace']);
      const [vec] = embedder.embedTexts(['list pods']);
      const hasNonZero = vec.some(v => v !== 0);
      expect(hasNonZero).toBe(true);
    });
  });
});
