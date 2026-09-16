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
import { isIP } from 'node:net';
import type { ImageRef, OciManifest, RegistryCredentials } from './types';
import { MAX_BLOB_SIZE, FETCH_TIMEOUT_MS } from './types';

const MAX_MANIFEST_SIZE = 5 * 1024 * 1024;
const OCI_REGISTRY_PATTERN =
  /^(?:\[[0-9a-fA-F:]+\]|[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?)(?::\d{1,5})?$/;
const OCI_REPOSITORY_PATTERN =
  /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*(?:\/[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*)*$/;
const OCI_TAG_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;
const DIGEST_PATTERN = /^(sha256|sha512):([0-9a-fA-F]+)$/;
const MAX_REDIRECTS = 3;

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
  let repoAndRef = cleaned.substring(firstSlash + 1);

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

  // Check for digest reference (@sha256:...), including tag@digest.
  const atIdx = repoAndRef.indexOf('@');
  let tag = 'latest';
  if (atIdx !== -1) {
    let repository = repoAndRef.substring(0, atIdx);
    const digest = repoAndRef.substring(atIdx + 1);
    const digestMatch = DIGEST_PATTERN.exec(digest);
    if (
      !digestMatch ||
      digestMatch[2].length !== (digestMatch[1] === 'sha256' ? 64 : 128)
    ) {
      throw new InputError(
        `Invalid image reference "${ref}": digest must be a valid sha256 or sha512 digest`,
      );
    }

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

    if (!OCI_TAG_PATTERN.test(tag)) {
      throw new InputError(
        `Invalid image reference "${ref}": tag must be a valid OCI tag`,
      );
    }

    if (!OCI_REPOSITORY_PATTERN.test(repository)) {
      throw new InputError(
        `Invalid image reference "${ref}": repository must be a valid OCI repository name`,
      );
    }

    return { registry, repository, tag, digest };
  }

  // Check for tag — the tag follows the last colon in the repo portion
  const colonIdx = repoAndRef.lastIndexOf(':');
  if (colonIdx !== -1) {
    tag = repoAndRef.substring(colonIdx + 1);
    repoAndRef = repoAndRef.substring(0, colonIdx);
    if (!tag) {
      throw new InputError(
        `Invalid image reference "${ref}": tag must not be empty`,
      );
    }
    if (!OCI_TAG_PATTERN.test(tag)) {
      throw new InputError(
        `Invalid image reference "${ref}": tag must be a valid OCI tag`,
      );
    }
  }

  if (!OCI_REPOSITORY_PATTERN.test(repoAndRef)) {
    throw new InputError(
      `Invalid image reference "${ref}": repository must be a valid OCI repository name`,
    );
  }

  return { registry, repository: repoAndRef, tag };
}

/**
 * Parses a WWW-Authenticate header value to extract bearer token
 * challenge parameters (realm, service, scope).
 */
function parseBearerChallenge(
  header: string,
): { realm: string; service?: string; scope?: string } | undefined {
  const match = /^Bearer\s+(.+)/i.exec(header);
  if (!match) {
    return undefined;
  }

  const params: Record<string, string> = {};
  for (const paramMatch of match[1].matchAll(/([a-z]+)="([^"]*)"/gi)) {
    params[paramMatch[1]] = paramMatch[2];
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
): Promise<string | undefined> {
  const url = new URL(challenge.realm);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Registry token realm must use HTTPS without credentials');
  }
  if (credentials && registryHost && url.hostname !== registryHost) {
    if (!credentials.tokenRealm) {
      throw new Error(
        'Registry token realm differs from the registry host; configure credentials.tokenRealm explicitly',
      );
    }
    const configuredRealm = new URL(credentials.tokenRealm);
    if (
      configuredRealm.protocol !== 'https:' ||
      configuredRealm.origin !== url.origin ||
      configuredRealm.pathname !== url.pathname
    ) {
      throw new Error('Registry token realm is not the configured token realm');
    }
  }
  if (challenge.service) {
    url.searchParams.set('service', challenge.service);
  }
  if (challenge.scope) {
    url.searchParams.set('scope', challenge.scope);
  }

  logger.debug('Requesting bearer token');

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'error',
    headers: credentials
      ? {
          Authorization: `Basic ${Buffer.from(
            `${credentials.username}:${credentials.password}`,
          ).toString('base64')}`,
        }
      : undefined,
  });

  if (!response.ok) {
    logger.warn(
      `Bearer token request failed: ${response.status} ${response.statusText}`,
    );
    return undefined;
  }

  const body = (await readResponseJson(response, 1024 * 1024)) as {
    token?: string;
    access_token?: string;
  } | null;
  return body?.token ?? body?.access_token;
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
): Promise<Response> {
  const headers = {
    ...((init.headers ?? {}) as Record<string, string>),
    ...(credentials
      ? {
          Authorization: `Basic ${Buffer.from(
            `${credentials.username}:${credentials.password}`,
          ).toString('base64')}`,
        }
      : {}),
  };
  const response = await fetchWithRedirects(url, {
    ...init,
    headers,
    redirect: 'error',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (response.status !== 401) {
    return response;
  }

  const wwwAuth = response.headers.get('www-authenticate');
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
    new URL(url).hostname,
  );
  if (!token) {
    return response;
  }

  logger.debug('Retrying request with bearer token');
  return fetchWithRedirects(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
    redirect: 'error',
  });
}

