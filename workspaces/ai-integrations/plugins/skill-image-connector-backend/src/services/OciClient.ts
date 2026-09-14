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
import { createHash } from 'crypto';
import type { ImageRef, OciManifest } from './types';
import { MAX_BLOB_SIZE, FETCH_TIMEOUT_MS } from './types';

/**
 * Parses an image reference string into its components.
 *
 * Supports formats:
 *   registry/repo:tag
 *   registry/repo@sha256:digest
 *   registry/repo          (tag defaults to "latest")
 */
export function parseImageRef(ref: string): ImageRef {
  if (!ref || !ref.trim()) {
    throw new InputError(
      'Invalid image reference: reference must not be empty',
    );
  }

  // Strip any oci:// prefix
  const cleaned = ref.replace(/^oci:\/\//, '');

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

  // Check for digest reference (@sha256:...)
  const atIdx = repoAndRef.indexOf('@');
  if (atIdx !== -1) {
    const repository = repoAndRef.substring(0, atIdx);
    const digest = repoAndRef.substring(atIdx + 1);
    if (!digest.startsWith('sha256:') && !digest.startsWith('sha512:')) {
      throw new InputError(
        `Invalid image reference "${ref}": digest must start with a hash algorithm (e.g. sha256:)`,
      );
    }
    return { registry, repository, tag: 'latest', digest };
  }

  // Check for tag — the tag follows the last colon in the repo portion
  let tag = 'latest';
  const colonIdx = repoAndRef.lastIndexOf(':');
  if (colonIdx !== -1) {
    tag = repoAndRef.substring(colonIdx + 1);
    repoAndRef = repoAndRef.substring(0, colonIdx);
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
  const match = header.match(/^Bearer\s+(.+)/i);
  if (!match) {
    return undefined;
  }

  const params: Record<string, string> = {};
  const paramRegex = /(\w+)="([^"]*)"/g;
  for (
    let paramMatch = paramRegex.exec(match[1]);
    paramMatch !== null;
    paramMatch = paramRegex.exec(match[1])
  ) {
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
 * Attempts to obtain a bearer token from the registry's token
 * endpoint using the anonymous (pull-only) flow described in the
 * Docker Registry Token Authentication spec.
 */
async function fetchBearerToken(
  challenge: { realm: string; service?: string; scope?: string },
  logger: LoggerService,
): Promise<string | undefined> {
  const url = new URL(challenge.realm);
  if (challenge.service) {
    url.searchParams.set('service', challenge.service);
  }
  if (challenge.scope) {
    url.searchParams.set('scope', challenge.scope);
  }

  logger.debug(`Requesting bearer token from ${url.toString()}`);

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    logger.warn(
      `Bearer token request failed: ${response.status} ${response.statusText}`,
    );
    return undefined;
  }

  const body = (await response.json()) as { token?: string };
  return body.token;
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
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
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

  const token = await fetchBearerToken(challenge, logger);
  if (!token) {
    return response;
  }

  logger.debug('Retrying request with bearer token');
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      ...((init.headers as Record<string, string>) ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
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
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch manifest for ${imageRef.registry}/${imageRef.repository}:${imageRef.tag}: ${response.status} ${response.statusText}`,
    );
  }

  const manifest = (await response.json()) as OciManifest & {
    manifests?: unknown[];
  };

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
): Promise<Buffer> {
  if (expectedSize > MAX_BLOB_SIZE) {
    throw new Error(
      `Blob ${digest} declared size ${expectedSize} exceeds maximum allowed size ${MAX_BLOB_SIZE}`,
    );
  }

  const url = `https://${imageRef.registry}/v2/${imageRef.repository}/blobs/${digest}`;
  logger.debug(`Fetching blob ${digest} from ${url}`);

  const response = await registryFetch(url, {}, logger);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch blob ${digest} from ${imageRef.registry}/${imageRef.repository}: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_BLOB_SIZE) {
    throw new Error(
      `Blob ${digest} actual size ${buffer.length} exceeds maximum allowed size ${MAX_BLOB_SIZE}`,
    );
  }

  // Verify digest
  if (digest.startsWith('sha256:')) {
    const expectedHash = digest.substring('sha256:'.length);
    const actualHash = createHash('sha256').update(buffer).digest('hex');
    if (actualHash !== expectedHash) {
      throw new Error(
        `Blob digest mismatch for ${digest}: expected sha256:${expectedHash}, got sha256:${actualHash}`,
      );
    }
  }

  return buffer;
}
