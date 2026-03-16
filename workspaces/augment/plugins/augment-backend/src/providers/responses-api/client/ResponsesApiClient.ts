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
import FormDataNode from 'form-data';
import type { ResponsesApiClientConfig } from '../types';
import {
  API_REQUEST_TIMEOUT_MS,
  STREAM_REQUEST_TIMEOUT_MS,
  MAX_API_RETRIES,
  RETRY_BASE_DELAY_MS,
} from '../../../constants';
import { toErrorMessage } from '../../../services/utils';
import type { LoggerService } from '@backstage/backend-plugin-api';

/**
 * Structured error for Responses API failures.
 * Preserves status code and parsed detail for actionable error handling.
 */
export class ResponsesApiError extends Error {
  readonly statusCode: number;
  readonly detail: string;
  readonly rawBody: string;

  constructor(statusCode: number, statusMessage: string, rawBody: string) {
    const detail = ResponsesApiError.extractDetail(rawBody);
    super(`Responses API error: ${statusCode} ${statusMessage} - ${detail}`);
    Object.setPrototypeOf(this, ResponsesApiError.prototype);
    this.name = 'ResponsesApiError';
    this.statusCode = statusCode;
    this.detail = detail;
    this.rawBody = rawBody;
  }

  isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }

  mentionsToolType(): boolean {
    const combined = `${this.detail} ${this.rawBody}`;
    return /unsupported.*tool|tool.*type.*unsupported|function.*tool|unknown.*tool/i.test(
      combined,
    );
  }

  mentionsStrictField(): boolean {
    const combined = `${this.detail} ${this.rawBody}`;
    return (
      /\bstrict\b.*\b(field|param|key|property|schema|valid)/i.test(combined) ||
      /\b(field|param|key|property|unexpected|extra|unknown)\b.*\bstrict\b/i.test(
        combined,
      )
    );
  }

  /**
   * Detect context window overflow errors from vLLM / inference backends.
   * These manifest as "max_tokens must be at least 1, got -N" or similar.
   */
  isContextOverflowError(): boolean {
    const combined = `${this.detail} ${this.rawBody}`;
    return (
      this.statusCode === 400 &&
      /max_tokens\s+must\s+be\s+at\s+least\s+1,\s+got\s+-?\d+/i.test(combined)
    );
  }

  private static extractDetail(rawBody: string): string {
    try {
      const parsed = JSON.parse(rawBody);
      if (typeof parsed.detail === 'string') return parsed.detail;
      if (Array.isArray(parsed.detail)) {
        return parsed.detail
          .map((d: { msg?: string; loc?: unknown[] }) =>
            d.msg
              ? `${d.msg}${d.loc ? ` at ${JSON.stringify(d.loc)}` : ''}`
              : JSON.stringify(d),
          )
          .join('; ');
      }
      if (typeof parsed.error === 'string') return parsed.error;
      if (typeof parsed.message === 'string') return parsed.message;
    } catch {
      // Not JSON
    }
    return rawBody.length > 300 ? `${rawBody.substring(0, 300)}...` : rawBody;
  }
}

/**
 * Request options for Responses API calls
 */
export interface ResponsesApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * HTTP client for any server implementing the OpenAI Responses API.
 *
 * Handles all HTTP communication including:
 * - Standard JSON requests
 * - FormData uploads (multipart/form-data)
 * - Streaming SSE responses
 * - TLS certificate verification (configurable)
 */
export class ResponsesApiClient {
  private readonly config: ResponsesApiClientConfig;
  private readonly agent: http.Agent | https.Agent;
  private readonly logger?: LoggerService;

  constructor(config: ResponsesApiClientConfig, logger?: LoggerService) {
    this.config = config;
    this.logger = logger;
    const isHttps = config.baseUrl.startsWith('https');
    this.agent = isHttps
      ? new https.Agent({
          keepAlive: true,
          maxSockets: 10,
          rejectUnauthorized: !config.skipTlsVerify,
        })
      : new http.Agent({ keepAlive: true, maxSockets: 10 });
  }

  /**
   * Get the current configuration
   */
  getConfig(): ResponsesApiClientConfig {
    return this.config;
  }

