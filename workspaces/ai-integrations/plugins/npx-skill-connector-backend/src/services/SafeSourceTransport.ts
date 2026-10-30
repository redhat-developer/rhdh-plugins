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

/**
 * Creates a combined signal from an optional parent signal and a timeout.
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
 * Runs one logical request, including redirects and body reading,
 * within a single timeout envelope.
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
 * The returned addresses are used by a pinned Undici dispatcher so the
 * connection cannot resolve to an unvalidated (potentially private)
 * address after validation.
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

/** Optional additional trusted redirect origins. */
export interface RequestPolicy {
  allowedOrigins?: readonly string[];
  /** When true, redirects are rejected instead of followed. */
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
 * Fetches a URL following redirects with full safety enforcement:
 * - HTTPS only
 * - No embedded credentials
 * - No localhost or IP addresses
 * - DNS validation and connection pinning on every hop
 * - npx trust model: only the initial index origin is trusted by default;
 *   additional origins require explicit allowedOrigins configuration
 * - At most MAX_REDIRECTS redirects
 * - Authorization headers are stripped on cross-origin redirects
 */
export async function fetchWithRedirects(
  url: string,
  init: RequestInit,
  signal: AbortSignal,
  policy: RequestPolicy = {},
): Promise<Response> {
  const initialUrl = new URL(url);
  let currentUrl = initialUrl;
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
        throw new Error('Response exceeded the maximum redirect count');
      }

      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Redirect response did not include a Location');
      }
      const nextUrl = new URL(location, currentUrl);
      validateRequestUrl(nextUrl);

      // npx trust model: default trust is the index origin only (D7).
      // Unlike OCI which trusts registry hostname + subdomains,
      // npx requires explicit allowedOrigins for any non-index origin.
      if (!allowedOrigins.has(nextUrl.origin)) {
        throw new Error(
          `Redirect targets an unconfigured origin: ${nextUrl.origin}`,
        );
      }

      // Strip authorization on cross-origin redirects
      if (nextUrl.origin !== currentUrl.origin) {
        headers.delete('authorization');
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

async function readArrayBufferResponse(
  response: Response,
  maxSize: number,
): Promise<Buffer> {
  if (typeof response.arrayBuffer !== 'function') {
    throw new TypeError('Response does not contain a readable body');
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxSize) {
    throw new Error(
      `Response size ${buffer.length} exceeds maximum allowed size ${maxSize}`,
    );
  }
  return buffer;
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
    : readArrayBufferResponse(response, maxSize);
}

/**
 * Reads a response body as bounded JSON, enforcing byte limits and
 * parsing as JSON.
 */
export async function readResponseJson(
  response: Response,
  maxSize: number,
): Promise<unknown> {
  const buffer = await readResponseBuffer(response, maxSize);
  return JSON.parse(buffer.toString('utf-8'));
}
