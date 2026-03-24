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
 * Scores (query, doc) pairs. Higher score = better.
 */
export interface Reranker {
  score(query: string, docs: string[]): number[];
}

/**
 * Provider-agnostic reranking configuration.
 * 1:1 port of Python ToolScope's RerankingConfig.
 */
export interface RerankingConfig {
  readonly provider: string;
  readonly model: string;

  /** Retrieve top-N from vector DB, rerank, return top-k. */
  readonly poolSize: number;
  readonly allowDownload: boolean;

  /** Truncation before reranker scoring. */
  readonly maxQueryChars: number;
  readonly maxDocChars: number;

  readonly extra?: Record<string, unknown>;
}

export const DEFAULT_RERANKING_CONFIG: Partial<RerankingConfig> = {
  poolSize: 50,
  allowDownload: false,
  maxQueryChars: 512,
  maxDocChars: 256,
};

/**
 * Resolve a Reranker from config. Currently no built-in neural implementations
 * in the TypeScript port (would require external ML dependencies).
 * Returns null if config is undefined.
 */
export function makeReranker(config?: RerankingConfig): Reranker | null {
  if (!config) return null;

  throw new Error(
    `No built-in reranker for provider "${config.provider}" in TypeScript. ` +
      'Provide a custom Reranker implementation via the reranker parameter.',
  );
}