  /**
   * Make an API request using https module
   * Handles self-signed/untrusted certificates common in enterprise environments
   */
  async request<T>(
    endpoint: string,
    options: ResponsesApiRequestOptions = {},
  ): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`;
    }

    // Check if body is FormDataNode (for file uploads)
    const isFormData = options.body instanceof FormDataNode;

    // Only set Content-Type for requests with a body (POST, PUT, PATCH)
    // For FormData, the form-data package will set the correct Content-Type with boundary
    if (options.body && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return new Promise<T>((resolve, reject) => {
      const formDataBody: FormDataNode | null = isFormData
        ? (options.body as FormDataNode)
        : null;

      const isHttps = url.protocol === 'https:';
      const mergedHeaders = formDataBody
        ? { ...headers, ...formDataBody.getHeaders() }
        : headers;

      // Many servers (including LlamaStack/FastAPI) reject chunked
      // Transfer-Encoding on file uploads. Compute Content-Length upfront
      // so the request is sent as a single fixed-length payload.
      if (formDataBody) {
        try {
          mergedHeaders['content-length'] = String(
            formDataBody.getLengthSync(),
          );
        } catch {
          // getLengthSync throws if any stream sources are present;
          // fall back to chunked encoding in that edge case.
        }
      }

      const reqOptions: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: mergedHeaders,
        agent: this.agent,
      };

      const transport = isHttps ? https : http;
      const req = transport.request(reqOptions, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data) as T);
            } catch {
              reject(
                new Error(
                  `Failed to parse response: ${data.substring(0, 200)}`,
                ),
              );
            }
          } else {
            reject(
              new ResponsesApiError(
                res.statusCode!,
                res.statusMessage || '',
                data,
              ),
            );
          }
        });
      });

      req.setTimeout(API_REQUEST_TIMEOUT_MS, () => {
        req.destroy();
        reject(
          new Error(
            `Responses API request timed out after ${
              API_REQUEST_TIMEOUT_MS / 1000
            } seconds`,
          ),
        );
      });

      req.on('error', e => {
        reject(new Error(`Responses API connection error: ${e.message}`));
      });

      if (options.body) {
        if (formDataBody) {
          const buf = formDataBody.getBuffer();
          req.write(buf);
          req.end();
        } else {
          const bodyStr =
            typeof options.body === 'string'
              ? options.body
              : JSON.stringify(options.body);
          req.write(bodyStr);
          req.end();
        }
      } else {
        req.end();
      }
    });
  }

  /**
   * Retry wrapper around request() for transient failures.
   * Does NOT retry streaming requests (they are not idempotent).
   */
  async requestWithRetry<T>(
    endpoint: string,
    options: ResponsesApiRequestOptions = {},
    maxRetries = MAX_API_RETRIES,
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (error) {
        lastError = error as Error;
        if (!this.isRetryable(error) || attempt === maxRetries) throw lastError;
        const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, 4000);
        this.logger?.info(
          `[ResponsesApiClient] Retrying ${endpoint} after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastError ?? new Error('Request failed after retries');
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof ResponsesApiError) {
      return [502, 503, 504].includes(error.statusCode);
    }
    if (error instanceof Error) {
      return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up/i.test(
        error.message,
      );
    }
    return false;
  }

  /**
   * Make a streaming request (for SSE responses)
   * Uses https module for consistent TLS verification with skipTlsVerify config
   *
   * @param endpoint - API endpoint path
   * @param body - Request body (will be JSON serialized)
   * @param onData - Callback for each SSE data event
   */
  async streamRequest(
    endpoint: string,
    body: unknown,
    onData: (data: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`;
    }

    const bodyStr = JSON.stringify(body);

    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('Stream aborted before request started'));
        return;
      }

      const isHttps = url.protocol === 'https:';
      const reqOptions: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(bodyStr),
        },
        agent: this.agent,
      };

      const transport = isHttps ? https : http;
      const req = transport.request(reqOptions, res => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          let errorData = '';
          res.on('data', chunk => {
            errorData += chunk;
          });
          res.on('end', () => {
            reject(
              new ResponsesApiError(
                res.statusCode!,
                `Streaming request failed`,
                errorData,
              ),
            );
          });
          return;
        }

        let buffer = '';

        res.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data && data !== '[DONE]') {
                onData(data);
              }
            }
          }
        });

        res.on('end', () => {
          if (buffer.startsWith('data: ')) {
            const data = buffer.slice(6).trim();
            if (data && data !== '[DONE]') {
              onData(data);
            }
          }
          resolve();
        });

        res.on('error', e => {
          reject(new Error(`Streaming response error: ${e.message}`));
        });
      });

      if (signal) {
        const onAbort = () => {
          req.destroy();
          reject(new Error('Stream aborted by client'));
        };
        signal.addEventListener('abort', onAbort, { once: true });
        req.on('close', () => signal.removeEventListener('abort', onAbort));
      }

      req.setTimeout(STREAM_REQUEST_TIMEOUT_MS, () => {
        req.destroy();
        reject(
          new Error(
            `Streaming request timed out after ${
              STREAM_REQUEST_TIMEOUT_MS / 1000
            } seconds`,
          ),
        );
      });

      req.on('error', e => {
        reject(
          new Error(`Responses API streaming connection error: ${e.message}`),
        );
      });

      req.write(bodyStr);
      req.end();
    });
  }

  /**
   * Test connection by making a simple request
   */
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      // Try to list models as a simple connectivity check
      await this.request<{ data: unknown[] }>('/v1/models', {
        method: 'GET',
      });
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: toErrorMessage(error),
      };
    }
  }
}

/** @deprecated Use ResponsesApiError instead */
export const LlamaStackApiError = ResponsesApiError;
