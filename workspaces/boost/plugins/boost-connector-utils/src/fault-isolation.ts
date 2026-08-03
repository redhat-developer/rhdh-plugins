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
import type { ConnectorErrorContext } from './types';

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
 * Retryable (transient) error codes and HTTP status codes.
 *
 * @internal
 */
const RETRYABLE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'EAI_AGAIN',
]);

const RETRYABLE_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * Non-retryable error type names.
 *
 * @internal
 */
const NON_RETRYABLE_TYPES = new Set(['TypeError', 'SyntaxError', 'ZodError']);

/**
 * Non-retryable TLS error codes.
 *
 * @internal
 */
const NON_RETRYABLE_TLS_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);

const NON_RETRYABLE_HTTP_STATUSES = new Set([400, 401, 403, 404]);

/**
 * Classify whether a connector error is retryable (transient)
 * or non-retryable (fatal).
 *
 * @param error - The error to classify.
 * @returns `true` if the error is transient and a retry is recommended.
 *
 * @public
 */
export function classifyConnectorError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const err = error as Error & {
    code?: string;
    status?: number;
    statusCode?: number;
    cause?: Error & { code?: string };
  };

  // Non-retryable by error type
  if (NON_RETRYABLE_TYPES.has(err.constructor.name)) {
    return false;
  }

  // Non-retryable TLS errors (check code and cause.code)
  if (err.code && NON_RETRYABLE_TLS_CODES.has(err.code)) {
    return false;
  }
  if (err.cause?.code && NON_RETRYABLE_TLS_CODES.has(err.cause.code)) {
    return false;
  }

  // Non-retryable HTTP statuses
  const httpStatus = err.status ?? err.statusCode;
  if (httpStatus && NON_RETRYABLE_HTTP_STATUSES.has(httpStatus)) {
    return false;
  }

  // Retryable by error code
  if (err.code && RETRYABLE_CODES.has(err.code)) {
    return true;
  }

  // Retryable by HTTP status
  if (httpStatus && RETRYABLE_HTTP_STATUSES.has(httpStatus)) {
    return true;
  }

  // FetchError with network cause is retryable
  if (
    err.constructor.name === 'FetchError' &&
    err.code &&
    RETRYABLE_CODES.has(err.code)
  ) {
    return true;
  }

  // Default: non-retryable
  return false;
}

/**
 * Build a ConnectorErrorContext from an error.
 *
 * @internal
 */
function buildErrorContext(
  error: unknown,
  connectorId: string,
  endpoint?: string,
): ConnectorErrorContext {
  const err = error instanceof Error ? error : new Error(String(error));
  const retryable = classifyConnectorError(error);

  return {
    connectorId,
    endpoint,
    errorType: err.constructor.name,
    errorMessage: err.message,
    retryable,
  };
}

/**
 * Wrap an EntityProvider so that its `connect()` method catches
 * unhandled errors and logs them instead of crashing the process.
 *
 * @param provider - The original entity provider.
 * @param logger - Backstage LoggerService for structured logging.
 * @param ctx - Optional context with the endpoint URL.
 * @returns A wrapped EntityProvider that never throws from `connect()`.
 *
 * @public
 */
export function createProviderWrapper(
  provider: ConnectorEntityProvider,
  logger: LoggerService,
  ctx?: { endpoint?: string },
): ConnectorEntityProvider {
  return {
    getProviderName: () => provider.getProviderName(),
    async connect(connection: unknown): Promise<void> {
      try {
        await provider.connect(connection);
      } catch (error) {
        const errorCtx = buildErrorContext(
          error,
          provider.getProviderName(),
          ctx?.endpoint,
        );
        logger.error('Connector connect() failed', errorCtx);
        // Don't rethrow — allow other providers to continue
      }
    },
  };
}

/**
 * Wrap a scheduled refresh callback in try/catch to prevent
 * unhandled rejections from crashing the Node.js process.
 *
 * @param refreshFn - The refresh callback to wrap.
 * @param connectorId - Provider identifier for error context.
 * @param logger - Backstage LoggerService for structured logging.
 * @param ctx - Optional context with the endpoint URL.
 * @returns A wrapped callback that never throws.
 *
 * @public
 */
export function createSafeRefresh(
  refreshFn: () => Promise<void>,
  connectorId: string,
  logger: LoggerService,
  ctx?: { endpoint?: string },
): () => Promise<void> {
  return async () => {
    try {
      await refreshFn();
    } catch (error) {
      const errorCtx = buildErrorContext(error, connectorId, ctx?.endpoint);
      logger.error('Connector refresh failed', errorCtx);
      // Don't rethrow — allow catalog backend to continue
    }
  };
}
