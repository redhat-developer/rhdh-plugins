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

import type {
  CanonicalTool,
  EmbeddingProvider,
  ToolIndexBackend,
  ToolNormalizer,
  ToolFingerprint,
  Json,
} from './types';
import { EmbeddingCache } from './cache';
import type { ToolTextConfig } from './text';
import { DEFAULT_TOOL_TEXT_CONFIG, renderToolText } from './text';
import type { Reranker, RerankingConfig } from './rerankers';
import { makeReranker } from './rerankers';
import type { StickySessionConfig } from './session';
import { DEFAULT_SESSION_CONFIG, SessionCache, cosine } from './session';
import type { ToolScopeTrace, TraceSink } from './observability';
import { createTrace, Stopwatch } from './observability';
import { AutoToolNormalizer } from './normalize';
import { MemoryBackend } from './backends/memory';

// ---- Messages-to-query helpers ----

function messagesToQueryText(messages: unknown): string {
  if (typeof messages === 'string') return messages;
  if (Array.isArray(messages)) {
    return messages
      .map(m => {
        if (typeof m === 'object' && m !== null && !Array.isArray(m)) {
          const obj = m as Record<string, unknown>;
          return `${obj.role ?? ''}: ${obj.content ?? ''}`;
        }
        return String(m);
      })
      .join('\n');
  }
  return typeof messages === 'object' && messages !== null
    ? JSON.stringify(messages)
    : String(messages);
}

// ---- Tag helpers ----

function tagSet(tags?: readonly string[]): Set<string> | null {
  if (!tags || tags.length === 0) return null;
  const s = new Set<string>();
  for (const t of tags) {
    const trimmed = typeof t === 'string' ? t.trim() : '';
    if (trimmed) s.add(trimmed);
  }
  return s.size > 0 ? s : null;
}

