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
import { DEFAULT_HTTP_TIMEOUT_MS } from '../../constants';
import { createTlsSkipFetch } from './mcpClient';

/**
 * Response-like interface returned by fetchWithTlsControl.
 * Compatible with both GET (DocumentIngestionService) and POST (McpAuthService) patterns.
 */
export interface TlsResponse {
  ok: boolean;
  status: number;
  headers?: Record<string, string>;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}

export interface FetchWithTlsControlOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  skipTlsVerify?: boolean;
  timeoutMs?: number;
  redirect?: RequestInit['redirect'];
}

function toTlsResponse(r: Response): TlsResponse {
  const responseHeaders: Record<string, string> = {};
  if (r.headers && typeof r.headers.forEach === 'function') {
    r.headers.forEach((v, k) => {
      responseHeaders[k] = v;
    });
  }
  return {
    ok: r.ok,
    status: r.status,
    headers: responseHeaders,
    text: () => r.text(),
    json: () => r.json() as Promise<unknown>,
  };
}

/**
 * Shared TLS-aware HTTP(S) fetch that returns a Response-like object.
 * Consolidates the identical `fetchWithTlsControl` implementations
 * previously duplicated across DocumentIngestionService, McpAuthService,
 * and StatusService.
 *
 * When `skipTlsVerify` is true and the URL is HTTPS, uses an undici
 * dispatcher that disables certificate verification (for self-signed
 * certs in dev/enterprise environments).  Otherwise delegates to
 * native `fetch` with full TLS verification.
 */
export function fetchWithTlsControl(
  url: string,
  options: FetchWithTlsControlOptions = {},
): Promise<TlsResponse> {
  const {
    method = 'GET',
    headers = {},
    body,
    skipTlsVerify = false,
    timeoutMs = DEFAULT_HTTP_TIMEOUT_MS,
    redirect,
  } = options;

  const fetchFn =
    skipTlsVerify && new URL(url).protocol === 'https:'
      ? createTlsSkipFetch()
      : fetch;

  const init: RequestInit = { method, headers };
  if (body) init.body = body;
  if (redirect) init.redirect = redirect;
  if (timeoutMs !== null && timeoutMs !== undefined && timeoutMs > 0) {
    init.signal = AbortSignal.timeout(timeoutMs);
  }

  return fetchFn(url, init).then(toTlsResponse);
}
