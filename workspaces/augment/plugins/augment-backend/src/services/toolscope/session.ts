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

/**
 * Cosine similarity between two vectors.
 * Used for comparing query embeddings between turns.
 */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = (Math.sqrt(na) || 1) * (Math.sqrt(nb) || 1);
  return dot / denom;
}

/**
 * Controls session-aware caching and toolset stickiness.
 * 1:1 port of Python ToolScope's StickySessionConfig.
 */
export interface StickySessionConfig {
  readonly enabled: boolean;

  /** If cosine(query, lastQuery) >= this, reuse last selected tool ids. */
  readonly similarityThresholdReuse: number;

  /** If cosine >= this but below reuse threshold, refresh with sticky bias. */
  readonly similarityThresholdRefresh: number;

  /** When refreshing, ensure up to this many previously-selected tools are kept. */
  readonly stickyKeep: number;

  /** Score bonus for previously-selected tools in refresh mode. */
  readonly stickyBoost: number;

  /** Expire session state after inactivity (seconds). */
  readonly ttlSeconds: number;

  /** Max concurrent sessions (memory bound). */
  readonly maxSessions: number;
}

export const DEFAULT_SESSION_CONFIG: StickySessionConfig = {
  enabled: false,
  similarityThresholdReuse: 0.92,
  similarityThresholdRefresh: 0.8,
  stickyKeep: 4,
  stickyBoost: 0.03,
  ttlSeconds: 3600,
  maxSessions: 1000,
};

export interface SessionState {
  lastSeenTs: number;
  lastQueryVec: number[];
  lastSelectedIds: string[];
}

/**
 * In-memory session cache with TTL expiry and LRU-style eviction.
 * 1:1 port of Python ToolScope's SessionCache.
 */
export class SessionCache {
  private readonly cfg: StickySessionConfig;
  private readonly states = new Map<string, SessionState>();

  constructor(cfg: StickySessionConfig) {
    this.cfg = cfg;
  }

  get(sessionId: string): SessionState | undefined {
    const st = this.states.get(sessionId);
    if (!st) return undefined;

    if (Date.now() / 1000 - st.lastSeenTs > this.cfg.ttlSeconds) {
      this.states.delete(sessionId);
      return undefined;
    }
    return st;
  }

  put(sessionId: string, queryVec: number[], selectedIds: string[]): void {
    this.states.set(sessionId, {
      lastSeenTs: Date.now() / 1000,
      lastQueryVec: queryVec,
      lastSelectedIds: [...selectedIds],
    });

    if (this.states.size > this.cfg.maxSessions) {
      const entries = [...this.states.entries()];
      entries.sort((a, b) => a[1].lastSeenTs - b[1].lastSeenTs);
      const evictCount = Math.max(1, Math.floor(this.states.size / 10));
      for (let i = 0; i < evictCount; i++) {
        this.states.delete(entries[i][0]);
      }
    }
  }

  get size(): number {
    return this.states.size;
  }
}
