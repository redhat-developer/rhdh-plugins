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
import { MAX_REDIRECTS } from './types';

function createRequestSignal(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

export async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Best effort; the request's failure should remain the reported error.
  }
}

/** Runs one logical request, including authentication, redirects and body reading. */
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
    // DNS lookup does not accept an AbortSignal. Stop waiting at the deadline
    // even if it is still pending; the redirect loop checks cancellation before
    // dispatching any later request.
    return await Promise.race([operation(requestSignal), aborted]);
  } catch (error) {
    // Body-stream reads can report AbortError even when our deadline expired.
    // Preserve the actual timeout/cancellation reason for the retry policy.
    parentSignal?.throwIfAborted();
    requestSignal.throwIfAborted();
    throw error;
  } finally {
    requestSignal.removeEventListener('abort', onAbort);
  }
}

/** HTTP status is kept separate from diagnostic text for retry classification. */
export class HttpResponseError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'HttpResponseError';
  }
}

function isIpAddress(hostname: string): boolean {
  const normalizedHostname = hostname.startsWith('[')
    ? hostname.slice(1, -1)
    : hostname;
  return isIP(normalizedHostname) !== 0;
}

/** Reject non-unicast destinations, including canonical IPv4-mapped IPv6. */
export function isPrivateAddress(address: string, family: number): boolean {
  if (!ipaddr.isValid(address) || (family !== 4 && family !== 6)) return true;
  const parsed = ipaddr.parse(address);
  if ((parsed.kind() === 'ipv4' ? 4 : 6) !== family) return true;
  return ipaddr.process(address).range() !== 'unicast';
}

/**
 * Resolves a hostname via DNS, validates all addresses are public,
 * and returns the complete validated address set for connection pinning.
 *
 * This replaces the former preflight-only check: the returned addresses
 * are used by a pinned Undici dispatcher so the connection cannot resolve to
 * an unvalidated (potentially private) address after validation.
 */
export async function validateAndResolveHost(
  hostname: string,
): Promise<LookupAddress[]> {
  let addresses: LookupAddress[];
  try {
    addresses = await dnsPromises.lookup(hostname, { all: true });
  } catch {
    throw new Error(`Registry hostname ${hostname} could not be resolved`);
  }

  if (addresses.length === 0) {
    throw new Error(`Registry hostname ${hostname} could not be resolved`);
  }

  for (const addr of addresses) {
    if (isPrivateAddress(addr.address, addr.family)) {
      throw new Error(
        `Registry hostname ${hostname} resolves to non-public address ${addr.address}`,
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
    // Let Node try IPv4 when IPv6 is unreachable, using only our DNS snapshot.
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

/** Optional additional trusted redirect origins, beyond the configured request origin. */
export interface RequestPolicy {
  allowedOrigins?: readonly string[];
  /** Token requests reject redirects rather than following them. */
  maxRedirects?: number;
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
 * Validates that a URL is safe for registry requests:
 * - Must use HTTPS
 * - Must not contain embedded credentials
 * - Must not target localhost, .localhost, or raw IP addresses
 */
export function validateRequestUrl(url: URL): void {
  if (url.protocol !== 'https:') {
    throw new Error('Registry request must use HTTPS');
  }
  if (url.username || url.password) {
    throw new Error(
      'Registry request URL must not contain embedded credentials',
    );
  }
  if (
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    isIpAddress(url.hostname)
  ) {
    throw new Error('Registry request must target a public hostname');
  }
}

export async function fetchWithRedirects(
  url: string,
  init: RequestInit,
  signal: AbortSignal,
  policy: RequestPolicy = {},
): Promise<Response> {
  const registryUrl = new URL(url);
  let currentUrl = registryUrl;
  const headers = new Headers(init.headers);
  const allowedOrigins = new Set([
    currentUrl.origin,
    ...(policy.allowedOrigins ?? []).map(validateAllowedOrigin),
  ]);
  const maxRedirects = policy.maxRedirects ?? MAX_REDIRECTS;

  // Validate initial request URL
  validateRequestUrl(currentUrl);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
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
        ...init,
        headers: Object.fromEntries(headers),
        redirect: 'manual',
        signal,
        dispatcher: pinnedAgent,
      } as RequestInit & { dispatcher: Agent });

      if (![301, 302, 303, 307, 308].includes(response.status)) {
        return response;
      }
      await cancelResponseBody(response);
      if (redirectCount === maxRedirects) {
        throw new Error(
          'Registry response exceeded the maximum redirect count',
        );
      }

      const location = response.headers.get('location');
      if (!location) {
        throw new Error(
          'Registry redirect response did not include a Location',
        );
      }
      const nextUrl = new URL(location, currentUrl);
      validateRequestUrl(nextUrl);
      // The configured registry also trusts its subdomains for HTTPS redirects
      // on the same port. Compare against the initial registry, not each hop,
      // so an explicitly allowed external origin cannot expand trust further.
      const withinRegistry =
        nextUrl.port === registryUrl.port &&
        (nextUrl.hostname === registryUrl.hostname ||
          nextUrl.hostname.endsWith(`.${registryUrl.hostname}`));
      if (!withinRegistry && !allowedOrigins.has(nextUrl.origin)) {
        throw new Error(
          `Registry redirect targets an unconfigured origin: ${nextUrl.origin}`,
        );
      }

      // Validate redirect target DNS resolution — the next iteration
      // of the loop will also validate before connecting.
      if (nextUrl.origin !== currentUrl.origin) {
        headers.delete('authorization');
      }
      currentUrl = nextUrl;
    } catch (error) {
      void pinnedAgent.destroy().catch(() => undefined);
      throw error;
    } finally {
      // Graceful close waits for the caller to consume/cancel the response body.
      // Awaiting here would deadlock streaming callers; destroy only on failure.
      void pinnedAgent.close().catch(() => {
        void pinnedAgent.destroy().catch(() => undefined);
      });
    }
  }

  throw new Error('Registry redirect handling failed');
}

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
    throw new Error('Registry response has an invalid Content-Length header');
  }
  if (declaredLength > maxSize) {
    await cancelResponseBody(response);
    throw new Error(
      `Registry response size ${declaredLength} exceeds maximum allowed size ${maxSize}`,
    );
  }
}

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
        // Cleanup failure must not turn a permanent size violation into a
        // retryable network error.
        await reader.cancel().catch(() => undefined);
        throw new Error(
          `Registry response size exceeds maximum allowed size ${maxSize}`,
        );
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, totalSize);
}

async function readArrayBufferResponse(
  response: Response,
  maxSize: number,
): Promise<Buffer> {
  if (typeof response.arrayBuffer !== 'function') {
    throw new TypeError('Registry response does not contain a readable body');
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxSize) {
    throw new Error(
      `Registry response size ${buffer.length} exceeds maximum allowed size ${maxSize}`,
    );
  }
  return buffer;
}

export async function readResponseBuffer(
  response: Response,
  maxSize: number,
): Promise<Buffer> {
  await validateContentLength(response, maxSize);
  return response.body
    ? readStreamingResponse(response, maxSize)
    : readArrayBufferResponse(response, maxSize);
}

export async function readResponseJson(
  response: Response,
  maxSize: number,
): Promise<unknown> {
  const buffer = await readResponseBuffer(response, maxSize);
  return JSON.parse(buffer.toString('utf-8'));
}
