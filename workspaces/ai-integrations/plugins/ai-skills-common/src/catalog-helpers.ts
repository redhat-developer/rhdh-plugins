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

/**
 * Pure identity, tag, version, and source-reference helpers for
 * catalog entity mapping (design D5).
 *
 * These helpers are consumed by the common catalog provider and have
 * no network, database, or Catalog side effects.
 *
 * @packageDocumentation
 */

import { createHash } from 'crypto';

import { CATALOG_TAG_PATTERN, MAX_TAG_LENGTH } from './normalizer';
import type { SkillSourceType } from './types';
import { isValidDigest } from './validation';

// ─── Identity ────────────────────────────────────────────────────────

/**
 * The identity tuple used for deterministic catalog entity naming.
 *
 * @public
 */
export interface IdentityTuple {
  /** Source type discriminator. */
  type: SkillSourceType;
  /** Configured source ID. */
  id: string;
  /** Stable record key within the source. */
  key: string;
}

/**
 * Computes the deterministic catalog entity name from an identity tuple.
 *
 * Per design D5, the name is `skill-` followed by the first 56 lowercase
 * hex digits of the SHA-256 hash of the compact JSON UTF-8 encoding of
 * `[source.type, source.id, record.key]`.
 *
 * Names, versions, tags, and content digests do not affect entity
 * identity. A source ID or native key change creates a different name.
 *
 * @remarks
 * The hashing algorithm (SHA-256 of compact JSON identity tuple, truncated
 * to 56 hex digits) is part of the stable public contract. Persisted
 * entities depend on this producing the same output for the same input.
 * Any change to the algorithm constitutes a breaking (major) change.
 *
 * @public
 */
export function computeCatalogName(tuple: IdentityTuple): string {
  const payload = JSON.stringify([tuple.type, tuple.id, tuple.key]);
  const hash = createHash('sha256').update(payload, 'utf8').digest('hex');
  return `skill-${hash.substring(0, 56)}`;
}

// ─── Tag normalization ───────────────────────────────────────────────

/**
 * Result of tag normalization.
 *
 * @public
 */
export interface NormalizeTagsResult {
  /** Valid, deduplicated tags in lowercase. */
  tags: string[];
  /** Diagnostic messages for tags that were dropped. */
  diagnostics: string[];
}

/**
 * Normalizes tags for catalog use per design D3/D5.
 *
 * Trims whitespace, lowercases, deduplicates, and retains only values
 * accepted by {@link CATALOG_TAG_PATTERN} (per design D3/D5). Invalid or
 * overlength values are omitted with a diagnostic — tags are never
 * truncated and replacement characters are never synthesized.
 *
 * @public
 */
export function normalizeTags(tags: string[]): NormalizeTagsResult {
  const seen = new Set<string>();
  const result: string[] = [];
  const diagnostics: string[] = [];

  for (const raw of tags) {
    const trimmed = raw.trim().toLocaleLowerCase('en-US');

    if (trimmed.length === 0) {
      diagnostics.push(`tag '${raw}': empty after trim, skipped`);
      continue;
    }

    if (seen.has(trimmed)) {
      diagnostics.push(`tag '${raw}': duplicate '${trimmed}', skipped`);
      continue;
    }

    if (trimmed.length > MAX_TAG_LENGTH) {
      diagnostics.push(
        `tag '${raw}': length ${trimmed.length} exceeds maximum ${MAX_TAG_LENGTH}, skipped`,
      );
      seen.add(trimmed);
      continue;
    }

    if (!CATALOG_TAG_PATTERN.test(trimmed)) {
      diagnostics.push(
        `tag '${raw}': '${trimmed}' does not match catalog tag pattern, skipped`,
      );
      seen.add(trimmed);
      continue;
    }

    seen.add(trimmed);
    result.push(trimmed);
  }

  return { tags: result, diagnostics };
}

// ─── SemVer fallback ─────────────────────────────────────────────────

/**
 * SemVer validation regex per https://semver.org/#is-there-a-suggested-regular-expression-to-check-a-semver-string
 *
 * Matches: MAJOR.MINOR.PATCH with optional pre-release and build metadata.
 */
const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Resolves a catalog version from a declared version string and record
 * digest, per design D5.
 *
 * Removes at most one leading `v`, validates the result as SemVer, and
 * falls back to `0.0.0+<first 12 hex digits of record.digest>` when no
 * valid SemVer is present.
 *
 * @param declaredVersion - The raw version string from the record, or undefined.
 * @param digest - The record's content digest in `sha256:<64 hex>` format.
 * @returns A valid SemVer string.
 *
 * @public
 */
