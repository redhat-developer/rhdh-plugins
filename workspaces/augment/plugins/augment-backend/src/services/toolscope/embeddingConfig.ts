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

import type { EmbeddingProvider } from './types';
import { TfIdfEmbedder } from './TfIdfEmbedder';
import { HttpEmbeddingProvider } from './HttpEmbedder';

/**
 * Provider-agnostic embedding configuration.
 * 1:1 port of Python ToolScope's EmbeddingConfig.
 */
export interface EmbeddingConfig {
  /**
   * Provider identifier:
   *  - "tfidf" (TypeScript-only, in-process)
   *  - "http" / "rest" (remote HTTP API)
   */
  readonly provider: string;

  /** Provider-specific model name (passed to HTTP endpoint). */
  readonly model?: string;

  /** HTTP endpoint URL (required for "http" provider). */
  readonly endpoint?: string;
  readonly headers?: Record<string, string>;
  readonly timeoutMs?: number;

  readonly extra?: Record<string, unknown>;
}

export class EmbeddingNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbeddingNotConfiguredError';
  }
}

/**
 * Resolve an EmbeddingProvider from EmbeddingConfig.
 * Only imports provider deps when that provider is selected.
 */
export function makeEmbedder(config?: EmbeddingConfig): EmbeddingProvider {
  if (!config) {
    throw new EmbeddingNotConfiguredError(
      'No embedding configured. Provide either:\n' +
        '  - embedder (custom EmbeddingProvider), or\n' +
        '  - embedding config with provider "tfidf" or "http"',
    );
  }

  const prov = config.provider.trim().toLowerCase();

  if (prov === 'tfidf' || prov === 'tf-idf') {
    return new TfIdfEmbedder();
  }

  if (prov === 'http' || prov === 'rest') {
    if (!config.endpoint) {
      throw new EmbeddingNotConfiguredError(
        'HTTP embedding provider requires endpoint in config.',
      );
    }
    return new HttpEmbeddingProvider({
      endpoint: config.endpoint,
      model: config.model,
      headers: config.headers,
      timeoutMs: config.timeoutMs,
    });
  }

  throw new EmbeddingNotConfiguredError(
    `Unknown embedding provider: "${config.provider}"`,
  );
}
