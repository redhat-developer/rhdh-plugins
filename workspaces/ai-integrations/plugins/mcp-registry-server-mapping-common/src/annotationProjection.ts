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

import {
  fnv1a32,
  MAX_NAME_LENGTH,
  normalizeBoundaries,
  sanitizeSegment,
} from './identity';
import type { McpServerDocument } from './types';
import { requireBooleanProperty } from './util';

/** Annotation key prefix for projected attributes. */
const ANNOTATION_PREFIX = 'modelcontextprotocol.io/';

/**
 * Annotation key construction helpers.
 *
 * Helpers below are exported for direct unit-testing only; they are
 * excluded from the public API surface (not re-exported in index.ts
 * and omitted from report.api.md).
 */

/**
 * Compute stable 8-character hex hash suffix from source path
 * segments (NUL-separated for unambiguous hashing).
 *
 * Exported for unit testing only.
 *
 * @internal
 */
export function computeAnnotationHashSuffix(pathSegments: string[]): string {
  return fnv1a32(pathSegments.join('\0')).toString(16).padStart(8, '0');
}

/**
 * Build the sanitized, joined, boundary-normalized annotation name
 * segment from path segments — without a hash suffix.
 *
 * Exported for unit testing only.
 *
 * @internal
 */
export function buildBaseNameSegment(pathSegments: string[]): string {
  const sanitized = pathSegments.map(seg => {
    // Array indices are unchanged decimal numerals
    if (/^\d+$/.test(seg)) {
      return seg;
    }
    return sanitizeSegment(seg);
  });

  let joined = sanitized.join('.');
  joined = normalizeBoundaries(joined);
  return joined;
}

/**
 * Build the annotation name segment with a hash suffix, truncating
 * the stem when necessary so the result is at most 63 characters.
 *
 * Exported for unit testing only.
 *
 * @internal
 */
export function buildHashedNameSegment(pathSegments: string[]): string {
  const base = buildBaseNameSegment(pathSegments);
  const hashSuffix = `-${computeAnnotationHashSuffix(pathSegments)}`;

  const totalLength = base.length + hashSuffix.length;
  if (totalLength <= MAX_NAME_LENGTH) {
    return `${base}${hashSuffix}`;
  }

  // Truncate base to make room for the hash suffix
  const maxStem = MAX_NAME_LENGTH - hashSuffix.length;
  let truncated = base.slice(0, maxStem);
  truncated = normalizeBoundaries(truncated);
  return `${truncated}${hashSuffix}`;
}

/**
 * D11 URL refusal for projected scalars.
 *
 * Check if a scalar value is a D11-refused URL.
 *
 * A string that WHATWG-parses as an absolute URL with a non-http/https
 * scheme is refused. Failed URL parses (non-URL strings such as
 * package identifiers and descriptions) are NOT refused — a failed
 * absolute-URL parse is not a reason to drop them.
 *
 * Exported for unit testing only.
 *
 * @internal
 */
export function isRefusedUrl(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    // It IS a valid absolute URL — refused when scheme is not http/https
    const protocol = parsed.protocol.toLocaleLowerCase('en-US');
    return protocol !== 'http:' && protocol !== 'https:';
  } catch {
    // Not a valid absolute URL (relative path, bare string, etc.)
    return false;
  }
}

/**
 * Fields redacted from isSecret: true Input objects (D9).
 *
 * This set must be kept in sync with the upstream MCP Registry Input
 * schema. If the schema adds new secret-bearing fields, they must be
 * added here to prevent secret leakage into projected annotations.
 */
const SECRET_REDACTED_FIELDS = new Set(['default', 'value', 'choices']);

/** Candidate scalar collected during the walk. */
interface ScalarCandidate {
  /** Path segments from root to this leaf. */
  segments: string[];
  /** Dot-joined path string (for consumed-path lookup). */
  dotPath: string;
  /** Serialized annotation value. */
  value: string;
}

/** Path state while walking a document subtree. */
type ScalarWalkPath = Pick<ScalarCandidate, 'segments' | 'dotPath'>;

