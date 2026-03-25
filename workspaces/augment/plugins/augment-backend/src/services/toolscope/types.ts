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

// ---- JSON utility type ----

export type Json = Record<string, unknown>;

// ---- Core value types (mirrors Python ToolScope core/types.py) ----

/**
 * Stable identifier for a specific version of a tool definition.
 * Used as primary key in vector backends.
 * Changes when the tool meaningfully changes (name, description, schema, tags).
 */
export interface ToolFingerprint {
  readonly value: string;
}

/**
 * Canonical internal representation of a tool.
 * payload: the original tool spec provided by the user (e.g. OpenAI tool dict,
 * MCP tool descriptor). Returned verbatim to the model after filtering.
 */
export interface CanonicalTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Json;
  readonly fingerprint: ToolFingerprint;
  readonly tags: readonly string[];
  readonly payload?: unknown;
}

// ---- Protocols (mirrors Python ToolScope core/types.py) ----

/** Produces dense vectors from text. */
export interface EmbeddingProvider {
  embedTexts(texts: string[]): number[][];
  /** Build vocabulary / warm up the model from a corpus. TF-IDF requires this. */
  fit?(corpus: string[]): void;
}

/** Converts tool specs to/from CanonicalTool. */
export interface ToolNormalizer {
  normalize(tools: unknown[]): CanonicalTool[];
  denormalize(canonical: CanonicalTool[]): unknown[];
}

/**
 * Vector index backend interface.
 * Mirrors common vector DB APIs (Milvus, Qdrant, Pinecone).
 * All backends MUST treat ToolFingerprint.value as the primary key.
 */
export interface ToolIndexBackend {
  /** Create collection/namespace if needed. May be a no-op for simple backends. */
  ensureNamespace(namespace: string | null, dim: number): void;

  /** Insert or update records. */
  upsert(
    ids: string[],
    vectors: number[][],
    payloads: CanonicalTool[],
    namespace?: string | null,
  ): void;

  /** Remove records by id. */
  delete(ids: string[], namespace?: string | null): void;

  /** Return top-k (id, score) pairs. Score must be higher-is-better. */
  search(
    queryVector: number[],
    k: number,
    namespace?: string | null,
    filter?: Json,
  ): Array<[string, number]>;

  /** Fetch CanonicalTool records by id. */
  get(ids: string[], namespace?: string | null): CanonicalTool[];
}

// ---- Augment integration types (not in Python ToolScope) ----

/** A tool with its server context -- provider-agnostic. */
export interface ToolDescriptor {
  /** Unique identifier of the MCP server that exposes this tool */
  serverId: string;
  /** Tool name as registered in the MCP server */
  name: string;
  /** Human-readable description used for semantic embedding */
  description: string;
}

/** Result of a tool scoping operation, including per-tool scores. */
export interface ToolScopeResult {
  /** serverId -> list of allowed tool names */
  scopedTools: Map<string, string[]>;
  /** All scored results from the index search, sorted descending */
  scores: Array<{ serverId: string; name: string; score: number }>;
  /** How long the filterTools call took in ms */
  durationMs: number;
}

/** The scoping service interface consumed by providers. */
export interface ToolScopeService {
  updateIndex(tools: ToolDescriptor[]): void;
  filterTools(
    query: string,
    k: number,
    adminAllowedTools?: Map<string, string[]>,
    minScore?: number,
  ): ToolScopeResult;
}
