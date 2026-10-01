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

import type {
  NpxSkillRecord,
  OciSkillRecord,
  SkillAuthor,
  SkillRecord,
  SkillSnapshot,
  SkillSourceType,
  SnapshotStatus,
} from './types';

/**
 * Maximum number of records in a single snapshot (design D2).
 *
 * @public
 */
export const MAX_SNAPSHOT_RECORDS = 1_000;

/**
 * Maximum serialized snapshot size in bytes (design D2: 5 MiB).
 *
 * @public
 */
export const MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024;

/**
 * Supported schema version.
 *
 * @public
 */
export const SUPPORTED_SCHEMA_VERSION = '1';

/** Regex for valid SHA-256 digest: `sha256:` followed by 64 lowercase hex. */
const SHA256_DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

/** Valid source types. */
const VALID_SOURCE_TYPES: ReadonlySet<string> = new Set<SkillSourceType>([
  'oci',
  'npx',
]);

/** Valid snapshot statuses. */
const VALID_STATUSES: ReadonlySet<string> = new Set<SnapshotStatus>([
  'loading',
  'ready',
  'partial',
  'failed',
]);

/** Allowed OCI extension keys. */
const ALLOWED_OCI_EXTENSION_KEYS: ReadonlySet<string> = new Set([
  'namespace',
  'prompt',
]);

/** Allowed npx extension keys. */
const ALLOWED_NPX_EXTENSION_KEYS: ReadonlySet<string> = new Set(['type']);

/**
 * Result of a validation operation.
 *
 * @public
 */
export interface ValidationResult {
  /** Whether the validated input passed all checks. */
  valid: boolean;
  /** Human-readable error messages for each failed check. */
  errors: string[];
}

/**
 * Returns true when the value is a non-empty string after trimming.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates a SHA-256 digest string.
 *
 * @public
 */
export function isValidDigest(digest: string): boolean {
  return SHA256_DIGEST_RE.test(digest);
}

/**
 * Validates an ISO 8601 UTC date string. Accepts strings ending in `Z`
 * or `+00:00` that parse to a valid Date.
 *
 * @public
 */
