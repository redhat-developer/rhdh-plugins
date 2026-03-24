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
 * Per-tool scoring details in a trace.
 */
export interface ToolScore {
  toolId: string;
  toolName: string;
  vectorScore?: number;
  rerankScore?: number;
  passedFilters: boolean;
  filterReasons: readonly string[];
}

/**
 * Full trace of a single filter operation.
 * 1:1 port of Python ToolScope's ToolScopeTrace.
 */
export interface ToolScopeTrace {
  // Identity
  sessionId?: string;
  turnId?: string;

  // High-level mode
  mode: 'fresh' | 'reuse' | 'refresh';
  querySimilarityToPrev?: number;

  // Counts
  inputToolCount?: number;
  indexedToolCount?: number;
  retrievedCandidates: number;
  candidatesAfterFilters: number;
  candidatesReranked: number;
  returnedTools: number;

  // Tag filters
  allowTags: readonly string[];
  denyTags: readonly string[];

  // Token-ish hints (rough but useful)
  approxCharsBefore?: number;
  approxCharsAfter?: number;

  // Timing (ms)
  msEmbedQuery: number;
  msSearch: number;
  msFetch: number;
  msFilter: number;
  msRerank: number;
  msTotal: number;

  // Why selected (top candidates + returned)
  candidates: ToolScore[];

  // Free-form metadata for callers
  extra: Record<string, unknown>;
}

/** Creates a fresh trace with default values. */
export function createTrace(
  sessionId?: string,
  turnId?: string,
): ToolScopeTrace {
  return {
    sessionId,
    turnId,
    mode: 'fresh',
    retrievedCandidates: 0,
    candidatesAfterFilters: 0,
    candidatesReranked: 0,
    returnedTools: 0,
    allowTags: [],
    denyTags: [],
    msEmbedQuery: 0,
    msSearch: 0,
    msFetch: 0,
    msFilter: 0,
    msRerank: 0,
    msTotal: 0,
    candidates: [],
    extra: {},
  };
}

/**
 * Receives completed traces. Implement to:
 * - log JSON
 * - send to metrics/OTel
 * - write to a file
 */
export interface TraceSink {
  emit(trace: ToolScopeTrace): void;
}

/**
 * Precision timer for per-phase measurement.
 */
export class Stopwatch {
  private readonly t0: number;

  constructor() {
    // eslint-disable-next-line no-restricted-globals
    this.t0 = performance.now();
  }

  ms(): number {
    // eslint-disable-next-line no-restricted-globals
    return performance.now() - this.t0;
  }
}
