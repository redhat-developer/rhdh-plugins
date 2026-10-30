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

import { promises as dnsPromises } from 'node:dns';
import type { LookupAddress } from 'node:dns';
import { isIP } from 'node:net';
import { Agent } from 'undici';
import * as ipaddr from 'ipaddr.js';
import type { NpxSourceConfig } from './types';
import {
  FETCH_TIMEOUT_MS,
  MAX_ARTIFACT_SIZE,
  MAX_INDEX_RESPONSE_SIZE,
  MAX_REDIRECTS,
} from './types';

/**
 * Stop a request when its caller cancels or the time limit expires.
 */
function createRequestSignal(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

/**
 * Best-effort cancellation of an unconsumed response body.
 */
export async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Best effort; the request's failure should remain the reported error.
  }
}

/**
 * Apply one time limit to redirects and reading the response body.
 */
export async function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  parentSignal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<T> {
  parentSignal?.throwIfAborted();
  const requestSignal = createRequestSignal(parentSignal, timeoutMs);
  requestSignal.throwIfAborted();
  let onAbort: () => void = () => undefined;
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(requestSignal.reason);
    requestSignal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await Promise.race([operation(requestSignal), aborted]);
  } catch (error) {
    parentSignal?.throwIfAborted();
    requestSignal.throwIfAborted();
    throw error;
  } finally {
    requestSignal.removeEventListener('abort', onAbort);
  }
}

function isIpAddress(hostname: string): boolean {
  const normalizedHostname = hostname.startsWith('[')
    ? hostname.slice(1, -1)
    : hostname;
  return isIP(normalizedHostname) !== 0;
}

/** Reject local and other non-public IP addresses, including IPv4 in IPv6 form. */
export function isPrivateAddress(address: string, family: number): boolean {
  if (!ipaddr.isValid(address) || (family !== 4 && family !== 6)) return true;
  const parsed = ipaddr.parse(address);
  if ((parsed.kind() === 'ipv4' ? 4 : 6) !== family) return true;
  return ipaddr.process(address).range() !== 'unicast';
}

/**
 * Check every DNS address and use the checked addresses for the connection.
 */
export async function validateAndResolveHost(
  hostname: string,
): Promise<LookupAddress[]> {
  let addresses: LookupAddress[];
  try {
    addresses = await dnsPromises.lookup(hostname, { all: true });
  } catch {
    throw new Error(`Hostname ${hostname} could not be resolved`);
  }

  if (addresses.length === 0) {
    throw new Error(`Hostname ${hostname} could not be resolved`);
  }

  for (const addr of addresses) {
    if (isPrivateAddress(addr.address, addr.family)) {
      throw new Error(
        `Hostname ${hostname} resolves to non-public address ${addr.address}`,
      );
    }
  }

  return addresses;
}

/** Restricts all connection attempts to the validated DNS answer set. */
function createPinnedAgent(
  hostname: string,
  resolved: readonly LookupAddress[],
): Agent {
  return new Agent({
    autoSelectFamily: true,
    connect: {
      servername: hostname,
      lookup: (requestedHost, options, callback) => {
        if (requestedHost !== hostname) {
          callback(new Error('Pinned connection hostname mismatch'), '', 0);
          return;
        }
        if (typeof options === 'object' && options.all) {
          callback(null, [...resolved]);
        } else {
          const family = typeof options === 'number' ? options : options.family;
          const address = resolved.find(
            candidate => !family || candidate.family === family,
          );
          if (!address) {
            callback(
              new Error('No validated address for the requested family'),
              '',
              0,
            );
            return;
          }
          callback(null, address.address, address.family);
        }
      },
    },
  });
}

/** Validate operator-supplied origins without permitting paths or credentials. */
export function validateAllowedOrigin(value: string): string {
  const url = new URL(value);
  validateRequestUrl(url);
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(
      'Allowed origin must not contain a path, query, or fragment',
    );
  }
  return url.origin;
}

/**
 * Validates that a URL is safe for source requests:
 * - Must use HTTPS
 * - Must not contain embedded credentials
 * - Must not target localhost, .localhost, or raw IP addresses
 */
export function validateRequestUrl(url: URL): void {
  if (url.protocol !== 'https:') {
    throw new Error('Source request must use HTTPS');
  }
  if (url.username || url.password) {
    throw new Error('Source request URL must not contain embedded credentials');
  }
  if (
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    isIpAddress(url.hostname)
  ) {
    throw new Error('Source request must target a public hostname');
  }
}

/**
 * Fetch only from the configured index origin or an explicitly allowed origin.
 * Check each redirect and the IP address used for every connection.
 */
