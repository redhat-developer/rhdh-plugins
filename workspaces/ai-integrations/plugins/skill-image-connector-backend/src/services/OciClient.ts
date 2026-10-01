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
import type {
  ImageRef,
  OciManifest,
  RegistryCredentials,
  SkillImageOptions,
} from './types';
import {
  DEFAULT_SKILL_IMAGE_OPTIONS,
  MAX_MANIFEST_SIZE,
  MAX_TOKEN_RESPONSE_SIZE,
} from './types';
import {
  cancelResponseBody,
  fetchWithRedirects,
  readResponseBuffer,
  readResponseJson,
  withRequestTimeout,
  HttpResponseError,
} from './HttpClient';

export const OCI_REGISTRY_PATTERN =
  /^(?:\[[0-9a-fA-F:]+\]|[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?)(?::\d{1,5})?$/;
const OCI_REPOSITORY_PATTERN =
  /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*(?:\/[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*)*$/;
const OCI_TAG_PATTERN = /^\w[\w.-]{0,127}$/;
const DIGEST_PATTERN = /^(sha256|sha512):([0-9a-fA-F]+)$/;

type DigestInfo = {
  algorithm: 'sha256' | 'sha512';
  hex: string;
};

type ParsedImageReference = Pick<ImageRef, 'repository' | 'tag'> & {
  digest?: string;
};

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

export function validateTag(tag: string, ref: string): void {
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
    // Preserve 404 for the caller's source-specific reporting policy rather
    // than warning here and masking it with the original registry 401.
    if (
      response.status === 404 ||
      (response.status >= 500 && response.status < 600)
    ) {
      throw new HttpResponseError(
        `Bearer token request failed: ${response.status} ${response.statusText}`,
        response.status,
      );
    }
    logger.warn(
      `Bearer token request failed: ${response.status} ${response.statusText}`,
    );
    return undefined;
  }

  let body: { token?: unknown; access_token?: unknown } | null;
  try {
    body = (await readResponseJson(response, MAX_TOKEN_RESPONSE_SIZE)) as {
      token?: unknown;
      access_token?: unknown;
    } | null;
  } catch (error) {
    signal?.throwIfAborted();
    if (!(error instanceof SyntaxError)) throw error;
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
  credentials: RegistryCredentials | undefined,
  signal: AbortSignal,
): Promise<Response> {
  const requestSignal = signal;
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
  options: SkillImageOptions = DEFAULT_SKILL_IMAGE_OPTIONS,
): Promise<OciManifest> {
  return withRequestTimeout(
    async requestSignal => {
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
        requestSignal,
      );

      if (!response.ok) {
        await cancelResponseBody(response);
        throw new HttpResponseError(
          `Failed to fetch manifest for ${imageReference(imageRef)}: ${
            response.status
          } ${response.statusText}`,
          response.status,
        );
      }

      const manifestBuffer = await readResponseBuffer(
        response,
        MAX_MANIFEST_SIZE,
      );
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
        mediaType ===
          'application/vnd.docker.distribution.manifest.list.v2+json' ||
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
    },
    signal,
    options.fetchTimeoutMs,
  );
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
  options: SkillImageOptions = DEFAULT_SKILL_IMAGE_OPTIONS,
): Promise<Buffer> {
  return withRequestTimeout(
    async requestSignal => {
      const digestInfo = parseDigest(digest);
      if (!digestInfo) {
        throw new Error(
          `Unsupported or invalid blob digest ${digest}; expected a sha256 or sha512 digest`,
        );
      }
      if (!Number.isSafeInteger(expectedSize) || expectedSize < 0) {
        throw new Error(`Blob ${digest} has an invalid declared size`);
      }
      if (expectedSize > options.maxBlobSizeBytes) {
        throw new Error(
          `Blob ${digest} declared size ${expectedSize} exceeds maximum allowed size ${options.maxBlobSizeBytes}`,
        );
      }

      const url = `https://${imageRef.registry}/v2/${imageRef.repository}/blobs/${digest}`;
      logger.debug(`Fetching blob ${digest} from ${url}`);

      const response = await registryFetch(
        url,
        {},
        logger,
        credentials,
        requestSignal,
      );

      if (!response.ok) {
        await cancelResponseBody(response);
        throw new HttpResponseError(
          `Failed to fetch blob ${digest} from ${imageRef.registry}/${imageRef.repository}: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      const buffer = await readResponseBuffer(
        response,
        options.maxBlobSizeBytes,
      );

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
    },
    signal,
    options.fetchTimeoutMs,
  );
}
