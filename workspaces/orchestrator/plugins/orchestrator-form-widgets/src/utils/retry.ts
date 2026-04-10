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

export type FetchRetryOptions = {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: number;
  statusCodes?: number[];
};

const sleep = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_RETRY_BACKOFF = 2;

const normalizeRetryOptions = (options?: FetchRetryOptions) => {
  if (!options) {
    return undefined;
  }

  const maxAttempts = Number(options.maxAttempts);
  if (!Number.isFinite(maxAttempts) || maxAttempts <= 0) {
    return undefined;
  }

  const delayMs = Number(options.delayMs ?? DEFAULT_RETRY_DELAY_MS);
  const backoff = Number(options.backoff ?? DEFAULT_RETRY_BACKOFF);
  const statusCodes =
    Array.isArray(options.statusCodes) && options.statusCodes.length > 0
      ? new Set(options.statusCodes)
      : undefined;

  return {
    maxAttempts: Math.floor(maxAttempts),
    delayMs: Math.max(0, delayMs),
    backoff: Math.max(1, backoff),
    statusCodes,
  };
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const maybeError = error as {
    status?: unknown;
    response?: { status?: unknown };
  };

  const status = maybeError.status ?? maybeError.response?.status;
  return typeof status === 'number' ? status : undefined;
};

export const fetchWithRetry = async (
  fetchFn: () => Promise<Response>,
  options?: FetchRetryOptions,
): Promise<Response> => {
  const retryOptions = normalizeRetryOptions(options);
  if (!retryOptions) {
    return fetchFn();
  }

  for (let attempt = 0; attempt <= retryOptions.maxAttempts; attempt += 1) {
    try {
      const response = await fetchFn();
      if (response.ok) {
        return response;
      }

      if (
        retryOptions.statusCodes &&
        !retryOptions.statusCodes.has(response.status)
      ) {
        return response;
      }

      if (attempt >= retryOptions.maxAttempts) {
        return response;
      }
    } catch (error) {
      const status = getErrorStatus(error);
      if (
        status !== undefined &&
        retryOptions.statusCodes &&
        !retryOptions.statusCodes.has(status)
      ) {
        throw error;
      }

      if (attempt >= retryOptions.maxAttempts) {
        throw error;
      }
    }

    const waitMs =
      retryOptions.delayMs * Math.pow(retryOptions.backoff, attempt);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
  }

  throw new Error('Retry attempts exceeded without a terminal response.');
};
