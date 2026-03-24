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

import type { CanonicalTool, Json, ToolIndexBackend } from '../types';

const DEFAULT_NS = '__default__';

function norm(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  return Math.sqrt(sum) || 1.0;
}

function cosine(q: number[], qNorm: number, v: number[]): number {
  let dot = 0;
  for (let i = 0; i < q.length; i++) dot += q[i] * v[i];
  const result = dot / (qNorm * norm(v));
  return Number.isFinite(result) ? result : 0;
}

function passesTagFilter(
  tool: CanonicalTool,
  allow: Set<string> | null,
  deny: Set<string> | null,
): boolean {
  const tset = new Set(tool.tags || []);
  if (deny !== null) {
    for (const tag of tset) {
      if (deny.has(tag)) return false;
    }
  }
  if (allow !== null) {
    let hasAny = false;
    for (const tag of tset) {
      if (allow.has(tag)) {
        hasAny = true;
        break;
      }
    }
    if (!hasAny) return false;
  }
  return true;
}

/**
 * In-memory vector backend. 1:1 port of Python ToolScope's MemoryBackend.
 *
 * - Zero dependencies
 * - Namespace support
 * - Cosine similarity search with tag filtering
 * - Intended for defaults, tests, and small-to-medium tool catalogs
 */
export class MemoryBackend implements ToolIndexBackend {
  private readonly _vectors = new Map<string, Map<string, number[]>>();
  private readonly _payloads = new Map<string, Map<string, CanonicalTool>>();
  private readonly _dims = new Map<string, number>();

  ensureNamespace(namespace: string | null, dim: number): void {
    const ns = namespace ?? DEFAULT_NS;
    if (!this._vectors.has(ns)) {
      this._vectors.set(ns, new Map());
      this._payloads.set(ns, new Map());
      this._dims.set(ns, dim);
    } else if (this._dims.get(ns) !== dim) {
      throw new Error(
        `Namespace '${ns}' already exists with dim ${this._dims.get(ns)}, got ${dim}`,
      );
    }
  }

  upsert(
    ids: string[],
    vectors: number[][],
    payloads: CanonicalTool[],
    namespace?: string | null,
  ): void {
    if (vectors.length === 0) return;
    const ns = namespace ?? DEFAULT_NS;

    this.ensureNamespace(ns, vectors[0].length);

    const vMap = this._vectors.get(ns)!;
    const pMap = this._payloads.get(ns)!;
    const dim = this._dims.get(ns)!;

    for (let i = 0; i < ids.length; i++) {
      if (vectors[i].length !== dim) {
        throw new Error('Vector dimension mismatch');
      }
      vMap.set(ids[i], vectors[i]);
      pMap.set(ids[i], payloads[i]);
    }
  }

  delete(ids: string[], namespace?: string | null): void {
    const ns = namespace ?? DEFAULT_NS;
    const vMap = this._vectors.get(ns);
    const pMap = this._payloads.get(ns);
    if (!vMap || !pMap) return;

    for (const id of ids) {
      vMap.delete(id);
      pMap.delete(id);
    }
  }

  search(
    queryVector: number[],
    k: number,
    namespace?: string | null,
    filter?: Json,
  ): Array<[string, number]> {
    const ns = namespace ?? DEFAULT_NS;
    const vMap = this._vectors.get(ns);
    const pMap = this._payloads.get(ns);
    if (!vMap || !pMap) return [];

    let allow: Set<string> | null = null;
    let deny: Set<string> | null = null;
    if (filter) {
      const at = filter.allow_tags;
      const dt = filter.deny_tags;
      if (Array.isArray(at)) allow = new Set(at as string[]);
      if (Array.isArray(dt)) deny = new Set(dt as string[]);
    }

    const qn = norm(queryVector);
    const scored: Array<[string, number]> = [];

    for (const [id, vec] of vMap) {
      const payload = pMap.get(id);
      if (!payload) continue;
      if (filter && !passesTagFilter(payload, allow, deny)) continue;
      scored.push([id, cosine(queryVector, qn, vec)]);
    }

    scored.sort((a, b) => b[1] - a[1]);
    return scored.slice(0, k);
  }

  get(ids: string[], namespace?: string | null): CanonicalTool[] {
    const ns = namespace ?? DEFAULT_NS;
    const pMap = this._payloads.get(ns);
    if (!pMap) return [];
    return ids
      .map(id => pMap.get(id))
      .filter((p): p is CanonicalTool => p !== undefined);
  }
}
