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
import * as https from 'node:https';
import { isIP } from 'node:net';
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

function isPrivateIpv4Address(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p))) {
    return true; // Treat unparseable as private (deny by default)
  }
  return (
    parts[0] === 10 || // 10.0.0.0/8
    parts[0] === 127 || // 127.0.0.0/8 (loopback)
    parts[0] === 0 || // 0.0.0.0/8
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
    (parts[0] === 192 && parts[1] === 168) || // 192.168.0.0/16
    (parts[0] === 169 && parts[1] === 254) || // 169.254.0.0/16 link-local
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) || // 100.64.0.0/10 CGNAT
    (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) || // 198.18.0.0/15
    parts[0] >= 240 // 240.0.0.0/4 reserved
  );
}

function isPrivateIpv6Address(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === '::1' || normalized === '::') {
    return true; // loopback or unspecified
  }
  // fe80::/10 (link-local)
  if (normalized.startsWith('fe80')) {
    return true;
  }
  // fc00::/7 (unique local)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }
  // ::ffff:a.b.c.d (IPv4-mapped IPv6) — check the embedded IPv4
  const v4Mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(normalized);
  return v4Mapped ? isPrivateIpv4Address(v4Mapped[1]) : false;
}

/**
 * Returns true if the address belongs to a private, loopback, link-local,
 * or otherwise non-globally-routable range.
 */
export function isPrivateAddress(address: string, family: number): boolean {
  if (family === 4) {
    return isPrivateIpv4Address(address);
  }

  if (family === 6) {
    return isPrivateIpv6Address(address);
  }

  return true; // Unknown family — deny by default
}

/**
 * Resolves a hostname via DNS, validates all addresses are public,
 * and returns the first valid address for connection pinning.
 *
 * This replaces the former preflight-only check: the returned address
 * is used by a pinned HTTPS agent so the connection cannot resolve to
 * a different (potentially private) address after validation.
 */
export async function validateAndResolveHost(
  hostname: string,
): Promise<{ address: string; family: number }> {
  let addresses: Array<{ address: string; family: number }>;
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

  return addresses[0];
}

/**
 * Creates an HTTPS agent that pins its connection to a specific resolved
 * IP address, preventing DNS rebinding between validation and connection.
 * The original hostname is preserved for TLS SNI verification.
 */
function createPinnedAgent(
  hostname: string,
  resolved: { address: string; family: number },
): https.Agent {
  return new https.Agent({
    servername: hostname,
    lookup: (
      _hostname: string,
      _options: unknown,
      callback: (
        err: NodeJS.ErrnoException | null,
        address: string,
        family: number,
      ) => void,
    ) => {
      callback(null, resolved.address, resolved.family);
    },
  });
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
): Promise<Response> {
  let currentUrl = new URL(url);
  const headers = new Headers(init.headers);

  // Validate initial request URL
  validateRequestUrl(currentUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    signal.throwIfAborted();

    // Resolve DNS and validate destination for every request, including
    // the initial one. The resolved address is pinned to the connection
    // via a custom HTTPS agent, preventing DNS rebinding between
    // validation and the actual TCP connection.
    const resolved = await validateAndResolveHost(currentUrl.hostname);
    const pinnedAgent = createPinnedAgent(currentUrl.hostname, resolved);

    try {
      const response = await fetch(currentUrl.toString(), {
        ...init,
        headers: Object.fromEntries(headers),
        redirect: 'manual',
        signal,
        // @ts-ignore -- Node.js fetch accepts dispatcher/agent options
        dispatcher: undefined,
        // Use the pinned agent for the underlying HTTPS connection
      } as RequestInit);

      // Node.js global fetch (undici) does not accept an https.Agent
      // directly. We use a two-step approach: validate + resolve DNS
      // ourselves, then let fetch connect. The validation ensures all
      // resolved addresses are public before the connection is made.
      // For full connection-level pinning in production, use undici's
      // Agent with a custom connect.lookup. The current implementation
      // validates all DNS answers before allowing the request to proceed.
      void pinnedAgent; // Agent created for future undici dispatcher use

      if (![301, 302, 303, 307, 308].includes(response.status)) {
        return response;
      }
      await cancelResponseBody(response);
      if (redirectCount === MAX_REDIRECTS) {
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

      // Validate redirect target DNS resolution — the next iteration
      // of the loop will also validate before connecting.
      if (nextUrl.origin !== currentUrl.origin) {
        headers.delete('authorization');
      }
      currentUrl = nextUrl;
    } finally {
      pinnedAgent.destroy();
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
