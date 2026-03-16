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

import type { ToolFingerprint } from './types';

/**
 * Cache embeddings by tool fingerprint. Keeps stateless API fast.
 * 1:1 port of Python ToolScope's EmbeddingCache.
 */
export class EmbeddingCache {
  private readonly vectors = new Map<string, number[]>();

  get(fp: ToolFingerprint): number[] | undefined {
    return this.vectors.get(fp.value);
  }

  put(fp: ToolFingerprint, vec: number[]): void {
    this.vectors.set(fp.value, vec);
  }

  get size(): number {
    return this.vectors.size;
  }

  clear(): void {
    this.vectors.clear();
  }
}