export function isValidUtcTimestamp(value: string): boolean {
  if (!value.endsWith('Z') && !value.endsWith('+00:00')) {
    return false;
  }
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Validates a single SkillAuthor entry.
 */
function validateAuthor(
  author: unknown,
  path: string,
  errors: string[],
): author is SkillAuthor {
  if (typeof author !== 'object' || author === null) {
    errors.push(`${path}: must be an object`);
    return false;
  }
  const a = author as Record<string, unknown>;
  if (!isNonEmptyString(a.name)) {
    errors.push(`${path}.name: must be a non-empty string`);
    return false;
  }
  if (a.email !== undefined && typeof a.email !== 'string') {
    errors.push(`${path}.email: must be a string when present`);
    return false;
  }
  // Reject unknown keys on author
  const validAuthorKeys = new Set(['name', 'email']);
  for (const key of Object.keys(a)) {
    if (!validAuthorKeys.has(key)) {
      errors.push(`${path}: unknown key '${key}'`);
      return false;
    }
  }
  return true;
}

/**
 * Validates the required fields of a SkillRecord (key, name, sourceUri, digest).
 */
function validateRequiredRecordFields(
  r: Record<string, unknown>,
  prefix: string,
  errors: string[],
): boolean {
  if (!isNonEmptyString(r.key)) {
    errors.push(`${prefix}.key: must be a non-empty string`);
    return false;
  }
  if (!isNonEmptyString(r.name)) {
    errors.push(`${prefix}.name: must be a non-empty string`);
    return false;
  }
  if (!isNonEmptyString(r.sourceUri)) {
    errors.push(`${prefix}.sourceUri: must be a non-empty string`);
    return false;
  }
  if (!isNonEmptyString(r.digest)) {
    errors.push(`${prefix}.digest: must be a non-empty string`);
    return false;
  }
  if (!isValidDigest(r.digest as string)) {
    errors.push(
      `${prefix}.digest: must match sha256:<64 lowercase hex digits>`,
    );
    return false;
  }
  return true;
}

/**
 * Validates optional string fields, authors array, and tags array on a record.
 */
function validateOptionalRecordFields(
  r: Record<string, unknown>,
  prefix: string,
  errors: string[],
): boolean {
  const optionalStrings = [
    'description',
    'version',
    'license',
    'compatibility',
    'owner',
    'lifecycle',
  ] as const;
  for (const field of optionalStrings) {
    if (r[field] !== undefined && typeof r[field] !== 'string') {
      errors.push(`${prefix}.${field}: must be a string when present`);
      return false;
    }
  }

  if (!validateAuthorsField(r, prefix, errors)) {
    return false;
  }

  return validateTagsField(r, prefix, errors);
}

/**
 * Validates the optional `authors` array field on a record.
 */
function validateAuthorsField(
  r: Record<string, unknown>,
  prefix: string,
  errors: string[],
): boolean {
  if (r.authors === undefined) {
    return true;
  }
  if (!Array.isArray(r.authors)) {
    errors.push(`${prefix}.authors: must be an array when present`);
    return false;
  }
  for (let i = 0; i < r.authors.length; i++) {
    validateAuthor(r.authors[i], `${prefix}.authors[${i}]`, errors);
  }
  return true;
}

/**
 * Validates the optional `tags` array field on a record.
 */
function validateTagsField(
  r: Record<string, unknown>,
  prefix: string,
  errors: string[],
): boolean {
  if (r.tags === undefined) {
    return true;
  }
  if (!Array.isArray(r.tags)) {
    errors.push(`${prefix}.tags: must be an array when present`);
    return false;
  }
  for (let i = 0; i < r.tags.length; i++) {
    if (typeof r.tags[i] !== 'string') {
      errors.push(`${prefix}.tags[${i}]: must be a string`);
      return false;
    }
  }
  return true;
}

/**
 * Validates a base SkillRecord (common fields).
 */
function validateBaseRecord(
  record: unknown,
  index: number,
  errors: string[],
): record is SkillRecord {
  const prefix = `skills[${index}]`;
  if (typeof record !== 'object' || record === null) {
    errors.push(`${prefix}: must be an object`);
    return false;
  }
  const r = record as Record<string, unknown>;

  if (!validateRequiredRecordFields(r, prefix, errors)) {
    return false;
  }

  return validateOptionalRecordFields(r, prefix, errors);
}

/**
 * Validates keys within the OCI extension container.
 */
function validateOciContainerKeys(
  oci: Record<string, unknown>,
  prefix: string,
  errors: string[],
): boolean {
  for (const key of Object.keys(oci)) {
    if (!ALLOWED_OCI_EXTENSION_KEYS.has(key)) {
      errors.push(`${prefix}.extensions.oci: unknown key '${key}'`);
      return false;
    }
    if (oci[key] !== undefined && typeof oci[key] !== 'string') {
      errors.push(
        `${prefix}.extensions.oci.${key}: must be a string when present`,
      );
      return false;
    }
  }
  return true;
}

/**
 * Validates OCI-specific extension fields. Rejects unknown extension
 * containers and unknown keys within the `oci` container.
 */
function validateOciExtensions(
  record: Record<string, unknown>,
  index: number,
  errors: string[],
): boolean {
  const prefix = `skills[${index}]`;
  if (record.extensions === undefined) {
    return true;
  }
  if (typeof record.extensions !== 'object' || record.extensions === null) {
    errors.push(`${prefix}.extensions: must be an object when present`);
    return false;
  }
  const ext = record.extensions as Record<string, unknown>;

  // Only 'oci' container is allowed for OCI records
  for (const key of Object.keys(ext)) {
    if (key !== 'oci') {
      errors.push(
        `${prefix}.extensions: unknown container '${key}'; only 'oci' is allowed for OCI source`,
      );
      return false;
    }
  }

  if (ext.oci === undefined) {
    return true;
  }
  if (typeof ext.oci !== 'object' || ext.oci === null) {
    errors.push(`${prefix}.extensions.oci: must be an object when present`);
    return false;
  }
  return validateOciContainerKeys(
    ext.oci as Record<string, unknown>,
    prefix,
    errors,
  );
}

/**
 * Validates keys within the npx extension container.
 */
function validateNpxContainerKeys(
  npx: Record<string, unknown>,
  prefix: string,
  errors: string[],
): boolean {
  for (const key of Object.keys(npx)) {
    if (!ALLOWED_NPX_EXTENSION_KEYS.has(key)) {
      errors.push(`${prefix}.extensions.npx: unknown key '${key}'`);
      return false;
    }
  }
  if (npx.type !== undefined && npx.type !== 'skill-md') {
    errors.push(
      `${prefix}.extensions.npx.type: must be 'skill-md' when present`,
    );
    return false;
  }
  return true;
}

/**
 * Validates npx-specific extension fields. Rejects unknown extension
 * containers and unknown keys within the `npx` container.
 */
function validateNpxExtensions(
  record: Record<string, unknown>,
  index: number,
  errors: string[],
): boolean {
  const prefix = `skills[${index}]`;
  if (record.extensions === undefined) {
    return true;
  }
  if (typeof record.extensions !== 'object' || record.extensions === null) {
    errors.push(`${prefix}.extensions: must be an object when present`);
    return false;
  }
  const ext = record.extensions as Record<string, unknown>;

  // Only 'npx' container is allowed for npx records
  for (const key of Object.keys(ext)) {
    if (key !== 'npx') {
      errors.push(
        `${prefix}.extensions: unknown container '${key}'; only 'npx' is allowed for npx source`,
      );
      return false;
    }
  }

  if (ext.npx === undefined) {
    return true;
  }
  if (typeof ext.npx !== 'object' || ext.npx === null) {
    errors.push(`${prefix}.extensions.npx: must be an object when present`);
    return false;
  }
  return validateNpxContainerKeys(
    ext.npx as Record<string, unknown>,
    prefix,
    errors,
  );
}

/**
 * Validates source-discriminated records: OCI snapshots accept only
 * OCI extension containers; npx snapshots accept only npx extension
 * containers.
 */
function validateRecordExtensions(
  record: Record<string, unknown>,
  index: number,
  sourceType: SkillSourceType,
  errors: string[],
): boolean {
  if (sourceType === 'oci') {
    return validateOciExtensions(record, index, errors);
  }
  return validateNpxExtensions(record, index, errors);
}

/**
 * Validates the structural shape of a snapshot: schemaVersion, source,
 * status, and the presence of skills and failedSkillKeys arrays.
 *
 * Returns the parsed sourceType and status on success, or null on failure
 * (with errors pushed to the provided array).
 */
function validateSnapshotShape(
  s: Record<string, unknown>,
  errors: string[],
): { sourceType: SkillSourceType; status: SnapshotStatus } | null {
  // Schema version
  if (s.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion: must be '${SUPPORTED_SCHEMA_VERSION}', got '${String(
        s.schemaVersion,
      )}'`,
    );
    return null;
  }

  // Source
  if (typeof s.source !== 'object' || s.source === null) {
    errors.push('source: must be an object');
    return null;
  }
  const source = s.source as Record<string, unknown>;
  if (!isNonEmptyString(source.id)) {
    errors.push('source.id: must be a non-empty string');
  }
  if (!VALID_SOURCE_TYPES.has(source.type as string)) {
    errors.push(
      `source.type: must be one of 'oci', 'npx', got '${String(source.type)}'`,
    );
  }

  // Early return if source is invalid — can't validate records
  if (errors.length > 0) {
    return null;
  }
  const sourceType = source.type as SkillSourceType;

  // Status
  if (!VALID_STATUSES.has(s.status as string)) {
    errors.push(
      `status: must be one of 'loading', 'ready', 'partial', 'failed', got '${String(
        s.status,
      )}'`,
    );
    return null;
  }
  const status = s.status as SnapshotStatus;

  // Arrays must be present
  if (!Array.isArray(s.skills)) {
    errors.push('skills: must be an array');
    return null;
  }
  if (!Array.isArray(s.failedSkillKeys)) {
    errors.push('failedSkillKeys: must be an array');
    return null;
  }

  return { sourceType, status };
}