export function resolveVersion(
  declaredVersion: string | undefined,
  digest: string,
): string {
  // Validate digest upfront, consistent with buildOciRef and buildNpxRef.
  if (!isValidDigest(digest)) {
    throw new Error(`invalid digest: ${digest}`);
  }

  if (declaredVersion !== undefined && declaredVersion !== '') {
    let candidate = declaredVersion;
    if (candidate.startsWith('v')) {
      candidate = candidate.substring(1);
    }
    if (SEMVER_RE.test(candidate)) {
      return candidate;
    }
  }

  // Fallback: 0.0.0+<first 12 hex digits of digest>
  // digest format is sha256:<64 hex>, so hex starts at index 7
  const hex = digest.substring(7, 19);
  return `0.0.0+${hex}`;
}

// ─── OCI references ──────────────────────────────────────────────────

/**
 * A parsed OCI skill reference.
 *
 * @public
 */
export interface OciRef {
  /** Full OCI URI: `oci://<registry>/<repository>@sha256:<hex>`. */
  uri: string;
  /** Registry host (and optional port). */
  registry: string;
  /** Repository path (may contain slashes). */
  repository: string;
  /** Content digest in `sha256:<64 hex>` format. */
  digest: string;
}

/**
 * OCI URI pattern: `oci://<registry>/<repository>@sha256:<64 hex digits>`.
 */
const OCI_URI_RE = /^oci:\/\/([^/]+)\/(.+)@(sha256:[0-9a-f]{64})$/;

/**
 * Constructs a digest-addressed OCI reference URI.
 *
 * The returned URI has the form `oci://<registry>/<repository>@sha256:<hex>`.
 * The provided digest must be a valid SHA-256 digest string.
 *
 * @param registry - Registry host (e.g., `quay.io`).
 * @param repository - Repository path (e.g., `octo/hello-world-skill`).
 * @param digest - Content digest in `sha256:<64 hex>` format.
 * @returns The constructed OCI URI.
 * @throws If the digest is invalid.
 *
 * @public
 */
export function buildOciRef(
  registry: string,
  repository: string,
  digest: string,
): string {
  if (!isValidDigest(digest)) {
    throw new Error(`invalid digest: ${digest}`);
  }
  if (!registry || !repository) {
    throw new Error(
      `registry and repository must be non-empty: registry=${JSON.stringify(
        registry,
      )}, repository=${JSON.stringify(repository)}`,
    );
  }
  return `oci://${registry}/${repository}@${digest}`;
}

/**
 * Parses a digest-addressed OCI reference URI.
 *
 * Rejects URIs that do not match the `oci://<registry>/<repository>@sha256:<hex>`
 * pattern. When a `recordDigest` is provided, validates that the URI digest
 * agrees with the record digest.
 *
 * @param uri - The OCI URI to parse.
 * @param recordDigest - Optional record digest to verify agreement.
 * @returns The parsed OCI reference.
 * @throws If the URI is malformed or the digest does not agree.
 *
 * @public
 */
export function parseOciRef(uri: string, recordDigest?: string): OciRef {
  const match = OCI_URI_RE.exec(uri);
  if (!match) {
    throw new Error(`malformed OCI URI: ${uri}`);
  }

  const [, registry, repository, digest] = match;

  if (recordDigest !== undefined && digest !== recordDigest) {
    throw new Error(
      `OCI URI digest '${digest}' does not match record digest '${recordDigest}'`,
    );
  }

  return { uri, registry, repository, digest };
}

// ─── npx references ─────────────────────────────────────────────────

/**
 * A parsed npx skill reference.
 *
 * @public
 */
export interface NpxRef {
  /** Serialized reference: `<sourceUri>#<digest>`. */
  ref: string;
  /** The artifact source URL (HTTPS, no credentials or fragments). */
  sourceUri: string;
  /** Content digest in `sha256:<64 hex>` format. */
  digest: string;
}

/**
 * Query parameter names that indicate credentials or signed access tokens.
 * Individually rejected regardless of context.
 */
const SENSITIVE_QUERY_PARAMS: ReadonlySet<string> = new Set([
  'sig',
  'signature',
  'token',
  'access_token',
  'api_key',
  'apikey',
  'secret',
  'password',
  'private_token',
  'auth_token',
  'bearer_token',
  'x-amz-credential',
  'x-amz-signature',
  'x-amz-security-token',
  'x-goog-signature',
  'client_secret',
  'refresh_token',
]);