/**
 * Follows the HTTPS redirects commonly used by registries for blob storage,
 * while never forwarding registry credentials to another origin.
 */
async function fetchWithRedirects(
  url: string,
  init: RequestInit,
): Promise<Response> {
  let currentUrl = new URL(url);
  let headers = { ...((init.headers ?? {}) as Record<string, string>) };

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl.toString(), {
      ...init,
      headers,
      redirect: 'manual',
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }
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
      isIP(nextUrl.hostname)
    ) {
      throw new Error('Registry redirect target must be a public HTTPS URL');
    }
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

async function readResponseBuffer(
  response: Response,
  maxSize: number,
): Promise<Buffer> {
  const contentLength = response.headers?.get('content-length');
  if (contentLength) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      throw new Error('Registry response has an invalid Content-Length header');
    }
    if (declaredLength > maxSize) {
      throw new Error(
        `Registry response size ${declaredLength} exceeds maximum allowed size ${maxSize}`,
      );
    }
  }

  if (response.body) {
    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let totalSize = 0;
    let done = false;
    try {
      while (!done) {
        const result = await reader.read();
        if (result.done) {
          done = true;
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

  if (typeof response.arrayBuffer !== 'function') {
    throw new Error('Registry response does not contain a readable body');
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxSize) {
    throw new Error(
      `Registry response size ${buffer.length} exceeds maximum allowed size ${maxSize}`,
    );
  }
  return buffer;
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
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch manifest for ${imageRef.registry}/${imageRef.repository}:${imageRef.tag}: ${response.status} ${response.statusText}`,
    );
  }

  const manifestBuffer = await readResponseBuffer(response, MAX_MANIFEST_SIZE);
  const manifest = JSON.parse(manifestBuffer.toString('utf-8')) as
    | (OciManifest & {
        manifests?: unknown[];
      })
    | undefined;

  if (imageRef.digest) {
    const digestMatch = DIGEST_PATTERN.exec(imageRef.digest);
    if (
      !digestMatch ||
      digestMatch[2].length !== (digestMatch[1] === 'sha256' ? 64 : 128)
    ) {
      throw new Error(`Invalid manifest digest ${imageRef.digest}`);
    }
    const actualDigest = createHash(digestMatch[1])
      .update(manifestBuffer)
      .digest('hex');
    if (actualDigest !== digestMatch[2].toLowerCase()) {
      throw new Error(
        `Manifest digest mismatch for ${imageRef.digest}: got ${digestMatch[1]}:${actualDigest}`,
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
      `Image ${imageRef.registry}/${imageRef.repository}:${imageRef.tag} returned a manifest list (multi-platform image index). ` +
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
 * Downloads a blob (layer) from the registry, verifies its SHA-256
 * digest, and returns it as a Buffer.
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
): Promise<Buffer> {
  const digestMatch = DIGEST_PATTERN.exec(digest);
  if (
    !digestMatch ||
    digestMatch[2].length !== (digestMatch[1] === 'sha256' ? 64 : 128)
  ) {
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

  const response = await registryFetch(url, {}, logger, credentials);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch blob ${digest} from ${imageRef.registry}/${imageRef.repository}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await readResponseBuffer(response, MAX_BLOB_SIZE);

  if (buffer.length > MAX_BLOB_SIZE) {
    throw new Error(
      `Blob ${digest} actual size ${buffer.length} exceeds maximum allowed size ${MAX_BLOB_SIZE}`,
    );
  }

  if (buffer.length !== expectedSize) {
    throw new Error(
      `Blob ${digest} size mismatch: expected ${expectedSize}, got ${buffer.length}`,
    );
  }

  // Verify the descriptor digest before the content is written to disk.
  const algorithm = digestMatch[1] as 'sha256' | 'sha512';
  const expectedHash = digestMatch[2].toLowerCase();
  const actualHash = createHash(algorithm).update(buffer).digest('hex');
  if (actualHash !== expectedHash) {
    throw new Error(
      `Blob digest mismatch for ${digest}: expected ${algorithm}:${expectedHash}, got ${algorithm}:${actualHash}`,
    );
  }

  return buffer;
}