/**
 * Validates the `observedAt` field based on the snapshot status.
 */
function validateObservedAt(
  s: Record<string, unknown>,
  status: SnapshotStatus,
  errors: string[],
): void {
  if (status === 'loading') {
    if (s.observedAt !== null) {
      errors.push('observedAt: must be null for loading status');
    }
  } else if (typeof s.observedAt !== 'string') {
    errors.push(
      'observedAt: must be a UTC timestamp string for completed status',
    );
  } else if (!isValidUtcTimestamp(s.observedAt)) {
    errors.push('observedAt: must be a valid UTC ISO 8601 timestamp');
  }
}

/**
 * Validates status invariants per design D6.
 */
function validateStatusInvariants(
  skills: unknown[],
  failedSkillKeys: unknown[],
  status: SnapshotStatus,
  errors: string[],
): void {
  if (status === 'loading') {
    if (skills.length > 0) {
      errors.push('skills: must be empty for loading status');
    }
    if (failedSkillKeys.length > 0) {
      errors.push('failedSkillKeys: must be empty for loading status');
    }
  }
  if (status === 'ready') {
    if (failedSkillKeys.length > 0) {
      errors.push('failedSkillKeys: must be empty for ready status');
    }
  }
  if (status === 'failed') {
    if (skills.length > 0) {
      errors.push('skills: must be empty for failed status');
    }
  }
}

/**
 * Validates individual records and collects unique skill keys.
 */
function validateSnapshotRecords(
  skills: unknown[],
  sourceType: SkillSourceType,
  errors: string[],
): Set<string> {
  const skillKeys = new Set<string>();
  for (let i = 0; i < skills.length; i++) {
    const record = skills[i];
    if (validateBaseRecord(record, i, errors)) {
      const r = record as SkillRecord;
      if (skillKeys.has(r.key)) {
        errors.push(`skills[${i}].key: duplicate key '${r.key}'`);
      }
      skillKeys.add(r.key);
    }
    if (typeof record === 'object' && record !== null) {
      validateRecordExtensions(
        record as Record<string, unknown>,
        i,
        sourceType,
        errors,
      );
    }
  }
  return skillKeys;
}

