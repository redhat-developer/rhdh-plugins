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

// ---- Main API (1:1 with Python ToolScope __init__.py) ----

export {
  filterTools as filter,
  filterToolsWithTrace as filterWithTrace,
} from './filter';
export { makeIndex as index } from './ToolIndex';
export { ToolIndex } from './ToolIndex';
export type { FilterOptions, MakeIndexOptions } from './ToolIndex';

// ---- Core types ----

export type {
  Json,
  CanonicalTool,
  ToolFingerprint,
  EmbeddingProvider,
  ToolNormalizer,
  ToolIndexBackend,
} from './types';

// ---- Fingerprinting ----

export { stableJson, fingerprintTool } from './fingerprint';

// ---- Configs ----

export type { EmbeddingConfig } from './embeddingConfig';
export { EmbeddingNotConfiguredError, makeEmbedder } from './embeddingConfig';
export type { RerankingConfig, Reranker } from './rerankers';
export { makeReranker } from './rerankers';
export type { StickySessionConfig, SessionState } from './session';
export { SessionCache, DEFAULT_SESSION_CONFIG } from './session';
export type { ToolTextConfig, ToolTextField, ToolPreprocessor } from './text';
export {
  DEFAULT_TOOL_TEXT_CONFIG,
  renderToolText,
  lowercase,
  collapseWhitespace,
  normalizeUnicode,
  stripControlChars,
} from './text';

// ---- Normalizers ----

export {
  AutoToolNormalizer,
  McpToolNormalizer,
  OpenAIToolNormalizer,
} from './normalize';

// ---- Backends ----

export { MemoryBackend } from './backends/memory';

// ---- Embedders ----

export { TfIdfEmbedder } from './TfIdfEmbedder';
export { HttpEmbeddingProvider } from './HttpEmbedder';

// ---- Observability ----

export type { ToolScopeTrace, ToolScore, TraceSink } from './observability';
export { createTrace, Stopwatch } from './observability';

// ---- Cache ----

export { EmbeddingCache } from './cache';

// ---- Augment integration exports ----

export type {
  ToolDescriptor,
  ToolScopeService,
  ToolScopeResult,
} from './types';
export { InMemoryToolIndex } from './InMemoryToolIndex';
export {
  ToolScopeFilterService,
  createToolScopeService,
} from './ToolScopeFilterService';