/**
 * Azure SAS token query parameters. These short, common names (`se`, `sp`,
 * `sv`, etc.) can appear in non-credential contexts, so they are only
 * rejected when {@link AZURE_SAS_CO_OCCURRENCE_THRESHOLD} or more appear
 * together — a strong signal of a signed URL.
 */
const AZURE_SAS_PARAMS: ReadonlySet<string> = new Set([
  'se', // expiry
  'sp', // permissions
  'spr', // protocol
  'sv', // version
  'ss', // services
  'srt', // resource types
  'st', // start time
]);

/** Minimum number of Azure SAS params that must co-occur to trigger rejection. */
const AZURE_SAS_CO_OCCURRENCE_THRESHOLD = 3;

/**
 * Checks whether a URL contains credentials (userinfo), fragments,
 * query-string credentials, or signed access tokens.
 *
 * @param url - The URL to inspect.
 * @param context - Optional context prefix for error messages (e.g., `"npx reference"`).
 * @throws If the URL contains sensitive elements.
 */
function rejectSensitiveUrl(url: URL, context?: string): void {
  const prefix = context ? `${context}: ` : '';

  if (url.username || url.password) {
    throw new Error(`${prefix}URL contains credentials`);
  }

  if (url.hash) {
    throw new Error(`${prefix}URL contains a fragment`);
  }

  let azureSasCount = 0;
  for (const [param] of url.searchParams) {
    const lower = param.toLocaleLowerCase('en-US');
    if (SENSITIVE_QUERY_PARAMS.has(lower)) {
      throw new Error(
        `${prefix}URL contains sensitive query parameter '${param}'`,
      );
    }
    if (AZURE_SAS_PARAMS.has(lower)) {
      azureSasCount++;
    }
  }

  if (azureSasCount >= AZURE_SAS_CO_OCCURRENCE_THRESHOLD) {
    throw new Error(
      `${prefix}URL contains Azure SAS token parameters (${azureSasCount} of ${AZURE_SAS_PARAMS.size} present)`,
    );
  }
}

/**
 * Constructs an npx skill reference from a verified artifact URL and digest.
 *
 * The reference has the form `<sourceUri>#<digest>` where `sourceUri` is an
 * absolute HTTPS URL without credentials or fragments, and `digest` is a
 * lowercase SHA-256 digest.
 *
 * Non-sensitive query parameters retain their original order.
 *
 * @param sourceUri - Absolute HTTPS artifact URL.
 * @param digest - Content digest in `sha256:<64 hex>` format.
 * @returns The serialized npx reference string.
 * @throws If the URL contains credentials, fragments, or sensitive params,
 *   or if the digest is invalid, or the URL is not HTTPS.
 *
 * @public
 */
export function buildNpxRef(sourceUri: string, digest: string): string {
  if (!isValidDigest(digest)) {
    throw new Error(`invalid digest: ${digest}`);
  }

  let url: URL;
  try {
    url = new URL(sourceUri);
  } catch {
    throw new Error('invalid URL');
  }

  if (url.protocol !== 'https:') {
    throw new Error('npx reference: URL must use HTTPS');
  }

  rejectSensitiveUrl(url, 'npx reference');

  // Serialize using URL API to normalize, preserving query order
  return `${url.href}#${digest}`;
}

/**
 * Parses an npx skill reference.
 *
 * Splits at the single literal `#` separator. Validates that the URL is
 * HTTPS, contains no credentials or fragments, and that the digest is a
 * valid SHA-256 digest.
 *
 * @param ref - The serialized npx reference (`<sourceUri>#<digest>`).
 * @returns The parsed npx reference.
 * @throws If the reference is malformed or the URL is sensitive.
 *
 * @public
 */
export function parseNpxRef(ref: string): NpxRef {
  // Split at the last '#' to separate URL from digest
  const hashIndex = ref.lastIndexOf('#');
  if (hashIndex === -1) {
    throw new Error("malformed npx reference (no '#' separator)");
  }

  const sourceUri = ref.substring(0, hashIndex);
  const digest = ref.substring(hashIndex + 1);

  if (!isValidDigest(digest)) {
    throw new Error('malformed npx reference: invalid digest');
  }

  let url: URL;
  try {
    url = new URL(sourceUri);
  } catch {
    throw new Error('malformed npx reference: invalid URL');
  }

  if (url.protocol !== 'https:') {
    throw new Error('npx reference: URL must use HTTPS');
  }

  rejectSensitiveUrl(url, 'npx reference');

  return { ref, sourceUri, digest };
}
