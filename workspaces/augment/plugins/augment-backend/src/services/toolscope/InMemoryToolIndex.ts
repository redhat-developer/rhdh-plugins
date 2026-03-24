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

import type { ToolDescriptor } from './types';

interface IndexEntry {
  tool: ToolDescriptor;
  vector: number[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  const result = dot / denom;
  return Number.isFinite(result) ? result : 0;
}

/**
 * In-memory brute-force vector index for tool embeddings.
 *
 * Stores { tool, vector } tuples and searches via cosine similarity.
 * Same approach as ToolScope's MemoryBackend -- sufficient for <200 tools
 * where full index structures are overkill.
 */
export class InMemoryToolIndex {
  private entries: IndexEntry[] = [];

  upsert(tools: ToolDescriptor[], vectors: number[][]): void {
    if (tools.length !== vectors.length) {
      throw new Error(
        `upsert: tools.length (${tools.length}) must equal vectors.length (${vectors.length})`,
      );
    }
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      const vector = vectors[i];

      const existing = this.entries.findIndex(
        e => e.tool.serverId === tool.serverId && e.tool.name === tool.name,
      );
      if (existing >= 0) {
        this.entries[existing] = { tool, vector };
      } else {
        this.entries.push({ tool, vector });
      }
    }
  }

  search(
    queryVector: number[],
    k: number,
  ): Array<{ tool: ToolDescriptor; score: number }> {
    const scored = this.entries.map(entry => ({
      tool: entry.tool,
      score: cosineSimilarity(queryVector, entry.vector),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  /**
   * Remove tools that are no longer present.
   * Keeps only entries whose (serverId, name) pair appears in the keep set.
   */
  removeStale(currentTools: ToolDescriptor[]): number {
    const keepKeys = new Set(currentTools.map(t => `${t.serverId}\0${t.name}`));
    const before = this.entries.length;
    this.entries = this.entries.filter(e =>
      keepKeys.has(`${e.tool.serverId}\0${e.tool.name}`),
    );
    return before - this.entries.length;
  }

  clear(): void {
    this.entries = [];
  }

  size(): number {
    return this.entries.length;
  }
}
