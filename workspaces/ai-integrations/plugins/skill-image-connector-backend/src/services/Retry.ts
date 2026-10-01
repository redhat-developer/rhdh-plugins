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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { SkillImageOptions } from './types';
import { MAX_TIMER_DELAY_MS } from './types';
import { HttpResponseError } from './HttpClient';

const TRANSIENT_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_SOCKET',
]);

/** Inspect wrapped fetch errors without relying on HTTP diagnostic wording. */
export function isTransientError(error: unknown): boolean {
  const pending = [error];
  const seen = new Set<unknown>();
  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    if (current instanceof HttpResponseError) {
      return current.status >= 500 && current.status < 600;
    }
    const detail = current as {
      name?: string;
      code?: string;
      message?: string;
      cause?: unknown;
      errors?: unknown[];
    };
    if (detail.name === 'AbortError') continue;
    if (
      detail.name === 'TimeoutError' ||
      TRANSIENT_CODES.has(detail.code ?? '') ||
      TRANSIENT_CODES.has(detail.message ?? '')
    )
      return true;
    pending.push(detail.cause);
    if (Array.isArray(detail.errors)) pending.push(...detail.errors);
  }
  return false;
}

/** Cancel retry backoff promptly, independently of an expired attempt timeout. */
export function abortAwareDelay(
  ms: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const state = {
      timer: undefined as ReturnType<typeof setTimeout> | undefined,
    };
    const onAbort = () => {
      clearTimeout(state.timer);
      reject(signal!.reason);
    };
    state.timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Retry one caller-defined operation; no retries are added below this boundary. */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Pick<SkillImageOptions, 'maxRetries' | 'retryBaseDelayMs'>,
  logger: LoggerService,
  context: string,
  signal?: AbortSignal,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await operation();
    } catch (error) {
      signal?.throwIfAborted();
      if (attempt >= options.maxRetries || !isTransientError(error))
        throw error;
      const delayMs = Math.min(
        options.retryBaseDelayMs * 2 ** attempt,
        MAX_TIMER_DELAY_MS,
      );
      logger.warn(
        `Transient failure fetching ${context} (attempt ${attempt + 1}/${
          options.maxRetries + 1
        }), retrying in ${delayMs}ms`,
        error as Error,
      );
      await abortAwareDelay(delayMs, signal);
    }
  }
}