type ScalarWalkContext = ScalarWalkPath & {
  candidates: ScalarCandidate[];
  consumed: Set<string>;
};

/**
 * Extend a walk path with one segment (array index or object key).
 *
 * Exported for unit testing only.
 *
 * @internal
 */
export function buildChildWalkPath(
  walk: ScalarWalkPath,
  segment: string,
): ScalarWalkPath {
  const dotPath =
    walk.dotPath.length > 0 ? `${walk.dotPath}.${segment}` : segment;
  return { segments: [...walk.segments, segment], dotPath };
}

/**
 * Whether a field on an `isSecret: true` Input object must not be projected (D9).
 *
 * Exported for unit testing only.
 *
 * @internal
 */
export function shouldSkipSecretRedactedField(
  isSecret: boolean,
  fieldKey: string,
): boolean {
  return isSecret && SECRET_REDACTED_FIELDS.has(fieldKey);
}

/** Record one scalar leaf unless its path is consumed or the value is a D11-refused URL. */
function collectScalarLeaf(node: unknown, walk: ScalarWalkContext): void {
  // Skip consumed paths (already lifted by direct mapping)
  if (walk.consumed.has(walk.dotPath)) {
    return;
  }

  // D11: refuse URLs with non-http/https schemes
  if (isRefusedUrl(node)) {
    return;
  }

  // Serialize to string (D12: false → "false", 0 → "0", "" → "")
  walk.candidates.push({
    segments: [...walk.segments],
    dotPath: walk.dotPath,
    value: String(node),
  });
}

/** Walk array children; D12 empty array omits the whole subtree. */
function collectScalarsFromArray(
  node: unknown[],
  walk: ScalarWalkContext,
): void {
  // D12: empty array → no annotations for this subtree
  if (node.length === 0) {
    return;
  }

  for (let i = 0; i < node.length; i++) {
    const childWalk = buildChildWalkPath(walk, String(i));
    collectScalars(node[i], childWalk, walk.candidates, walk.consumed);
  }
}

/** Walk object children; D9 secret redaction and D12 empty object omission. */
function collectScalarsFromObject(
  obj: Record<string, unknown>,
  walk: ScalarWalkContext,
): void {
  const keys = Object.keys(obj);

  // D12: empty object → no annotations for this subtree
  if (keys.length === 0) {
    return;
  }

  // D9: check if this is an isSecret: true Input object (omit => false)
  const isSecret = Object.prototype.hasOwnProperty.call(obj, 'isSecret')
    ? requireBooleanProperty(obj, 'isSecret', walk.dotPath)
    : false;

  for (const key of keys) {
    // D9: skip redacted fields for secret inputs
    if (shouldSkipSecretRedactedField(isSecret, key)) {
      continue;
    }

    const childWalk = buildChildWalkPath(walk, key);
    collectScalars(obj[key], childWalk, walk.candidates, walk.consumed);
  }
}

/**
 * Recursively walk a value, collecting non-consumed scalar leaves.
 *
 * Applies D9 secret redaction, D11 URL refusal, and D12 null/empty
 * omission inline during the walk.
 */
function collectScalars(
  node: unknown,
  path: ScalarWalkPath,
  candidates: ScalarCandidate[],
  consumed: Set<string>,
): void {
  const walk: ScalarWalkContext = { ...path, candidates, consumed };

  // D12: null or undefined → no annotation
  if (node === null || node === undefined) {
    return;
  }

  if (Array.isArray(node)) {
    collectScalarsFromArray(node, walk);
    return;
  }

  if (typeof node === 'object') {
    collectScalarsFromObject(node as Record<string, unknown>, walk);
    return;
  }

  // --- Scalar leaf (string, number, boolean) ---
  collectScalarLeaf(node, walk);
}

/**
 * Walk a JSON-like value and return scalar leaf candidates (walker unit tests).
 *
 * @internal Exported for unit testing only.
 */
export function collectScalarCandidates(
  node: unknown,
  consumedPaths: string[] = [],
): ScalarCandidate[] {
  const candidates: ScalarCandidate[] = [];
  collectScalars(
    node,
    { segments: [], dotPath: '' },
    candidates,
    new Set(consumedPaths),
  );
  return candidates;
}

