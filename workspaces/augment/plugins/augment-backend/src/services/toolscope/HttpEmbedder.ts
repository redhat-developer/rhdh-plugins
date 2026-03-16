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

/**
 * Embedding provider that calls an HTTP embedding service.
 * 1:1 port of Python ToolScope's HttpEmbeddingProvider.
 *
 * Contract:
 *   POST {endpoint}
 *   Body: {"texts": ["...", "..."], "model": "..."}  (model optional)
 *   Response: {"vectors": [[...], [...]]}
 */
export class HttpEmbeddingProvider implements EmbeddingProvider {
  private readonly endpoint: string;
  private readonly model?: string;
  private readonly headers?: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(opts: {
    endpoint: string;
    model?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
  }) {
    this.endpoint = opts.endpoint;
    this.model = opts.model;
    this.headers = opts.headers;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
  }

  embedTexts(_texts: string[]): number[][] {
    /* istanbul ignore next -- async in sync wrapper */
    throw new Error(
      'HttpEmbeddingProvider.embedTexts() is async-only. ' +
        'Use embedTextsAsync() or call via an async wrapper.',
    );
  }

  async embedTextsAsync(texts: string[]): Promise<number[][]> {
    const payload: Record<string, unknown> = { texts };
    if (this.model) payload.model = this.model;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const resp = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.headers ?? {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!resp.ok) {
        throw new Error(
          `HTTP embedder request failed: ${resp.status} ${resp.statusText}`,
        );
      }

      const data = (await resp.json()) as { vectors?: number[][] };
      if (!Array.isArray(data.vectors) || data.vectors.length === 0) {
        throw new Error(
          "HTTP embedder returned no vectors (expected JSON key 'vectors').",
        );
      }
      return data.vectors;
    } finally {
      clearTimeout(timer);
    }
  }
}
