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
  MAX_API_RETRIES,
  RETRY_BASE_DELAY_MS,
} from '../../../constants';
import { toErrorMessage } from '../../../services/utils';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { streamRequest } from './streamRequest';

export { ResponsesApiError, LlamaStackApiError } from './ResponsesApiError';
export type { ResponsesApiRequestOptions } from './ResponsesApiError';
import { ResponsesApiError } from './ResponsesApiError';
import type { ResponsesApiRequestOptions } from './ResponsesApiError';

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

  getConfig(): ResponsesApiClientConfig {
    return this.config;
  }

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

    const isFormData = options.body instanceof FormDataNode;

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

      if (formDataBody) {
        try {
          mergedHeaders['content-length'] = String(
            formDataBody.getLengthSync(),
          );
        } catch {
          // fall back to chunked encoding
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

  async streamRequest(
    endpoint: string,
    body: unknown,
    onData: (data: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return streamRequest(
      this.config.baseUrl,
      this.config.token,
      this.agent,
      endpoint,
      body,
      onData,
      signal,
    );
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
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
