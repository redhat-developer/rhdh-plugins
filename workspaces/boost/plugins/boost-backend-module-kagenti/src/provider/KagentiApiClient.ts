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
import { KeycloakAuthClient } from './KeycloakAuthClient';

/**
 * Options for creating a {@link KagentiApiClient}.
 *
 * @internal
 */
export interface KagentiApiClientOptions {
  /** Base URL of the Kagenti A2A gateway. */
  baseUrl: string;
  /** Logger instance. */
  logger: LoggerService;
  /** Optional Keycloak auth client for bearer token injection. */
  authClient?: KeycloakAuthClient;
}

/**
 * Options for a single request made via the API client.
 *
 * @internal
 */
export interface RequestOptions {
  /** HTTP method. */
  method: string;
  /** URL path appended to baseUrl. */
  path: string;
  /** Request body (will be JSON-serialized). */
  body?: unknown;
  /** Optional Backstage user identity ref for audit header. */
  userRef?: string;
}

/**
 * HTTP client for Kagenti API calls with optional Keycloak
 * service-account auth and max-1-retry on 401.
 *
 * Implements tasks 7.3, 7.5b, and 7.6:
 * - Injects `Authorization: Bearer <token>` when auth is configured
 * - On HTTP 401, invalidates the cached token, acquires a fresh one,
 *   and retries the request once. A second 401 propagates the error.
 * - Sets `X-Backstage-User` header for user-initiated requests
 *
 * @internal
 */
export class KagentiApiClient {
  private readonly baseUrl: string;
  private readonly logger: LoggerService;
  private readonly authClient?: KeycloakAuthClient;

  constructor(options: KagentiApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.logger = options.logger;
    this.authClient = options.authClient;
  }

  /**
   * Execute an HTTP request to the Kagenti API with auth and retry.
   *
   * @param options - Request options including method, path, body, and user context.
   * @returns The fetch Response object.
   * @throws Error if the request fails after retry.
   */
  async requestCore(options: RequestOptions): Promise<Response> {
    const response = await this.doFetch(options);

    // Max-1-retry on 401: invalidate token, fetch fresh, retry once
    if (response.status === 401 && this.authClient) {
      this.logger.info(
        'Received 401 from Kagenti, invalidating token and retrying',
      );
      this.authClient.invalidateToken();
      const retryResponse = await this.doFetch(options);

      if (retryResponse.status === 401) {
        this.logger.error(
          'Received 401 from Kagenti after token refresh retry',
        );
      }

      return retryResponse;
    }

    return response;
  }

  /**
   * Perform a single fetch call with auth headers applied.
   */
  private async doFetch(options: RequestOptions): Promise<Response> {
    const url = `${this.baseUrl}${options.path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Task 7.5b: inject bearer token when auth is configured
    if (this.authClient) {
      const token = await this.authClient.getBearerToken();
      headers.Authorization = `Bearer ${token}`;
    }

    // Task 7.6: propagate user identity for audit
    if (options.userRef) {
      headers['X-Backstage-User'] = options.userRef;
    }

    return fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  }
}