/* ------------------------------------------------------------------ */
/*  Annotation resolution (projectAnnotations steps 2–5)               */
/* ------------------------------------------------------------------ */

/** Scalar candidate with a computed base annotation key (step 2). */
type CandidateWithBaseKey = ScalarCandidate & {
  baseKey: string;
  needsTruncationHash: boolean;
};

/**
 * Compute base annotation keys for collected scalar candidates (step 2).
 *
 * @internal Exported for unit testing only.
 */
export function attachBaseKeysToCandidates(
  candidates: ScalarCandidate[],
): CandidateWithBaseKey[] {
  return candidates.map(c => {
    const baseNameSeg = buildBaseNameSegment(c.segments);
    const needsTruncationHash = baseNameSeg.length > MAX_NAME_LENGTH;
    const nameSegment = needsTruncationHash
      ? buildHashedNameSegment(c.segments)
      : baseNameSeg;
    return {
      ...c,
      baseKey: `${ANNOTATION_PREFIX}${nameSegment}`,
      needsTruncationHash,
    };
  });
}

/**
 * Group candidates by base annotation key (step 3).
 *
 * @internal Exported for unit testing only.
 */
export function groupCandidatesByBaseKey(
  withKeys: CandidateWithBaseKey[],
): Map<string, CandidateWithBaseKey[]> {
  const keyGroups = new Map<string, CandidateWithBaseKey[]>();
  for (const c of withKeys) {
    const group = keyGroups.get(c.baseKey) ?? [];
    group.push(c);
    keyGroups.set(c.baseKey, group);
  }
  return keyGroups;
}

/**
 * Pick the annotation key for one candidate after collision detection (D3).
 *
 * @internal Exported for unit testing only.
 */
export function resolveDisambiguatedAnnotationKey(
  item: CandidateWithBaseKey,
  baseKey: string,
  needsDisambiguation: boolean,
): string {
  if (needsDisambiguation && !item.needsTruncationHash) {
    // Apply hash-suffix disambiguation (D3)
    return `${ANNOTATION_PREFIX}${buildHashedNameSegment(item.segments)}`;
  }
  return baseKey;
}

/**
 * Append a numeric counter suffix to a projected key, truncating the stem
 * when needed so the name segment stays within the Backstage 63-char limit.
 */
function buildCounterSuffixedAnnotationKey(
  finalKey: string,
  counter: number,
): string {
  const suffix = `-${counter}`;
  if (!finalKey.startsWith(ANNOTATION_PREFIX)) {
    const combined = `${finalKey}${suffix}`;
    return combined.length <= MAX_NAME_LENGTH
      ? combined
      : normalizeBoundaries(combined.slice(0, MAX_NAME_LENGTH));
  }

  const nameSegment = finalKey.slice(ANNOTATION_PREFIX.length);
  const combinedSegment = `${nameSegment}${suffix}`;
  if (combinedSegment.length <= MAX_NAME_LENGTH) {
    return `${ANNOTATION_PREFIX}${combinedSegment}`;
  }

  const maxStem = MAX_NAME_LENGTH - suffix.length;
  const truncatedStem = normalizeBoundaries(nameSegment.slice(0, maxStem));
  return `${ANNOTATION_PREFIX}${truncatedStem}${suffix}`;
}

/**
 * Ensure the final key is unique when FNV-1a hash collisions occur.
 *
 * @internal Exported for unit testing only.
 */
export function uniquifyAnnotationKey(
  finalKey: string,
  dotPath: string,
  annotations: Map<string, string>,
  keyOwners: Map<string, string>,
): string {
  // Guard against FNV-1a hash collisions: if the final key is
  // already claimed by a different source path, append a counter
  // suffix to avoid silent data loss.
  if (annotations.has(finalKey) && keyOwners.get(finalKey) !== dotPath) {
    let counter = 2;
    let candidate = buildCounterSuffixedAnnotationKey(finalKey, counter);
    while (annotations.has(candidate)) {
      counter++;
      candidate = buildCounterSuffixedAnnotationKey(finalKey, counter);
    }
    return candidate;
  }
  return finalKey;
}