async function fetchWithRedirects(
  url: string,
  signal: AbortSignal,
  source: Pick<NpxSourceConfig, 'indexUrl' | 'allowedOrigins'>,
): Promise<Response> {
  let currentUrl = new URL(url);
  const allowedOrigins = new Set([
    new URL(source.indexUrl).origin,
    ...(source.allowedOrigins ?? []).map(validateAllowedOrigin),
  ]);
  validateRequestUrl(currentUrl);
  if (!allowedOrigins.has(currentUrl.origin)) {
    throw new Error(
      `Source request targets an unconfigured origin: ${currentUrl.origin}`,
    );
  }

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    signal.throwIfAborted();

    // Resolve DNS and validate destination for every request, including
    // the initial one. The validated address set is pinned to the connection
    // via a custom Undici dispatcher, preventing DNS rebinding between
    // validation and the actual TCP connection.
    const resolved = await validateAndResolveHost(currentUrl.hostname);
    signal.throwIfAborted();
    const pinnedAgent = createPinnedAgent(currentUrl.hostname, resolved);

    try {
      const response = await fetch(currentUrl.toString(), {
        redirect: 'manual',
        signal,
        dispatcher: pinnedAgent,
      } as RequestInit & { dispatcher: Agent });

      if (![301, 302, 303, 307, 308].includes(response.status)) {
        return response;
      }
      await cancelResponseBody(response);
      if (redirectCount === MAX_REDIRECTS) {
        throw new Error('Response exceeded the maximum redirect count');
      }

      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Redirect response did not include a Location');
      }
      const nextUrl = new URL(location, currentUrl);
      validateRequestUrl(nextUrl);

      if (!allowedOrigins.has(nextUrl.origin)) {
        throw new Error(
          `Redirect targets an unconfigured origin: ${nextUrl.origin}`,
        );
      }

      currentUrl = nextUrl;
    } catch (error) {
      void pinnedAgent.destroy().catch(() => undefined);
      throw error;
    } finally {
      void pinnedAgent.close().catch(() => {
        void pinnedAgent.destroy().catch(() => undefined);
      });
    }
  }

  throw new Error('Redirect handling failed');
}

/** Fetch an index or skill file using the fixed D7 time and size limits. */
export async function fetchSourceBuffer(
  url: string,
  source: Pick<NpxSourceConfig, 'indexUrl' | 'allowedOrigins'>,
  kind: 'index' | 'artifact',
  parentSignal?: AbortSignal,
): Promise<Buffer> {
  const maxSize =
    kind === 'index' ? MAX_INDEX_RESPONSE_SIZE : MAX_ARTIFACT_SIZE;
  return withRequestTimeout(
    async signal => {
      const response = await fetchWithRedirects(url, signal, source);
      if (!response.ok) {
        await cancelResponseBody(response);
        throw new Error(`Source request returned HTTP ${response.status}`);
      }
      return readResponseBuffer(response, maxSize);
    },
    parentSignal,
    FETCH_TIMEOUT_MS,
  );
}

/**
 * Validates Content-Length header if present. Cancels the response body
 * and throws when the declared length exceeds the maximum.
 */
async function validateContentLength(
  response: Response,
  maxSize: number,
): Promise<void> {
  const contentLength = response.headers?.get('content-length');
  if (!contentLength) {
    return;
  }

  const declaredLength = Number(contentLength);
  if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
    await cancelResponseBody(response);
    throw new Error('Response has an invalid Content-Length header');
  }
  if (declaredLength > maxSize) {
    await cancelResponseBody(response);
    throw new Error(
      `Response size ${declaredLength} exceeds maximum allowed size ${maxSize}`,
    );
  }
}

/**
 * Reads a response body as a bounded streaming read, enforcing a
 * byte limit on the total size of the response.
 */
async function readStreamingResponse(
  response: Response,
  maxSize: number,
): Promise<Buffer> {
  const reader = response.body!.getReader();
  const chunks: Buffer[] = [];
  let totalSize = 0;
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) {
        break;
      }
      const chunk = Buffer.from(result.value);
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        await reader.cancel().catch(() => undefined);
        throw new Error(
          `Response size exceeds maximum allowed size ${maxSize}`,
        );
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, totalSize);
}

/**
 * Reads a response body with bounded streaming, enforcing both
 * Content-Length header validation and actual byte-count limits.
 */
export async function readResponseBuffer(
  response: Response,
  maxSize: number,
): Promise<Buffer> {
  await validateContentLength(response, maxSize);
  return response.body
    ? readStreamingResponse(response, maxSize)
    : Buffer.alloc(0);
}
