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

import { sanitizeSegment } from './identity';
import type { McpServerDocument } from './types';

/** Annotation key prefix for projected attributes. */
const ANNOTATION_PREFIX = 'modelcontextprotocol.io/';

/** Maximum length for the name segment of an annotation key. */
const MAX_NAME_LENGTH = 63;

/* ------------------------------------------------------------------ */
/*  FNV-1a 32-bit hash (pure JS, non-cryptographic)                   */
/* ------------------------------------------------------------------ */
const FNV1A_32_OFFSET_BASIS = 0x811c9dc5;
const FNV1A_32_PRIME = 0x01000193;

function fnv1a32(input: string): number {
  let hash = FNV1A_32_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV1A_32_PRIME);
  }
  return hash >>> 0;
}

/* ------------------------------------------------------------------ */
/*  Boundary normalization                                             */
/* ------------------------------------------------------------------ */

/**
 * Boundary normalization: while the first or last character is not
 * alphanumeric (a-z, 0-9), replace it with 'x'.
 */
function normalizeBoundaries(s: string): string {
  if (s.length === 0) {
    return s;
  }

  const chars = s.split('');

  if (!/^[a-z0-9]$/.test(chars[0])) {
    chars[0] = 'x';
  }

  if (!/^[a-z0-9]$/.test(chars[chars.length - 1])) {
    chars[chars.length - 1] = 'x';
  }

  return chars.join('');
}

/* ------------------------------------------------------------------ */
/*  Annotation key construction                                        */
/* ------------------------------------------------------------------ */

/**
 * Compute stable 8-character hex hash suffix from source path
 * segments (NUL-separated for unambiguous hashing).
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

/* ------------------------------------------------------------------ */
/*  D11 URL refusal for projected scalars                              */
/* ------------------------------------------------------------------ */

/**
 * Check if a scalar value is a D11-refused URL.
 *
 * A string that WHATWG-parses as an absolute URL with a non-http/https
 * scheme is refused. Failed URL parses (non-URL strings such as
 * package identifiers and descriptions) are NOT refused — a failed
 * absolute-URL parse is not a reason to drop them.
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

/* ------------------------------------------------------------------ */
/*  D9 secret redaction                                                */
/* ------------------------------------------------------------------ */

/** Fields redacted from isSecret: true Input objects (D9). */
const SECRET_REDACTED_FIELDS = new Set(['default', 'value', 'choices']);

/* ------------------------------------------------------------------ */
/*  Scalar-leaf walker                                                 */
/* ------------------------------------------------------------------ */

/** Candidate scalar collected during the walk. */
interface ScalarCandidate {
  /** Path segments from root to this leaf. */
  segments: string[];
  /** Dot-joined path string (for consumed-path lookup). */
  dotPath: string;
  /** Serialized annotation value. */
  value: string;
}

/**
 * Recursively walk a value, collecting non-consumed scalar leaves.
 *
 * Applies D9 secret redaction, D11 URL refusal, and D12 null/empty
 * omission inline during the walk.
 */
function collectScalars(
  node: unknown,
  segments: string[],
  dotPath: string,
  candidates: ScalarCandidate[],
  consumed: Set<string>,
): void {
  // D12: null or undefined → no annotation
  if (node === null || node === undefined) {
    return;
  }

  if (Array.isArray(node)) {
    // D12: empty array → no annotations for this subtree
    if (node.length === 0) {
      return;
    }

    for (let i = 0; i < node.length; i++) {
      const idx = String(i);
      const childSegments = [...segments, idx];
      const childDotPath = dotPath.length > 0 ? `${dotPath}.${idx}` : idx;
      collectScalars(
        node[i],
        childSegments,
        childDotPath,
        candidates,
        consumed,
      );
    }
    return;
  }

  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const keys = Object.keys(obj);

    // D12: empty object → no annotations for this subtree
    if (keys.length === 0) {
      return;
    }

    // D9: check if this is an isSecret: true Input object
    const isSecret = obj.isSecret === true;

    for (const key of keys) {
      // D9: skip redacted fields for secret inputs
      if (isSecret && SECRET_REDACTED_FIELDS.has(key)) {
        continue;
      }

      const childSegments = [...segments, key];
      const childDotPath = dotPath.length > 0 ? `${dotPath}.${key}` : key;
      collectScalars(
        obj[key],
        childSegments,
        childDotPath,
        candidates,
        consumed,
      );
    }
    return;
  }

  // --- Scalar leaf (string, number, boolean) ---

  // Skip consumed paths (already lifted by direct mapping)
  if (consumed.has(dotPath)) {
    return;
  }

  // D11: refuse URLs with non-http/https schemes
  if (isRefusedUrl(node)) {
    return;
  }

  // Serialize to string (D12: false → "false", 0 → "0", "" → "")
  candidates.push({
    segments: [...segments],
    dotPath,
    value: String(node),
  });
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
 * @param doc - The MCP Registry server.json document
 * @param consumedPaths - Source paths already consumed by direct mapping
 * @param reservedAnnotationKeys - Annotation keys set by direct mapping
 *   (projection will never overwrite these)
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

  // Step 1: Walk the document and collect candidate scalars
  const candidates: ScalarCandidate[] = [];
  collectScalars(
    doc as unknown as Record<string, unknown>,
    [],
    '',
    candidates,
    consumed,
  );

  // Step 2: Compute base annotation keys for each candidate
  const withKeys = candidates.map(c => {
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

  // Step 3: Detect collisions (with reserved keys and between projected)
  const keyGroups = new Map<string, Array<(typeof withKeys)[number]>>();
  for (const c of withKeys) {
    const group = keyGroups.get(c.baseKey) ?? [];
    group.push(c);
    keyGroups.set(c.baseKey, group);
  }

  // Step 4: Resolve collisions and build final annotations
  const annotations = new Map<string, string>();

  for (const [baseKey, items] of keyGroups) {
    const collidesWithReserved = reserved.has(baseKey);
    const hasProjectionCollision = items.length > 1;
    const needsDisambiguation = collidesWithReserved || hasProjectionCollision;

    for (const item of items) {
      let finalKey: string;
      if (needsDisambiguation && !item.needsTruncationHash) {
        // Apply hash-suffix disambiguation (D3)
        finalKey = `${ANNOTATION_PREFIX}${buildHashedNameSegment(
          item.segments,
        )}`;
      } else {
        finalKey = baseKey;
      }
      annotations.set(finalKey, item.value);
    }
  }

  // Step 5: Sort keys lexicographically for determinism
  const sortedKeys = [...annotations.keys()].sort((a, b) => a.localeCompare(b));
  const result: Record<string, string> = {};
  for (const key of sortedKeys) {
    result[key] = annotations.get(key)!;
  }

  return result;
}