/** Resolve collisions and build the annotation map (step 4). */
function buildResolvedAnnotations(
  keyGroups: Map<string, CandidateWithBaseKey[]>,
  reserved: Set<string>,
): Map<string, string> {
  // Track which source dotPath owns each final key so a FNV-1a 32-bit
  // hash collision (~1 in 4 billion per pair) is detected rather than
  // silently overwriting an earlier value.
  const annotations = new Map<string, string>();
  const keyOwners = new Map<string, string>();

  for (const [baseKey, items] of keyGroups) {
    const collidesWithReserved = reserved.has(baseKey);
    const hasProjectionCollision = items.length > 1;
    const needsDisambiguation = collidesWithReserved || hasProjectionCollision;

    for (const item of items) {
      const disambiguatedKey = resolveDisambiguatedAnnotationKey(
        item,
        baseKey,
        needsDisambiguation,
      );
      const finalKey = uniquifyAnnotationKey(
        disambiguatedKey,
        item.dotPath,
        annotations,
        keyOwners,
      );
      annotations.set(finalKey, item.value);
      keyOwners.set(finalKey, item.dotPath);
    }
  }

  return annotations;
}

/**
 * Sort annotation entries lexicographically for determinism (step 5).
 *
 * @internal Exported for unit testing only.
 */
export function sortAnnotationEntries(
  annotations: Map<string, string>,
): Record<string, string> {
  const sortedKeys = [...annotations.keys()].sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
  const result: Record<string, string> = {};
  for (const key of sortedKeys) {
    result[key] = annotations.get(key)!;
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Project unmapped server.json attributes into
 * `modelcontextprotocol.io/*` annotations.
 *
 * Every scalar leaf in the document that is not consumed by the direct
 * mapping, not a D11-refused URL, not a D9-redacted secret value, and
 * not null/empty (D12) is emitted as a string-valued annotation keyed
 * by its dot-separated source path under the
 * `modelcontextprotocol.io/` prefix.
 *
 * Pure function: no I/O, no timestamps, no randomness.
 * Deterministic: identical inputs produce byte-identical output.
 *
 * @remarks
 * Object-key path segments in annotation keys are normalized to
 * lowercase (e.g., `mimeType` becomes `mimetype`). Array indices
 * are unchanged decimal numerals. Callers constructing expected key
 * literals must account for this lowercasing.
 *
 * @param doc - The MCP Registry server.json document
 * @param consumedPaths - Dot-separated source paths already consumed by
 *   direct mapping. Array elements use zero-based decimal indices (no
 *   brackets). Example: `["name", "remotes.0.type", "remotes.0.url"]`.
 * @param reservedAnnotationKeys - Full annotation keys (including the
 *   `modelcontextprotocol.io/` prefix) set by direct mapping. Projection
 *   will never overwrite these; collisions are hash-disambiguated.
 * @returns Lexicographically sorted Record of projected annotation
 *   key → string value
 *
 * @public
 */
export function projectAnnotations(
  doc: McpServerDocument,
  consumedPaths: string[],
  reservedAnnotationKeys: string[],
): Record<string, string> {
  const consumed = new Set(consumedPaths);
  const reserved = new Set(reservedAnnotationKeys);

  // Walk the document and collect candidate scalars
  const candidates: ScalarCandidate[] = [];
  collectScalars(
    doc as unknown as Record<string, unknown>,
    { segments: [], dotPath: '' },
    candidates,
    consumed,
  );

  // Step 2: Compute base annotation keys for each candidate
  const withKeys = attachBaseKeysToCandidates(candidates);

  // Step 3: Detect collisions (with reserved keys and between projected)
  const keyGroups = groupCandidatesByBaseKey(withKeys);

  // Step 4: Resolve collisions and build final annotations
  const annotations = buildResolvedAnnotations(keyGroups, reserved);

  // Step 5: Sort keys lexicographically for determinism
  return sortAnnotationEntries(annotations);
}
