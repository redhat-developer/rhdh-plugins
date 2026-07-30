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

import * as http from 'http';
import * as https from 'https';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { KeycloakTokenManager } from './KeycloakTokenManager';

export const KAGENTI_API_TIMEOUT_MS = 30_000;
export const KAGENTI_STREAM_TIMEOUT_MS = 300_000;

const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

export interface RequestCoreContext {
  baseUrl: string;
  isHttps: boolean;
  httpAgent: http.Agent | https.Agent;
  tokenManager: KeycloakTokenManager;
  logger: LoggerService;
  requestTimeoutMs: number;
  streamTimeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  getUserRef: () => string | undefined;
}

export async function doRequest<T>(
  ctx: RequestCoreContext,
  method: string,
  path: string,
  body?: unknown,
  skipAuth = false,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (!skipAuth) {
    const token = await ctx.tokenManager.getToken();
    headers.Authorization = `Bearer ${token}`;
  }
  const userRef = ctx.getUserRef();
  if (userRef) headers['X-Backstage-User'] = userRef;
  let payload: string | undefined;
  if (body !== undefined) {
    payload = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = String(Buffer.byteLength(payload));
  }
  const url = new URL(`${ctx.baseUrl}${path}`);
  const transport = ctx.isHttps ? https : http;

  return new Promise<T>((resolve, reject) => {
    const req = transport.request(
      {
        method,
        hostname: url.hostname,
        port: url.port || (ctx.isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers,
        agent: ctx.httpAgent,
        timeout: ctx.requestTimeoutMs,
      },
      res => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('error', err => reject(err));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          if (!res.statusCode || res.statusCode >= 400) {
            let detail = '';
            try {
              const p = JSON.parse(raw);
              detail = p.detail || p.message || '';
            } catch {
              /* */
            }
            reject(
              new Error(
                `Kagenti API error: ${method} ${path} status ${res.statusCode}${detail ? ` - ${detail}` : ''}`,
              ),
            );
            return;
          }
          if (res.statusCode >= 300 && res.statusCode < 400) {
            reject(
              new Error(
                `Kagenti API error: ${method} ${path} unexpected redirect status ${res.statusCode}`,
              ),
            );
            return;
          }
          if (res.statusCode === 204 || !raw.trim()) {
            resolve({} as T);
            return;
          }
          try {
            resolve(JSON.parse(raw) as T);
          } catch {
            reject(new Error(`Failed to parse Kagenti response from ${path}`));
          }
        });
      },
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Kagenti API timeout: ${method} ${path}`));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export async function requestWithRetry<T>(
  ctx: RequestCoreContext,
  method: string,
  path: string,
  body?: unknown,
  skipAuth = false,
  retries?: number,
): Promise<T> {
  const maxAttempts = retries ?? ctx.maxRetries;
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      return await doRequest<T>(ctx, method, path, body, skipAuth);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const statusMatch = lastError.message.match(/status (\d+)/);
      const status = statusMatch ? Number(statusMatch[1]) : 0;
      if (status === 401 && attempt === 0) {
        ctx.tokenManager.clearCache();
        ctx.logger.warn(
          `Got 401, cleared token cache and retrying ${method} ${path}`,
        );
        continue;
      }
      const isNetworkError =
        status === 0 &&
        /ECONNRESET|ECONNREFUSED|EPIPE|ETIMEDOUT|EAI_AGAIN/i.test(
          lastError.message,
        );
      if (
        (!RETRYABLE_STATUS_CODES.has(status) && !isNetworkError) ||
        attempt === maxAttempts
      )
        throw lastError;
      const delay = ctx.retryBaseDelayMs * Math.pow(2, attempt);
      ctx.logger.warn(
        `Retrying ${method} ${path} after ${status} (attempt ${attempt + 1} of ${maxAttempts + 1}, delay ${delay}ms)`,
      );
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError ?? new Error(`Request failed after ${maxAttempts} attempts`);
}

export async function streamRequest(
  ctx: RequestCoreContext,
  path: string,
  body: unknown,
  onLine: (line: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = await ctx.tokenManager.getTokenForStreaming(
    ctx.streamTimeoutMs || 300_000,
  );
  const url = new URL(`${ctx.baseUrl}${path}`);
  const transport = ctx.isHttps ? https : http;
  const payload = JSON.stringify(body);
  const userRef = ctx.getUserRef();

  return new Promise<void>((resolve, reject) => {
    let cleanupAbort = () => {};
    const req = transport.request(
      {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || (ctx.isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(Buffer.byteLength(payload)),
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
          ...(userRef && { 'X-Backstage-User': userRef }),
        },
        agent: ctx.httpAgent,
        timeout: ctx.streamTimeoutMs || 0,
      },
      res => {
        if (!res.statusCode || res.statusCode >= 300) {
          const errChunks: Buffer[] = [];
          res.on('data', (c: Buffer) => errChunks.push(c));
          res.on('end', () => {
            const raw = Buffer.concat(errChunks).toString('utf-8');
            let detail = '';
            try {
              const p = JSON.parse(raw);
              detail = p.detail || p.message || '';
            } catch {
              /* */
            }
            reject(
              new Error(
                `Kagenti stream request failed: status ${res.statusCode}${detail ? ` - ${detail}` : ''}`,
              ),
            );
          });
          return;
        }
        let buffer = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk: string) => {
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.substring(6);
              if (data !== '[DONE]') onLine(data);
            }
          }
        });
        res.on('end', () => {
          if (buffer.trim().startsWith('data: ')) {
            const data = buffer.trim().substring(6);
            if (data !== '[DONE]') onLine(data);
          }
          cleanupAbort();
          resolve();
        });
        res.on('error', err => {
          cleanupAbort();
          reject(err);
        });
      },
    );
    req.on('error', err => {
      cleanupAbort();
      reject(
        new Error(
          `Kagenti stream connection error to ${url.href}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    });
    req.on('timeout', () => {
      req.destroy();
      cleanupAbort();
      reject(
        new Error(
          `Kagenti stream request timed out after ${ctx.streamTimeoutMs}ms to ${url.href}`,
        ),
      );
    });
    if (signal) {
      const onAbort = () => {
        req.destroy();
        reject(new Error('Stream aborted by client'));
      };
      if (signal.aborted) {
        req.destroy();
        reject(new Error('Stream aborted by client'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
      cleanupAbort = () => signal.removeEventListener('abort', onAbort);
    }
    req.write(payload);
    req.end();
  });
}
