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

import { InputError } from '@backstage/errors';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { createHash } from 'node:crypto';
import { promises as dnsPromises } from 'node:dns';
import { isIP } from 'node:net';
import type { ImageRef, OciManifest, RegistryCredentials } from './types';
import { MAX_BLOB_SIZE, FETCH_TIMEOUT_MS } from './types';

const MAX_MANIFEST_SIZE = 5 * 1024 * 1024;
const OCI_REGISTRY_PATTERN =
  /^(?:\[[0-9a-fA-F:]+\]|[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?)(?::\d{1,5})?$/;
const OCI_REPOSITORY_PATTERN =
  /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*(?:\/[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*)*$/;
const OCI_TAG_PATTERN = /^\w[\w.-]{0,127}$/;
const DIGEST_PATTERN = /^(sha256|sha512):([0-9a-fA-F]+)$/;
const MAX_REDIRECTS = 3;

type DigestInfo = {
  algorithm: 'sha256' | 'sha512';
  hex: string;
};

type ParsedImageReference = Pick<ImageRef, 'repository' | 'tag'> & {
  digest?: string;
};

function createRequestSignal(signal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Best effort; the request's failure should remain the reported error.
  }
}

function imageReference(imageRef: ImageRef): string {
  return `${imageRef.registry}/${imageRef.repository}${
    imageRef.digest ? `@${imageRef.digest}` : `:${imageRef.tag}`
  }`;
}

function parseDigest(digest: string): DigestInfo | undefined {
  const match = DIGEST_PATTERN.exec(digest);
  const algorithm = match?.[1];
  const hex = match?.[2];
  const expectedLength = algorithm === 'sha256' ? 64 : 128;

  if (
    (algorithm !== 'sha256' && algorithm !== 'sha512') ||
    hex?.length !== expectedLength
  ) {
    return undefined;
  }

  return { algorithm, hex: hex.toLowerCase() };
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
 * Resolves a hostname via DNS and throws if any resolved address
 * belongs to a private or reserved IP range.  Prevents DNS-rebinding
 * SSRF where a hostname initially resolves to a public IP (passing the
 * allowlist) but later resolves to an internal address.
 */
async function validateRedirectTarget(hostname: string): Promise<void> {
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await dnsPromises.lookup(hostname, { all: true });
  } catch {
    // DNS resolution failed — treat as unreachable rather than allowing
    // the request through without validation.
    throw new Error(
      `Registry redirect target hostname ${hostname} could not be resolved`,
    );
  }

  for (const addr of addresses) {
    if (isPrivateAddress(addr.address, addr.family)) {
      throw new Error(
        `Registry redirect target ${hostname} resolves to non-public address ${addr.address}`,
      );
    }
  }
}

function validateTag(tag: string, ref: string): void {
  if (!OCI_TAG_PATTERN.test(tag)) {
    throw new InputError(
      `Invalid image reference "${ref}": tag must be a valid OCI tag`,
    );
  }
}

function validateRepository(repository: string, ref: string): void {
  if (!OCI_REPOSITORY_PATTERN.test(repository)) {
    throw new InputError(
      `Invalid image reference "${ref}": repository must be a valid OCI repository name`,
    );
  }
}

function parseDigestReference(
  repoAndRef: string,
  ref: string,
): ParsedImageReference | undefined {
  const atIdx = repoAndRef.indexOf('@');
  if (atIdx === -1) {
    return undefined;
  }

  let repository = repoAndRef.substring(0, atIdx);
  const digest = repoAndRef.substring(atIdx + 1);
  if (!parseDigest(digest)) {
    throw new InputError(
      `Invalid image reference "${ref}": digest must be a valid sha256 or sha512 digest`,
    );
  }

  let tag = 'latest';
  const colonIdx = repository.lastIndexOf(':');
  if (colonIdx !== -1) {
    tag = repository.substring(colonIdx + 1);
    repository = repository.substring(0, colonIdx);
    if (!tag) {
      throw new InputError(
        `Invalid image reference "${ref}": tag must not be empty`,
      );
    }
  }

  validateTag(tag, ref);
  validateRepository(repository, ref);
  return { repository, tag, digest };
}

function parseTagReference(
  repoAndRef: string,
  ref: string,
): ParsedImageReference {
  let repository = repoAndRef;
  let tag = 'latest';
  const colonIdx = repository.lastIndexOf(':');
  if (colonIdx !== -1) {
    tag = repository.substring(colonIdx + 1);
    repository = repository.substring(0, colonIdx);
    if (!tag) {
      throw new InputError(
        `Invalid image reference "${ref}": tag must not be empty`,
      );
    }
    validateTag(tag, ref);
  }

  validateRepository(repository, ref);
  return { repository, tag };
}

/**
 * Parses an image reference string into its components.
 *
 * Supports formats:
 *   registry/repo:tag
 *   registry/repo@sha256:digest
 *   registry/repo          (tag defaults to "latest")
 */
export function parseImageRef(ref: string): ImageRef {
  if (!ref?.trim()) {
    throw new InputError(
      'Invalid image reference: reference must not be empty',
    );
  }

  // Strip any oci:// prefix
  const cleaned = ref.trim().replace(/^oci:\/\//, '');

  const firstSlash = cleaned.indexOf('/');
  if (firstSlash === -1) {
    throw new InputError(
      `Invalid image reference "${ref}": expected format registry/repository[:tag|@digest]`,
    );
  }

  const registry = cleaned.substring(0, firstSlash);
  const repoAndRef = cleaned.substring(firstSlash + 1);

  if (!registry || !repoAndRef) {
    throw new InputError(
      `Invalid image reference "${ref}": registry and repository are required`,
    );
  }

  if (!OCI_REGISTRY_PATTERN.test(registry)) {
    throw new InputError(
      `Invalid image reference "${ref}": registry must be a valid host and optional port`,
    );
  }

  return {
    registry,
    ...(parseDigestReference(repoAndRef, ref) ??
      parseTagReference(repoAndRef, ref)),
  };
}

/**
 * Parses a WWW-Authenticate header value to extract bearer token
 * challenge parameters (realm, service, scope).
 *
 * Implements a quoted-string-aware parser per RFC 7235 so that commas
 * inside quoted parameter values (e.g. scope="repository:org/repo:pull,push")
 * are not treated as parameter separators.
 */
function parseBearerChallenge(
  header: string,
): { realm: string; service?: string; scope?: string } | undefined {
  const schemeEnd = header.search(/\s/);
  if (
    schemeEnd === -1 ||
    header.substring(0, schemeEnd).toLowerCase() !== 'bearer'
  ) {
    return undefined;
  }

  const params: Record<string, string> = {};
  const paramsStr = header.substring(schemeEnd).trim();

  let pos = 0;
  while (pos < paramsStr.length) {
    // Skip whitespace and commas between parameters
    while (
      pos < paramsStr.length &&
      (paramsStr[pos] === ',' || paramsStr[pos] === ' ')
    ) {
      pos++;
    }
    if (pos >= paramsStr.length) {
      break;
    }

    const eqIdx = paramsStr.indexOf('=', pos);
    if (eqIdx === -1) {
      break;
    }

    const name = paramsStr.substring(pos, eqIdx).trim().toLowerCase();
    pos = eqIdx + 1;

    // Skip whitespace after '='
    while (pos < paramsStr.length && paramsStr[pos] === ' ') {
      pos++;
    }
    if (pos >= paramsStr.length) {
      break;
    }

    let value: string;
    if (paramsStr[pos] === '"') {
      // Quoted string — find closing quote, respecting backslash escapes
      pos++; // skip opening quote
      let valueEnd = pos;
      while (valueEnd < paramsStr.length && paramsStr[valueEnd] !== '"') {
        if (paramsStr[valueEnd] === '\\' && valueEnd + 1 < paramsStr.length) {
          valueEnd += 2; // skip escaped character
        } else {
          valueEnd++;
        }
      }
      value = paramsStr.substring(pos, valueEnd).replace(/\\(.)/g, '$1');
      pos = valueEnd < paramsStr.length ? valueEnd + 1 : valueEnd;
    } else {
      // Unquoted token — read until comma or whitespace
      const tokenEnd = paramsStr.substring(pos).search(/[,\s]/);
      if (tokenEnd === -1) {
        value = paramsStr.substring(pos);
        pos = paramsStr.length;
      } else {
        value = paramsStr.substring(pos, pos + tokenEnd);
        pos += tokenEnd;
      }
    }

    if (name) {
      params[name] = value;
    }
  }

  if (!params.realm) {
    return undefined;
  }

  return {
    realm: params.realm,
    service: params.service,
    scope: params.scope,
  };
}

/**
 * Attempts to obtain a bearer token from the registry's token endpoint using
 * the Docker Registry Token Authentication spec.
 */
async function fetchBearerToken(
  challenge: { realm: string; service?: string; scope?: string },
  logger: LoggerService,
  credentials?: RegistryCredentials,
  registryHost?: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const url = new URL(challenge.realm);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Registry token realm must use HTTPS without credentials');
  }
  if (credentials?.tokenRealm) {
    const configuredRealm = new URL(credentials.tokenRealm);
    if (
      configuredRealm.protocol !== 'https:' ||
      configuredRealm.origin !== url.origin ||
      configuredRealm.pathname !== url.pathname
    ) {
      throw new Error('Registry token realm is not the configured token realm');
    }
  } else if (registryHost && url.host !== registryHost) {
    throw new Error(
      'Registry token realm differs from the registry host; configure credentials.tokenRealm explicitly',
    );
  }
  if (challenge.service) {
    url.searchParams.set('service', challenge.service);
  }
  if (challenge.scope) {
    url.searchParams.set('scope', challenge.scope);
  }

  logger.debug('Requesting bearer token');

  const response = await fetch(url.toString(), {
    signal,
    redirect: 'error',
    headers:
      credentials?.username && credentials.password
        ? {
            Authorization: `Basic ${Buffer.from(
              `${credentials.username}:${credentials.password}`,
            ).toString('base64')}`,
          }
        : undefined,
  });

  if (!response.ok) {
    await cancelResponseBody(response);
    logger.warn(
      `Bearer token request failed: ${response.status} ${response.statusText}`,
    );
    return undefined;
  }

  let body: { token?: unknown; access_token?: unknown } | null;
  try {
    body = (await readResponseJson(response, 1024 * 1024)) as {
      token?: unknown;
      access_token?: unknown;
    } | null;
  } catch (error) {
    logger.warn('Bearer token response was not valid JSON', error as Error);
    return undefined;
  }
  const token = body?.token ?? body?.access_token;
  return typeof token === 'string' && token ? token : undefined;
}

/**
 * Makes an authenticated fetch request to an OCI registry. If the
 * initial request returns 401 with a WWW-Authenticate: Bearer
 * challenge, attempts the anonymous token exchange flow and retries.
 */
async function registryFetch(
  url: string,
  init: RequestInit,
  logger: LoggerService,
  credentials?: RegistryCredentials,
  signal?: AbortSignal,
): Promise<Response> {
  const requestSignal = createRequestSignal(signal);
  const headers = {
    ...((init.headers ?? {}) as Record<string, string>),
    ...(credentials?.username && credentials.password
      ? {
          Authorization: `Basic ${Buffer.from(
            `${credentials.username}:${credentials.password}`,
          ).toString('base64')}`,
        }
      : {}),
  };
  const response = await fetchWithRedirects(
    url,
    {
      ...init,
      headers,
    },
    requestSignal,
  );

  if (response.status !== 401) {
    return response;
  }

  const wwwAuth = response.headers.get('www-authenticate');
  // The 401 body is not needed by this client. Cancel it before issuing the
  // token request so undici can reuse the connection instead of retaining it.
  await cancelResponseBody(response);
  if (!wwwAuth) {
    return response;
  }

  const challenge = parseBearerChallenge(wwwAuth);
  if (!challenge) {
    return response;
  }

  const token = await fetchBearerToken(
    challenge,
    logger,
    credentials,
    new URL(url).host,
    requestSignal,
  );
  if (!token) {
    return response;
  }

  logger.debug('Retrying request with bearer token');
  return fetchWithRedirects(
    url,
    {
      ...init,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    },
    requestSignal,
  );
}

/**
 * Follows the HTTPS redirects commonly used by registries for blob storage,
 * while never forwarding registry credentials to another origin.
 */
async function fetchWithRedirects(
  url: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<Response> {
  let currentUrl = new URL(url);
  let headers = { ...((init.headers ?? {}) as Record<string, string>) };
  const requestSignal = signal ?? createRequestSignal();

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl.toString(), {
      ...init,
      headers,
      redirect: 'manual',
      signal: requestSignal,
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }
    await cancelResponseBody(response);
    if (redirectCount === MAX_REDIRECTS) {
      throw new Error('Registry response exceeded the maximum redirect count');
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new Error('Registry redirect response did not include a Location');
    }
    const nextUrl = new URL(location, currentUrl);
    if (
      nextUrl.protocol !== 'https:' ||
      nextUrl.username ||
      nextUrl.password ||
      nextUrl.hostname === 'localhost' ||
      nextUrl.hostname.endsWith('.localhost') ||
      isIpAddress(nextUrl.hostname)
    ) {
      throw new Error('Registry redirect target must be a public HTTPS URL');
    }
    // Resolve the redirect target hostname and reject private/internal IPs
    // to prevent DNS-rebinding SSRF attacks.
    await validateRedirectTarget(nextUrl.hostname);
    if (nextUrl.origin !== currentUrl.origin) {
      headers = Object.fromEntries(
        Object.entries(headers).filter(
          ([name]) => name.toLowerCase() !== 'authorization',
        ),
      );
    }
    currentUrl = nextUrl;
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
        await reader.cancel();
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

async function readResponseBuffer(
  response: Response,
  maxSize: number,
): Promise<Buffer> {
  await validateContentLength(response, maxSize);
  return response.body
    ? readStreamingResponse(response, maxSize)
    : readArrayBufferResponse(response, maxSize);
}

async function readResponseJson(
  response: Response,
  maxSize: number,
): Promise<unknown> {
  const buffer = await readResponseBuffer(response, maxSize);
  return JSON.parse(buffer.toString('utf-8'));
}

/**
 * Fetches an OCI image manifest from a registry using the OCI
 * Distribution Spec v2 HTTP API.
 *
 * Detects manifest lists / image indexes and throws a descriptive
 * error rather than returning an unexpected schema.
 */
export async function fetchManifest(
  imageRef: ImageRef,
  logger: LoggerService,
  credentials?: RegistryCredentials,
  signal?: AbortSignal,
): Promise<OciManifest> {
  const reference = imageRef.digest ?? imageRef.tag;
  const url = `https://${imageRef.registry}/v2/${imageRef.repository}/manifests/${reference}`;
  logger.info(`Fetching OCI manifest from ${url}`);

  const response = await registryFetch(
    url,
    {
      headers: {
        Accept: [
          'application/vnd.oci.image.manifest.v1+json',
          'application/vnd.docker.distribution.manifest.v2+json',
        ].join(', '),
      },
    },
    logger,
    credentials,
    signal,
  );

  if (!response.ok) {
    await cancelResponseBody(response);
    throw new Error(
      `Failed to fetch manifest for ${imageReference(imageRef)}: ${
        response.status
      } ${response.statusText}`,
    );
  }

  const manifestBuffer = await readResponseBuffer(response, MAX_MANIFEST_SIZE);
  const manifest = JSON.parse(manifestBuffer.toString('utf-8')) as
    | (OciManifest & {
        manifests?: unknown[];
      })
    | undefined;

  const manifestDigest = imageRef.digest;
  if (manifestDigest) {
    const digestInfo = parseDigest(manifestDigest);
    if (!digestInfo) {
      throw new Error(`Invalid manifest digest ${manifestDigest}`);
    }
    const actualDigest = createHash(digestInfo.algorithm)
      .update(manifestBuffer)
      .digest('hex');
    if (actualDigest !== digestInfo.hex) {
      throw new Error(
        `Manifest digest mismatch for ${manifestDigest}: got ${digestInfo.algorithm}:${actualDigest}`,
      );
    }
  }

  if (!manifest || typeof manifest !== 'object') {
    throw new TypeError('Registry returned an invalid OCI manifest object');
  }

  // Detect manifest list / image index responses
  const mediaType = manifest.mediaType ?? '';
  if (
    mediaType === 'application/vnd.oci.image.index.v1+json' ||
    mediaType === 'application/vnd.docker.distribution.manifest.list.v2+json' ||
    Array.isArray(manifest.manifests)
  ) {
    throw new Error(
      `Image ${imageReference(
        imageRef,
      )} returned a manifest list (multi-platform image index). ` +
        'This plugin requires a single-platform image manifest. ' +
        'Use a platform-specific tag or digest reference instead.',
    );
  }

  if (!Array.isArray(manifest.layers)) {
    throw new TypeError(
      'Registry returned an OCI manifest without a layers array',
    );
  }

  return manifest;
}

/**
 * Downloads a blob (layer) from the registry, verifies its SHA-256 or
 * SHA-512 digest, and returns it as a Buffer.
 *
 * Enforces a maximum download size (MAX_BLOB_SIZE) to prevent
 * out-of-memory conditions from oversized or malicious blobs.
 */
export async function fetchBlob(
  imageRef: ImageRef,
  digest: string,
  expectedSize: number,
  logger: LoggerService,
  credentials?: RegistryCredentials,
  signal?: AbortSignal,
): Promise<Buffer> {
  const digestInfo = parseDigest(digest);
  if (!digestInfo) {
    throw new Error(
      `Unsupported or invalid blob digest ${digest}; expected a sha256 or sha512 digest`,
    );
  }
  if (!Number.isSafeInteger(expectedSize) || expectedSize < 0) {
    throw new Error(`Blob ${digest} has an invalid declared size`);
  }
  if (expectedSize > MAX_BLOB_SIZE) {
    throw new Error(
      `Blob ${digest} declared size ${expectedSize} exceeds maximum allowed size ${MAX_BLOB_SIZE}`,
    );
  }

  const url = `https://${imageRef.registry}/v2/${imageRef.repository}/blobs/${digest}`;
  logger.debug(`Fetching blob ${digest} from ${url}`);

  const response = await registryFetch(url, {}, logger, credentials, signal);

  if (!response.ok) {
    await cancelResponseBody(response);
    throw new Error(
      `Failed to fetch blob ${digest} from ${imageRef.registry}/${imageRef.repository}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await readResponseBuffer(response, MAX_BLOB_SIZE);

  if (buffer.length !== expectedSize) {
    throw new Error(
      `Blob ${digest} size mismatch: expected ${expectedSize}, got ${buffer.length}`,
    );
  }

  // Verify the descriptor digest before the content is written to disk.
  const actualHash = createHash(digestInfo.algorithm)
    .update(buffer)
    .digest('hex');
  if (actualHash !== digestInfo.hex) {
    throw new Error(
      `Blob digest mismatch for ${digest}: expected ${digestInfo.algorithm}:${digestInfo.hex}, got ${digestInfo.algorithm}:${actualHash}`,
    );
  }

  return buffer;
}