/**
 * Validates failedSkillKeys entries and checks for disjointness
 * with successful skill keys.
 */
function validateDisjointKeys(
  failedSkillKeys: unknown[],
  skillKeys: Set<string>,
  errors: string[],
): void {
  for (let i = 0; i < failedSkillKeys.length; i++) {
    if (!isNonEmptyString(failedSkillKeys[i])) {
      errors.push(`failedSkillKeys[${i}]: must be a non-empty string`);
    }
  }

  const failedKeys = new Set<string>();
  for (const fk of failedSkillKeys) {
    if (typeof fk === 'string') {
      if (failedKeys.has(fk)) {
        errors.push(`failedSkillKeys: duplicate key '${fk}'`);
      }
      failedKeys.add(fk);
      if (skillKeys.has(fk)) {
        errors.push(`failedSkillKeys: key '${fk}' overlaps with skills`);
      }
    }
  }
}

/**
 * Validates a complete v1 SkillSnapshot.
 *
 * Checks:
 * - Schema version is supported
 * - Source identity is valid
 * - Status is valid
 * - Status invariants (loading/ready/partial/failed) per design D6
 * - Timestamp validity
 * - Record validation including source-discriminated extensions
 * - Unique record keys
 * - Disjoint successful/failed key sets
 * - Count and size bounds
 *
 * Does NOT check deterministic ordering — that is the producer's
 * responsibility enforced by {@link boundSnapshot}.
 *
 * @public
 */
export function validateSnapshot(snapshot: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof snapshot !== 'object' || snapshot === null) {
    return { valid: false, errors: ['snapshot: must be an object'] };
  }
  const s = snapshot as Record<string, unknown>;

  const shape = validateSnapshotShape(s, errors);
  if (shape === null) {
    return { valid: false, errors };
  }
  const { sourceType, status } = shape;

  validateObservedAt(s, status, errors);
  validateStatusInvariants(
    s.skills as unknown[],
    s.failedSkillKeys as unknown[],
    status,
    errors,
  );

  const skillKeys = validateSnapshotRecords(
    s.skills as unknown[],
    sourceType,
    errors,
  );

  validateDisjointKeys(s.failedSkillKeys as unknown[], skillKeys, errors);

  if ((s.skills as unknown[]).length > MAX_SNAPSHOT_RECORDS) {
    errors.push(
      `skills: count ${
        (s.skills as unknown[]).length
      } exceeds maximum ${MAX_SNAPSHOT_RECORDS}`,
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the serialized byte size of a snapshot against the 5 MiB
 * limit. Call after `validateSnapshot` succeeds.
 *
 * @public
 */
export function validateSnapshotSize(
  snapshot: SkillSnapshot,
): ValidationResult {
  const errors: string[] = [];
  const serialized = JSON.stringify(snapshot);
  const byteLength = Buffer.byteLength(serialized, 'utf8');
  if (byteLength > MAX_SNAPSHOT_BYTES) {
    errors.push(
      `snapshot serialized size ${byteLength} bytes exceeds maximum ${MAX_SNAPSHOT_BYTES} bytes`,
    );
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for OciSkillRecord.
 *
 * Requires the snapshot's `source.type` to disambiguate records that
 * have no `extensions` field — a bare record is only an OCI record
 * when the enclosing snapshot source is `'oci'`.
 *
 * @public
 */
export function isOciSkillRecord(
  record: SkillRecord,
  sourceType: SkillSourceType,
): record is OciSkillRecord {
  if (sourceType !== 'oci') {
    return false;
  }
  if (!('extensions' in record) || record.extensions === undefined) {
    return true; // No extensions is valid for OCI
  }
  const ext = (record as OciSkillRecord).extensions;
  return ext !== undefined && !('npx' in ext);
}

/**
 * Type guard for NpxSkillRecord.
 *
 * Requires the snapshot's `source.type` to disambiguate records that
 * have no `extensions` field — a bare record is only an npx record
 * when the enclosing snapshot source is `'npx'`.
 *
 * @public
 */
export function isNpxSkillRecord(
  record: SkillRecord,
  sourceType: SkillSourceType,
): record is NpxSkillRecord {
  if (sourceType !== 'npx') {
    return false;
  }
  if (!('extensions' in record) || record.extensions === undefined) {
    return true; // No extensions is valid for npx
  }
  const ext = (record as NpxSkillRecord).extensions;
  return ext !== undefined && !('oci' in ext);
}
