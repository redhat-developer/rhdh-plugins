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

import type { NpxSourceConfig } from './types';

const REQUEST_TIMEOUT_MS = 30_000;
const INDEX_LIMIT = 5 * 1024 * 1024;
const ARTIFACT_LIMIT = 1024 * 1024;
const MAX_REDIRECTS = 5;

export function validateRequestUrl(url: URL): void {
  if (url.protocol !== 'https:') {
    throw new Error('Source URL must use HTTPS');
  }
  if (url.username || url.password) {
    throw new Error('Source URL must not contain credentials');
  }
  if (url.hash) {
    throw new Error('Source URL must not contain a fragment');
  }
}

export function validateAllowedOrigin(value: string): string {
  const url = new URL(value);
  validateRequestUrl(url);
  if (url.pathname !== '/' || url.search) {
    throw new Error('Allowed origin must not contain a path or query');
  }
  return url.origin;
}

/** Fetch an index or skill file with HTTPS, redirect, time, and size limits. */
export async function fetchSourceBuffer(
  url: string,
  source: Pick<NpxSourceConfig, 'indexUrl' | 'allowedOrigins'>,
  kind: 'index' | 'artifact',
  parentSignal?: AbortSignal,
): Promise<Buffer> {
  const limit = kind === 'index' ? INDEX_LIMIT : ARTIFACT_LIMIT;
  const origins = new Set([
    new URL(source.indexUrl).origin,
    ...(source.allowedOrigins ?? []),
  ]);
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = parentSignal
    ? AbortSignal.any([parentSignal, timeout])
    : timeout;
  let target = new URL(url);

  for (let redirects = 0; ; redirects++) {
    validateRequestUrl(target);
    if (!origins.has(target.origin)) {
      throw new Error('Source URL targets an unconfigured origin');
    }
    signal.throwIfAborted();
    const response = await fetch(target, { redirect: 'manual', signal });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      if (redirects === MAX_REDIRECTS) {
        throw new Error('Too many source redirects');
      }
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Source redirect has no Location');
      }
      target = new URL(location, target);
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Source request returned HTTP ${response.status}`);
    }
    const length = response.headers.get('content-length');
    if (length && Number(length) > limit) {
      await response.body?.cancel();
      throw new Error('Source response exceeds maximum size');
    }
    if (!response.body) {
      return Buffer.alloc(0);
    }

    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
          throw new Error('Source response exceeds maximum size');
        }
        chunks.push(Buffer.from(value));
      }
    } catch (error) {
      void reader.cancel().catch(() => undefined);
      throw error;
    } finally {
      reader.releaseLock();
    }
    return Buffer.concat(chunks, size);
  }
}
