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
 * Minimal entity provider interface matching Backstage's EntityProvider
 * contract. Defined locally to avoid a dependency on
 * `@backstage/plugin-catalog-node`.
 *
 * @public
 */
export interface ConnectorEntityProvider {
  /** Returns the provider's unique name. */
  getProviderName(): string;
  /** Connects the provider to the catalog. */
  connect(connection: unknown): Promise<void>;
}

/**
 * Structured error context logged when a connector fails.
 *
 * @public
 */
export interface ConnectorErrorContext {
  /** Provider identifier (e.g., 'mcpRegistry'). */
  connectorId: string;
  /** External API endpoint that failed (if known). */
  endpoint?: string;
  /** Error constructor name (e.g., 'FetchError', 'TimeoutError'). */
  errorType: string;
  /** Human-readable error message. */
  errorMessage: string;
  /** Whether this error is transient (retry recommended). */
  retryable: boolean;
  /** ISO timestamp of next scheduled retry (present only when retryable). */
  nextRetryAt?: string;
  /** Index signature for compatibility with Backstage LoggerService metadata (JsonObject). */
  [key: string]: string | boolean | undefined;
}

/**
 * Options for startup config validation.
 *
 * @public
 */
export interface ValidateConnectorStartupConfigOptions {
  /**
   * Config keys (relative to the connector Config subtree) that hold
   * credential values. Validated as non-empty when present; prefer
   * Backstage `$env` references backed by K8s Secrets.
   * Example: `['auth.token', 'auth.clientSecret']`
   */
  credentialFields: string[];

  /**
   * Config key (relative to the connector Config subtree) that holds
   * the endpoint URL. If provided, the value is validated as a valid
   * HTTPS URL.
   * Example: `'endpoint'`
   */
  endpointField?: string;
}
