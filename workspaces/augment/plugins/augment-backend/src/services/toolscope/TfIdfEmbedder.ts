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

import type { EmbeddingProvider } from './types';

export type { EmbeddingProvider };

/**
 * Tokenize text into lowercase terms, splitting on non-alphanumeric characters.
 * Filters out single-character tokens and common stop words.
 */
const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'into',
  'about',
  'that',
  'this',
  'it',
  'its',
  'or',
  'and',
  'but',
  'if',
  'not',
  'no',
  'so',
  'up',
  'out',
]);

/**
 * Split camelCase and PascalCase boundaries before lowercasing.
 * e.g. "createIssue" -> "create Issue" -> "create issue"
 *      "getContainerLogs" -> "get Container Logs" -> "get container logs"
 */
function splitCamelCase(text: string): string {
  return text.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function tokenize(text: string): string[] {
  return splitCamelCase(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * In-process TF-IDF embedding provider.
 *
 * Builds a vocabulary from the corpus of tool descriptions and computes
 * TF-IDF vectors. Vocabulary is rebuilt when the corpus changes.
 * Deterministic, synchronous, zero external dependencies.
 *
 * Follows ToolScope's EmbeddingProvider protocol.
 */
export class TfIdfEmbedder implements EmbeddingProvider {
  private vocabulary: string[] = [];
  private vocabIndex: Map<string, number> = new Map();
  private idfValues: number[] = [];

  /**
   * Build the vocabulary and IDF values from a corpus of texts.
   * Must be called before embed() to ensure vectors are meaningful.
   */
  fit(corpus: string[]): void {
    const docFreq = new Map<string, number>();
    const allTerms = new Set<string>();

    for (const text of corpus) {
      const uniqueTerms = new Set(tokenize(text));
      for (const term of uniqueTerms) {
        allTerms.add(term);
        docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
      }
    }

    this.vocabulary = Array.from(allTerms).sort();
    this.vocabIndex = new Map(this.vocabulary.map((t, i) => [t, i]));

    const n = corpus.length || 1;
    this.idfValues = this.vocabulary.map(term => {
      const df = docFreq.get(term) ?? 0;
      return Math.log((n + 1) / (df + 1)) + 1;
    });
  }

  /**
   * Embed one or more texts into TF-IDF vectors.
   * Each vector has length = vocabulary size.
   */
  embedTexts(texts: string[]): number[][] {
    const dim = this.vocabulary.length;
    if (dim === 0) {
      return texts.map(() => []);
    }

    return texts.map(text => {
      const tokens = tokenize(text);
      const tf = new Map<string, number>();
      for (const token of tokens) {
        tf.set(token, (tf.get(token) ?? 0) + 1);
      }

      const vec = new Array<number>(dim).fill(0);
      const maxTf = Math.max(1, ...tf.values());

      for (const [term, count] of tf) {
        const idx = this.vocabIndex.get(term);
        if (idx !== undefined) {
          vec[idx] = (0.5 + (0.5 * count) / maxTf) * this.idfValues[idx];
        }
      }

      // L2-normalize
      let norm = 0;
      for (let i = 0; i < dim; i++) {
        norm += vec[i] * vec[i];
      }
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let i = 0; i < dim; i++) {
          vec[i] /= norm;
        }
      }

      return vec;
    });
  }
}