function passesTagFilters(
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

// ---- Filter options ----

export interface FilterOptions {
  k?: number;
  filter?: Json;
  reranking?: RerankingConfig;
  allowTags?: readonly string[];
  denyTags?: readonly string[];
  sessionId?: string;
  turnId?: string;
  traceSink?: TraceSink;
}

/**
 * Central ToolIndex. 1:1 port of Python ToolScope's ToolIndex.
 *
 * Long-lived: register tools once, filter per prompt.
 * Normalizes -> embeds (cached) -> upserts -> searches -> returns original tools.
 */
export class ToolIndex {
  readonly backend: ToolIndexBackend;
  readonly embedder: EmbeddingProvider;
  readonly normalizer: ToolNormalizer;
  readonly cache: EmbeddingCache;
  readonly namespace: string | null;
  readonly toolTextConfig: ToolTextConfig;
  readonly reranker: Reranker | null;
  readonly rerankingConfig: RerankingConfig | null;
  readonly sessionCfg: StickySessionConfig;
  private sessionCache: SessionCache | null = null;

  constructor(opts: {
    backend: ToolIndexBackend;
    embedder: EmbeddingProvider;
    normalizer: ToolNormalizer;
    cache: EmbeddingCache;
    namespace?: string | null;
    toolTextConfig?: ToolTextConfig;
    reranker?: Reranker | null;
    rerankingConfig?: RerankingConfig | null;
    sessionCfg?: StickySessionConfig;
  }) {
    this.backend = opts.backend;
    this.embedder = opts.embedder;
    this.normalizer = opts.normalizer;
    this.cache = opts.cache;
    this.namespace = opts.namespace ?? null;
    this.toolTextConfig = opts.toolTextConfig ?? DEFAULT_TOOL_TEXT_CONFIG;
    this.reranker = opts.reranker ?? null;
    this.rerankingConfig = opts.rerankingConfig ?? null;
    this.sessionCfg = opts.sessionCfg ?? DEFAULT_SESSION_CONFIG;
  }

  private ensureSessionCache(): void {
    if (!this.sessionCache && this.sessionCfg.enabled) {
      this.sessionCache = new SessionCache(this.sessionCfg);
    }
  }

  /**
   * Normalize tools, embed them, and upsert into backend.
   *
   * When the embedder has a fit() method (e.g. TF-IDF), vocabulary is rebuilt
   * from the full corpus on every call. This invalidates the embedding cache,
   * so all tools are re-embedded. For fixed-dimension embedders (e.g. HTTP),
   * cached vectors are reused when fingerprints haven't changed.
   */
  upsertTools(tools: unknown[]): void {
    const canonical = this.normalizer.normalize(tools);
    if (canonical.length === 0) return;

    const allTexts = canonical.map(t => renderToolText(t, this.toolTextConfig));

    if (this.embedder.fit) {
      this.embedder.fit(allTexts);
      this.cache.clear();
    }

    const toEmbed: Array<{ idx: number; tool: CanonicalTool }> = [];
    const toEmbedTexts: string[] = [];

    for (let i = 0; i < canonical.length; i++) {
      if (this.cache.get(canonical[i].fingerprint) === undefined) {
        toEmbed.push({ idx: i, tool: canonical[i] });
        toEmbedTexts.push(allTexts[i]);
      }
    }

    if (toEmbed.length > 0) {
      const vecs = this.embedder.embedTexts(toEmbedTexts);
      for (let j = 0; j < toEmbed.length; j++) {
        this.cache.put(toEmbed[j].tool.fingerprint, vecs[j]);
      }
    }

    const ids: string[] = [];
    const vectors: number[][] = [];
    const payloads: CanonicalTool[] = [];

    for (const t of canonical) {
      const vec = this.cache.get(t.fingerprint);
      if (!vec) {
        throw new Error('Missing vector in cache after embedding step.');
      }
      ids.push(t.fingerprint.value);
      vectors.push(vec);
      payloads.push(t);
    }

    const dim = vectors[0].length;
    this.backend.ensureNamespace(this.namespace, dim);
    this.backend.upsert(ids, vectors, payloads, this.namespace);
  }

  deleteTools(fingerprints: ToolFingerprint[]): void {
    const ids = fingerprints.map(fp => fp.value);
    if (ids.length > 0) {
      this.backend.delete(ids, this.namespace);
    }
  }

  filter(messages: unknown, options?: FilterOptions): unknown[] {
    const [tools] = this.filterWithTrace(messages, options);
    return tools;
  }

  filterWithTrace(
    messages: unknown,
    options?: FilterOptions,
  ): [unknown[], ToolScopeTrace] {
    const k = options?.k ?? 12;
    const allowTagsInput = options?.allowTags;
    const denyTagsInput = options?.denyTags;
    const sessionId = options?.sessionId;
    const turnId = options?.turnId;
    const traceSink = options?.traceSink;

    const trace = createTrace(sessionId, turnId);
    const totalSw = new Stopwatch();

    const queryText = messagesToQueryText(messages);
    const qSw = new Stopwatch();
    const qvec = this.embedder.embedTexts([queryText])[0];
    trace.msEmbedQuery = qSw.ms();

    const allow = tagSet(allowTagsInput);
    const deny = tagSet(denyTagsInput);
    if (allow) trace.allowTags = [...allow].sort((a, b) => a.localeCompare(b));
    if (deny) trace.denyTags = [...deny].sort((a, b) => a.localeCompare(b));

    // ---- Session-aware state lookup ----
    let state:
      | { lastQueryVec: number[]; lastSelectedIds: string[] }
      | undefined;
    let refreshMode = false;

    if (sessionId && this.sessionCfg.enabled) {
      this.ensureSessionCache();
      state = this.sessionCache!.get(sessionId);
      if (state) {
        const sim = cosine(qvec, state.lastQueryVec);
        trace.querySimilarityToPrev = sim;

        if (sim >= this.sessionCfg.similarityThresholdReuse) {
          trace.mode = 'reuse';
          let prevTools = this.backend.get(
            state.lastSelectedIds,
            this.namespace,
          );

          const fSw = new Stopwatch();
          if (allow !== null || deny !== null) {
            prevTools = prevTools.filter(t => passesTagFilters(t, allow, deny));
          }
          trace.msFilter += fSw.ms();

          if (prevTools.length > 0) {
            prevTools = prevTools.slice(0, k);
            trace.returnedTools = prevTools.length;
            trace.candidatesAfterFilters = prevTools.length;

            const selectedIds = prevTools.map(t => t.fingerprint.value);
            this.sessionCache!.put(sessionId, qvec, selectedIds);

            const toolsOut = this.normalizer.denormalize(prevTools);
            trace.approxCharsAfter = toolsOut.reduce<number>(
              (sum, t) =>
                sum +
                (typeof t === 'object' && t !== null
                  ? JSON.stringify(t)
                  : String(t)
                ).length,
              0,
            );
            trace.msTotal = totalSw.ms();
            traceSink?.emit(trace);
            return [toolsOut, trace];
          }
        }

        refreshMode = sim >= this.sessionCfg.similarityThresholdRefresh;
        trace.mode = refreshMode ? 'refresh' : 'fresh';
      }
    }

    // ---- Determine initial retrieval pool ----
    const activeCfg = options?.reranking ?? this.rerankingConfig;
    let activeReranker = this.reranker;
    if (options?.reranking) {
      activeReranker = makeReranker(options.reranking);
    }

    let poolSize = k;
    if (activeCfg && activeReranker) {
      poolSize = Math.max(poolSize, activeCfg.poolSize);
    }
    if (allow !== null || deny !== null) {
      poolSize = Math.max(poolSize, Math.min(200, k * 8));
    }
    if (refreshMode) {
      poolSize = Math.max(poolSize, Math.min(200, k * 8));
    }
    trace.retrievedCandidates = poolSize;

    // ---- Backend search ----
    const backendFilter: Record<string, unknown> = {
      ...(options?.filter ?? {}),
    };
    if (allow)
      backendFilter.allow_tags = [...allow].sort((a, b) => a.localeCompare(b));
    if (deny)
      backendFilter.deny_tags = [...deny].sort((a, b) => a.localeCompare(b));

    const sSw = new Stopwatch();
    const hits = this.backend.search(
      qvec,
      poolSize,
      this.namespace,
      Object.keys(backendFilter).length > 0 ? backendFilter : undefined,
    );
    trace.msSearch = sSw.ms();

    if (hits.length === 0) {
      trace.msTotal = totalSw.ms();
      if (sessionId && this.sessionCfg.enabled) {
        this.ensureSessionCache();
        this.sessionCache!.put(sessionId, qvec, []);
      }
      traceSink?.emit(trace);
      return [[], trace];
    }

    const hitIds = hits.map(([id]) => id);
    const hitScore = new Map(hits.map(([id, sc]) => [id, sc]));

    // ---- Fetch ----
    const fSw = new Stopwatch();
    const fetched = this.backend.get(hitIds, this.namespace);
    trace.msFetch = fSw.ms();

    // ---- Order by vector rank ----
    const byId = new Map(fetched.map(t => [t.fingerprint.value, t]));
    let candidates: CanonicalTool[] = hitIds
      .map(id => byId.get(id))
      .filter((t): t is CanonicalTool => t !== undefined);
    if (candidates.length === 0 && fetched.length > 0) {
      candidates = [...fetched];
    }

    trace.candidates = candidates.slice(0, 50).map(t => ({
      toolId: t.fingerprint.value,
      toolName: t.name,
      vectorScore: hitScore.get(t.fingerprint.value),
      passedFilters: true,
      filterReasons: [],
    }));

    // ---- Apply allow/deny tag filters ----
    const filtSw = new Stopwatch();
    if (allow !== null || deny !== null) {
      const kept: CanonicalTool[] = [];
      const keptSet = new Set<string>();

      for (const t of candidates) {
        if (passesTagFilters(t, allow, deny)) {
          kept.push(t);
          keptSet.add(t.fingerprint.value);
        }
      }

      for (const cs of trace.candidates) {
        if (!keptSet.has(cs.toolId)) {
          cs.passedFilters = false;
          const reasons: string[] = [];
          if (deny) reasons.push('deny_tags');
          if (allow) reasons.push('allow_tags');
          cs.filterReasons = reasons;
        }
      }

      candidates = kept;
    }
    trace.msFilter = filtSw.ms();
    trace.candidatesAfterFilters = candidates.length;

    // ---- Stickiness (refresh mode) ----
    if (state && refreshMode && candidates.length > 0) {
      const prevSet = new Set(state.lastSelectedIds);

      candidates = [...candidates].sort((a, b) => {
        const aBoost = prevSet.has(a.fingerprint.value)
          ? this.sessionCfg.stickyBoost
          : 0;
        const bBoost = prevSet.has(b.fingerprint.value)
          ? this.sessionCfg.stickyBoost
          : 0;
        return bBoost - aBoost;
      });

      if (this.sessionCfg.stickyKeep > 0 && state.lastSelectedIds.length > 0) {
        let prevTools = this.backend.get(state.lastSelectedIds, this.namespace);
        if (allow !== null || deny !== null) {
          prevTools = prevTools.filter(t => passesTagFilters(t, allow, deny));
        }

        const existing = new Set(candidates.map(t => t.fingerprint.value));
        let added = 0;
        for (const pt of prevTools) {
          if (!existing.has(pt.fingerprint.value)) {
            candidates.unshift(pt);
            existing.add(pt.fingerprint.value);
            added++;
          }
          if (added >= this.sessionCfg.stickyKeep) break;
        }
      }
    }

    // ---- Optional reranking ----
    if (activeCfg && activeReranker && candidates.length > 0) {
      const rSw = new Stopwatch();

      const qText = queryText.slice(0, activeCfg.maxQueryChars);
      const docs = candidates.map(t =>
        renderToolText(t, this.toolTextConfig).slice(0, activeCfg.maxDocChars),
      );
      const scores = activeReranker.score(qText, docs);

      trace.msRerank = rSw.ms();
      trace.candidatesReranked = candidates.length;

      const scored = candidates.map((t, i) => ({ tool: t, score: scores[i] }));
      scored.sort((a, b) => b.score - a.score);
      candidates = scored.slice(0, k).map(s => s.tool);

      const scoreMap = new Map(
        scored.map(s => [s.tool.fingerprint.value, s.score]),
      );
      for (const cs of trace.candidates) {
        const rs = scoreMap.get(cs.toolId);
        if (rs !== undefined) cs.rerankScore = rs;
      }
    } else {
      candidates = candidates.slice(0, k);
    }

    trace.returnedTools = candidates.length;

    // ---- Persist session state ----
    if (sessionId && this.sessionCfg.enabled) {
      this.ensureSessionCache();
      const selectedIds = candidates.map(t => t.fingerprint.value);
      this.sessionCache!.put(sessionId, qvec, selectedIds);
    }

    const toolsOut = this.normalizer.denormalize(candidates);
    trace.approxCharsAfter = toolsOut.reduce<number>(
      (sum, t) =>
        sum +
        (typeof t === 'object' && t !== null ? JSON.stringify(t) : String(t))
          .length,
      0,
    );

    trace.msTotal = totalSw.ms();
    traceSink?.emit(trace);

    return [toolsOut, trace];
  }
}

// ---- Factory ----

export interface MakeIndexOptions {
  tools: unknown[];
  backend?: ToolIndexBackend;
  embedder?: EmbeddingProvider;
  normalizer?: ToolNormalizer;
  namespace?: string | null;
  cache?: EmbeddingCache;
  toolTextConfig?: ToolTextConfig;
  reranking?: RerankingConfig;
  sessionCfg?: StickySessionConfig;
}

/**
 * Convenience constructor: creates a ToolIndex and immediately upserts tools.
 * 1:1 port of Python ToolScope's make_index().
 */
export function makeIndex(opts: MakeIndexOptions): ToolIndex {
  if (!opts.embedder) {
    throw new Error(
      'No embedder configured. Provide an embedder to makeIndex().',
    );
  }

  const resolvedReranker = makeReranker(opts.reranking);

  const idx = new ToolIndex({
    backend: opts.backend ?? new MemoryBackend(),
    embedder: opts.embedder,
    normalizer: opts.normalizer ?? new AutoToolNormalizer(),
    cache: opts.cache ?? new EmbeddingCache(),
    namespace: opts.namespace,
    toolTextConfig: opts.toolTextConfig,
    reranker: resolvedReranker,
    rerankingConfig: opts.reranking,
    sessionCfg: opts.sessionCfg,
  });

  idx.upsertTools(opts.tools);
  return idx;
}
