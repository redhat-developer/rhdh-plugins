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
  EmbeddingProvider,
  ToolIndexBackend,
  ToolNormalizer,
} from './types';
import type { ToolTextConfig } from './text';
import type { RerankingConfig } from './rerankers';
import type { TraceSink, ToolScopeTrace } from './observability';
import type { EmbeddingConfig } from './embeddingConfig';
import { makeEmbedder } from './embeddingConfig';
import { makeIndex } from './ToolIndex';
import { AutoToolNormalizer } from './normalize';

/**
 * Options for one-shot filter functions.
 */
export interface FilterToolsOptions {
  k?: number;
  normalizer?: ToolNormalizer;
  backend?: ToolIndexBackend;
  namespace?: string | null;
  embedder?: EmbeddingProvider;
  embedding?: EmbeddingConfig;
  toolTextConfig?: ToolTextConfig;
  reranking?: RerankingConfig;
  allowTags?: readonly string[];
  denyTags?: readonly string[];
  traceSink?: TraceSink;
}

/**
 * One-shot filter: create an ephemeral index, upsert tools, filter by query.
 * 1:1 port of Python ToolScope's filter_tools().
 */
export function filterTools(
  messages: unknown,
  tools: unknown[],
  options?: FilterToolsOptions,
): unknown[] {
  const [result] = filterToolsWithTrace(messages, tools, options);
  return result;
}

/**
 * One-shot filter with trace: same as filterTools but returns the trace.
 * 1:1 port of Python ToolScope's filter_tools_with_trace().
 */
export function filterToolsWithTrace(
  messages: unknown,
  tools: unknown[],
  options?: FilterToolsOptions,
): [unknown[], ToolScopeTrace] {
  if (options?.embedder && options?.embedding) {
    throw new Error("Specify either 'embedder' or 'embedding', not both.");
  }

  const embedder = options?.embedder ?? makeEmbedder(options?.embedding);
  const norm = options?.normalizer ?? new AutoToolNormalizer();

  const idx = makeIndex({
    tools,
    normalizer: norm,
    backend: options?.backend,
    embedder,
    namespace: options?.namespace,
    toolTextConfig: options?.toolTextConfig,
    reranking: options?.reranking,
  });

  return idx.filterWithTrace(messages, {
    k: options?.k ?? 12,
    reranking: options?.reranking,
    allowTags: options?.allowTags,
    denyTags: options?.denyTags,
    traceSink: options?.traceSink,
  });
}
