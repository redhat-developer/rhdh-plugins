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
 * Maximum length for Backstage metadata.name and annotation key
 * name segments.
 *
 * @internal
 */
export const MAX_NAME_LENGTH = 63;

/** FNV-1a 32-bit parameters for identity hash suffixes. */
const FNV1A_32_OFFSET_BASIS = 0x811c9dc5;
const FNV1A_32_PRIME = 0x01000193;

/**
 * Default identity prefix when no caller override is supplied.
 *
 * @public
 */
export const DEFAULT_PREFIX = 'mcp.registry';

/**
 * Sanitize a single identity segment per the D3 per-segment rules
 * (see openspec/changes/mcp-registry-server-mapping/design.md § D3):
 * - Lowercase
 * - Replace every character outside a-z, 0-9, ., _, - with -
 * - If segment begins with _, replace leading _ with x
 * - Boundary normalization: while first/last char is not alphanumeric,
 *   replace with x
 *
 * @public
 */
export function sanitizeSegment(segment: string): string {
  // Lowercase
  let result = segment.toLocaleLowerCase('en-US');

  // Replace illegal characters with -
  result = result.replace(/[^a-z0-9._-]/g, '-');

  // Leading _ → x
  if (result.startsWith('_')) {
    result = `x${result.slice(1)}`;
  }

  // Boundary normalization: first and last char must be alphanumeric
  result = normalizeBoundaries(result);

  return result;
}

/**
 * Boundary normalization: while the first or last character is not
 * alphanumeric (a-z, 0-9), replace it with 'x'.
 *
 * @internal
 */
export function normalizeBoundaries(s: string): string {
  if (s.length === 0) {
    return s;
  }

  const chars = s.split('');

  // Fix leading non-alphanumeric
  if (chars.length > 0 && !/^[a-z0-9]$/.test(chars[0])) {
    chars[0] = 'x';
  }

  // Fix trailing non-alphanumeric
  if (chars.length > 0 && !/^[a-z0-9]$/.test(chars.at(-1)!)) {
    chars[chars.length - 1] = 'x';
  }

  return chars.join('');
}

/**
 * FNV-1a 32-bit hash (pure JS). Used for stable, non-cryptographic
 * disambiguation suffixes only.
 *
 * @internal
 */
export function fnv1a32(input: string): number {
  let hash = FNV1A_32_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV1A_32_PRIME);
  }
  return hash >>> 0;
}

/**
 * Stable 8-character lowercase hex suffix for identity disambiguation.
 * FNV-1a 32-bit over the NUL-separated tuple (effective prefix, raw
 * canonical name, raw version — not sanitized segments).
 *
 * @public
 */
export function computeIdentityHashSuffix(
  prefix: string,
  name: string,
  version: string,
): string {
  return fnv1a32(`${prefix}\0${name}\0${version}`)
    .toString(16)
    .padStart(8, '0');
}

/**
 * Derive `metadata.name` from the effective prefix, canonical name,
 * and version per D4
 * (see openspec/changes/mcp-registry-server-mapping/design.md § D4).
 *
 * @public
 */
export function deriveMetadataName(
  canonicalName: string,
  version: string,
  callerPrefix?: string,
): string {
  // Determine effective prefix
  let effectivePrefix = DEFAULT_PREFIX;
  if (
    callerPrefix !== undefined &&
    callerPrefix !== null &&
    callerPrefix.trim() !== ''
  ) {
    const sanitizedOverride = sanitizeSegment(callerPrefix.trim());
    if (sanitizedOverride.length > 0) {
      effectivePrefix = callerPrefix.trim();
    }
  }

  // Sanitize each segment independently
  const sanitizedPrefix = sanitizeSegment(effectivePrefix);
  const sanitizedName = sanitizeSegment(canonicalName);
  const sanitizedVersion = sanitizeSegment(version);

  // Check if any segment was mutated by sanitization
  const prefixMutated = sanitizedPrefix !== effectivePrefix;
  const nameMutated = sanitizedName !== canonicalName;
  const versionMutated = sanitizedVersion !== version;
  const anyMutated = prefixMutated || nameMutated || versionMutated;

  // Join with double underscore
  const candidateStem = `${sanitizedPrefix}__${sanitizedName}__${sanitizedVersion}`;

  // Apply boundary normalization on the full candidate
  const normalizedCandidate = normalizeBoundaries(candidateStem);

  // Determine if hash suffix is needed
  const needsHash = anyMutated || normalizedCandidate.length > MAX_NAME_LENGTH;

  if (!needsHash && normalizedCandidate.length <= MAX_NAME_LENGTH) {
    return normalizedCandidate;
  }

  // Append hash suffix
  const hashSuffix = `-${computeIdentityHashSuffix(
    effectivePrefix,
    canonicalName,
    version,
  )}`;

  // Truncate stem so final name is <= 63 characters
  const maxStemLength = MAX_NAME_LENGTH - hashSuffix.length;
  let truncatedStem = normalizedCandidate.slice(0, maxStemLength);

  // Re-apply boundary normalization on the truncated stem's trailing char
  truncatedStem = normalizeBoundaries(truncatedStem);

  return `${truncatedStem}${hashSuffix}`;
}
