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
 * Pure OCI and npx metadata normalizers implementing design D3
 * native-field mappings and precedence.
 *
 * These functions accept already-parsed, verified inputs and return
 * schema-valid SkillRecords or explicit per-record diagnostics.
 * They perform no network, scheduler, database, or catalog operations.
 *
 * @packageDocumentation
 */

import type { NpxSkillRecord, OciSkillRecord, SkillAuthor } from './types';

// ─── Input types ─────────────────────────────────────────────────────

/**
 * Parsed OCI SkillCard metadata fields.
 *
 * Fields use `unknown` because the YAML parser may produce any type.
 * The normalizer validates and selects correctly typed values.
 *
 * @public
 */
export interface OciSkillCardMetadata {
  /** Display name (`metadata.display-name`). */
  'display-name'?: unknown;
  /** Name (`metadata.name`). */
  name?: unknown;
  /** Description (`metadata.description`). */
  description?: unknown;
  /** Declared version (`metadata.version`). */
  version?: unknown;
  /** License identifier (`metadata.license`). */
  license?: unknown;
  /** Author list (`metadata.authors`). */
  authors?: unknown;
  /** Metadata tags (`metadata.tags`). */
  tags?: unknown;
  /** Compatibility info (`metadata.compatibility`). */
  compatibility?: unknown;
  /** Namespace scope (`metadata.namespace`). */
  namespace?: unknown;
}

/**
 * Parsed OCI SkillCard spec fields.
 *
 * @public
 */
export interface OciSkillCardSpec {
  /** System prompt (`spec.prompt`). */
  prompt?: unknown;
}

/**
 * Parsed OCI SkillCard document.
 *
 * @public
 */
export interface OciSkillCard {
  /** SkillCard metadata section. */
  metadata?: OciSkillCardMetadata;
  /** SkillCard spec section. */
  spec?: OciSkillCardSpec;
}

/**
 * Parsed Markdown frontmatter from an OCI skill document
 * (SKILL.md or SKILLS.md).
 *
 * @public
 */
export interface OciMarkdownFrontmatter {
  /** Top-level name. */
  name?: unknown;
  /** Top-level description. */
  description?: unknown;
  /** Top-level version (frontmatter `version`). */
  version?: unknown;
  /** Top-level license. */
  license?: unknown;
  /** Top-level compatibility. */
  compatibility?: unknown;
  /** Nested metadata block in frontmatter. */
  metadata?: {
    /** Frontmatter `metadata.version`. */
    version?: unknown;
    /** Frontmatter `metadata.author` (string or object). */
    author?: unknown;
    /** Frontmatter `metadata.tags`. */
    tags?: unknown;
    /** Frontmatter `metadata.owner`. */
    owner?: unknown;
    /** Frontmatter `metadata.lifecycle`. */
    lifecycle?: unknown;
  };
}

/**
 * Combined parsed OCI native input for normalization.
 *
 * @public
 */
export interface OciNativeInput {
  /** Parsed SkillCard document. */
  skillCard?: OciSkillCard;
  /** Parsed Markdown frontmatter. */
  frontmatter?: OciMarkdownFrontmatter;
}

/**
 * Parsed npx discovery entry from an Agent Skills index.
 *
 * @public
 */
export interface NpxDiscoveryEntry {
  /** Discovery entry name. */
  name?: unknown;
  /** Discovery entry description. */
  description?: unknown;
  /** Artifact format type (e.g., `'skill-md'`). */
  type?: unknown;
}

/**
 * Parsed Markdown frontmatter from an npx skill document.
 *
 * @public
 */
export interface NpxFrontmatter {
  /** Top-level name. */
  name?: unknown;
  /** Top-level description. */
  description?: unknown;
  /** Top-level version. */
  version?: unknown;
  /** Top-level license. */
  license?: unknown;
  /** Top-level compatibility. */
  compatibility?: unknown;
  /** Nested metadata block in frontmatter. */
  metadata?: {
    /** Frontmatter `metadata.version`. */
    version?: unknown;
    /** Frontmatter `metadata.author` (string or object). */
    author?: unknown;
    /** Frontmatter `metadata.tags`. */
    tags?: unknown;
    /** Frontmatter `metadata.owner`. */
    owner?: unknown;
    /** Frontmatter `metadata.lifecycle`. */
    lifecycle?: unknown;
  };
}

/**
 * Combined parsed npx native input for normalization.
 *
 * @public
 */
export interface NpxNativeInput {
  /** Parsed discovery entry. */
  entry?: NpxDiscoveryEntry;
  /** Parsed Markdown frontmatter. */
  frontmatter?: NpxFrontmatter;
}

/**
 * Trusted source identity and integrity fields provided by the
 * connector after verified acquisition. These are never derived
 * from native metadata or user-supplied frontmatter.
 *
 * @public
 */
export interface TrustedSourceInput {
  /** Stable identity key within this source. */
  key: string;
  /** Digest-addressed OCI URI or fragment-free HTTPS URL. */
  sourceUri: string;
  /** Content digest in `sha256:<64 lowercase hex digits>` format. */
  digest: string;
}

/**
 * A single diagnostic produced during metadata normalization.
 *
 * @public
 */
export interface NormalizationDiagnostic {
  /** The normalized field that triggered the diagnostic. */
  field: string;
  /** Human-readable description of the issue. */
  message: string;
}

/**
 * Result of a metadata normalization operation.
 *
 * When `record` is non-null, the normalization succeeded and the record
 * is schema-valid. Diagnostics may still be present for omitted optional
 * fields. When `record` is null, the normalization failed due to missing
 * required fields or other fatal issues.
 *
 * @public
 */
export interface NormalizationResult<T> {
  /** The normalized record, or null if normalization failed. */
  record: T | null;
  /** Diagnostics produced during normalization. */
  diagnostics: NormalizationDiagnostic[];
}

// ─── Constants ───────────────────────────────────────────────────────

/**
 * Backstage catalog tag validation pattern.
 *
 * Tags must consist of lowercase alphanumeric characters plus `:`, `+`,
 * `#`, `.`, `_`, `-`. Must start and end with an alphanumeric character
 * or one of `:`, `+`, `#`.
 */
const CATALOG_TAG_PATTERN = /^[a-z0-9:+#]([a-z0-9:+#._-]*[a-z0-9:+#])?$/;

/**
 * Maximum tag length accepted by the Backstage catalog.
 */
const MAX_TAG_LENGTH = 63;

// ─── Internal helpers ────────────────────────────────────────────────

/**
 * Returns the trimmed string if the value is a non-empty string after
 * trimming, or `undefined` otherwise.
 */
function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return undefined;
}

/**
 * Selects the first non-empty, correctly typed string value from an
 * ordered list of candidates. Implements D3 precedence for scalar fields.
 */
function firstNonEmptyString(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    const s = asNonEmptyString(c);
    if (s !== undefined) {
      return s;
    }
  }
  return undefined;
}

/**
 * Validates a single author entry from a SkillCard `metadata.authors`
 * array. Returns a valid `SkillAuthor` or null.
 */
function validateAuthorEntry(entry: unknown): SkillAuthor | null {
  if (typeof entry !== 'object' || entry === null) {
    return null;
  }
  const obj = entry as Record<string, unknown>;
  const name = asNonEmptyString(obj.name);
  if (!name) {
    return null;
  }
  const author: SkillAuthor = { name };
  if (typeof obj.email === 'string' && obj.email.trim().length > 0) {
    author.email = obj.email.trim();
  }
  return author;
}

/**
 * Normalizes author data from an ordered list of candidates.
 *
 * SkillCard `metadata.authors` is expected as an array of objects.
 * Frontmatter `metadata.author` may be a single string, which is
 * normalized to `[{ name: value }]`.
 *
 * Returns the first valid, non-empty author list, or undefined.
 */
function normalizeAuthors(
  candidates: unknown[],
  diagnostics: NormalizationDiagnostic[],
): SkillAuthor[] | undefined {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }

    // String author → normalize to [{ name: value }]
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return [{ name: trimmed }];
      }
      continue;
    }

    // Array of author objects
    if (Array.isArray(candidate)) {
      if (candidate.length === 0) {
        continue;
      }
      const validAuthors: SkillAuthor[] = [];
      for (let i = 0; i < candidate.length; i++) {
        const author = validateAuthorEntry(candidate[i]);
        if (author) {
          validAuthors.push(author);
        } else {
          diagnostics.push({
            field: 'authors',
            message: `authors[${i}]: invalid author entry omitted — must be an object with a non-empty name`,
          });
        }
      }
      if (validAuthors.length > 0) {
        return validAuthors;
      }
      // All entries were invalid — fall through to next candidate
      continue;
    }

    // Unsupported type
    diagnostics.push({
      field: 'authors',
      message: `authors: unsupported type '${typeof candidate}' — expected array or string`,
    });
  }
  return undefined;
}

/**
 * Validates a tag value against Backstage's catalog tag rules.
 * Tags are trimmed and lowercased before validation.
 *
 * Returns the normalized tag if valid, or null.
 */
function normalizeSingleTag(tag: unknown): string | null {
  if (typeof tag !== 'string') {
    return null;
  }
  const normalized = tag.trim().toLocaleLowerCase('en-US');
  if (normalized.length === 0) {
    return null;
  }
  if (normalized.length > MAX_TAG_LENGTH) {
    return null;
  }
  if (!CATALOG_TAG_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

/**
 * Normalizes tags from an ordered list of candidates.
 *
 * Each candidate should be an array of strings. Selects the first
 * non-empty valid array. Individual tags are trimmed, lowercased,
 * validated against Backstage's tag rules, and deduplicated.
 * Invalid or overlength tags are omitted with diagnostics.
 */
function normalizeTags(
  candidates: unknown[],
  diagnostics: NormalizationDiagnostic[],
): string[] | undefined {
  for (const candidate of candidates) {
    if (!Array.isArray(candidate) || candidate.length === 0) {
      continue;
    }

    const seen = new Set<string>();
    const validTags: string[] = [];

    for (let i = 0; i < candidate.length; i++) {
      const normalized = normalizeSingleTag(candidate[i]);
      if (normalized === null) {
        if (typeof candidate[i] === 'string') {
          const raw = (candidate[i] as string).trim();
          if (raw.length > MAX_TAG_LENGTH) {
            diagnostics.push({
              field: 'tags',
              message: `tags[${i}]: overlength tag '${raw}' omitted — exceeds ${MAX_TAG_LENGTH} characters`,
            });
          } else {
            diagnostics.push({
              field: 'tags',
              message: `tags[${i}]: invalid tag '${raw}' omitted — does not match catalog tag pattern`,
            });
          }
        } else {
          diagnostics.push({
            field: 'tags',
            message: `tags[${i}]: non-string value omitted`,
          });
        }
        continue;
      }

      if (!seen.has(normalized)) {
        seen.add(normalized);
        validTags.push(normalized);
      }
    }

    if (validTags.length > 0) {
      return validTags;
    }
    // All tags were invalid — fall through to next candidate
  }
  return undefined;
}

/**
 * Adds a diagnostic for an optional string field that has the wrong type.
 */
function diagnoseOptionalStringField(
  fieldName: string,
  value: unknown,
  diagnostics: NormalizationDiagnostic[],
): void {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    diagnostics.push({
      field: fieldName,
      message: `${fieldName}: unsupported type '${typeof value}' — expected string; value omitted`,
    });
  }
}

// ─── Public normalizer functions ─────────────────────────────────────

/**
 * Normalizes OCI metadata into an `OciSkillRecord` using design D3
 * precedence rules.
 *
 * Accepts parsed, verified OCI SkillCard metadata and Markdown
 * frontmatter plus trusted source identity/integrity fields from
 * the connector. Returns a schema-valid record or null with
 * diagnostics.
 *
 * D3 OCI precedence order per field:
 * - name: `metadata.display-name`, `metadata.name`, frontmatter `name`
 * - description: `metadata.description`, frontmatter `description`
 * - version: `metadata.version`, frontmatter `metadata.version`,
 *   frontmatter `version`
 * - license: `metadata.license`, frontmatter `license`
 * - authors: `metadata.authors`, frontmatter `metadata.author`
 * - tags: `metadata.tags`, frontmatter `metadata.tags`
 * - compatibility: `metadata.compatibility`, frontmatter `compatibility`
 * - owner: frontmatter `metadata.owner`
 * - lifecycle: frontmatter `metadata.lifecycle`
 * - extensions.oci.namespace: `metadata.namespace`
 * - extensions.oci.prompt: `spec.prompt`
 *
 * @public
 */
export function normalizeOciMetadata(
  native: OciNativeInput,
  trusted: TrustedSourceInput,
): NormalizationResult<OciSkillRecord> {
  const diagnostics: NormalizationDiagnostic[] = [];
  const meta = native.skillCard?.metadata;
  const spec = native.skillCard?.spec;
  const fm = native.frontmatter;

  // Required: name — first non-empty from D3 precedence
  const name = firstNonEmptyString(
    meta?.['display-name'],
    meta?.name,
    fm?.name,
  );
  if (!name) {
    diagnostics.push({
      field: 'name',
      message:
        'name: no valid display name found in SkillCard metadata or frontmatter',
    });
    return { record: null, diagnostics };
  }

  // Optional scalars with D3 precedence
  const description = firstNonEmptyString(meta?.description, fm?.description);
  if (!description) {
    diagnoseOptionalStringField('description', meta?.description, diagnostics);
    diagnoseOptionalStringField('description', fm?.description, diagnostics);
  }

  // Version: metadata.version → frontmatter metadata.version → frontmatter version
  // Invalid first-choice version is retained for D5 fallback
  const version = firstNonEmptyString(
    meta?.version,
    fm?.metadata?.version,
    fm?.version,
  );
  if (!version) {
    diagnoseOptionalStringField('version', meta?.version, diagnostics);
    diagnoseOptionalStringField('version', fm?.metadata?.version, diagnostics);
    diagnoseOptionalStringField('version', fm?.version, diagnostics);
  }

  const license = firstNonEmptyString(meta?.license, fm?.license);
  if (!license) {
    diagnoseOptionalStringField('license', meta?.license, diagnostics);
    diagnoseOptionalStringField('license', fm?.license, diagnostics);
  }

  const compatibility = firstNonEmptyString(
    meta?.compatibility,
    fm?.compatibility,
  );
  if (!compatibility) {
    diagnoseOptionalStringField(
      'compatibility',
      meta?.compatibility,
      diagnostics,
    );
    diagnoseOptionalStringField(
      'compatibility',
      fm?.compatibility,
      diagnostics,
    );
  }

  // Owner and lifecycle — only from frontmatter metadata
  const owner = firstNonEmptyString(fm?.metadata?.owner);
  const lifecycle = firstNonEmptyString(fm?.metadata?.lifecycle);

  // Authors: metadata.authors → frontmatter metadata.author
  const authors = normalizeAuthors(
    [meta?.authors, fm?.metadata?.author],
    diagnostics,
  );

  // Tags: metadata.tags → frontmatter metadata.tags
  const tags = normalizeTags([meta?.tags, fm?.metadata?.tags], diagnostics);

  // Build the record with trusted identity fields
  const record: OciSkillRecord = {
    key: trusted.key,
    name,
    sourceUri: trusted.sourceUri,
    digest: trusted.digest,
  };

  // Add optional fields only when present
  if (description) record.description = description;
  if (version) record.version = version;
  if (license) record.license = license;
  if (authors) record.authors = authors;
  if (tags) record.tags = tags;
  if (compatibility) record.compatibility = compatibility;
  if (owner) record.owner = owner;
  if (lifecycle) record.lifecycle = lifecycle;

  // Allowlisted OCI extensions: namespace and prompt
  const namespace = asNonEmptyString(meta?.namespace);
  const prompt = asNonEmptyString(spec?.prompt);

  if (namespace || prompt) {
    const oci: Record<string, string> = {};
    if (namespace) oci.namespace = namespace;
    if (prompt) oci.prompt = prompt;
    record.extensions = { oci };
  }

  return { record, diagnostics };
}

/**
 * Normalizes npx metadata into an `NpxSkillRecord` using design D3
 * precedence rules.
 *
 * Accepts parsed, verified npx discovery entry and Markdown frontmatter
 * plus trusted source identity/integrity fields from the connector.
 * Returns a schema-valid record or null with diagnostics.
 *
 * D3 npx precedence order per field:
 * - name: frontmatter `name`, discovery entry `name`
 * - description: frontmatter `description`, discovery entry `description`
 * - version: frontmatter `metadata.version`, frontmatter `version`
 * - license: frontmatter `license`
 * - authors: frontmatter `metadata.author`
 * - tags: frontmatter `metadata.tags`
 * - compatibility: frontmatter `compatibility`
 * - owner: frontmatter `metadata.owner`
 * - lifecycle: frontmatter `metadata.lifecycle`
 * - extensions.npx.type: discovery entry `type`
 *
 * @public
 */
export function normalizeNpxMetadata(
  native: NpxNativeInput,
  trusted: TrustedSourceInput,
): NormalizationResult<NpxSkillRecord> {
  const diagnostics: NormalizationDiagnostic[] = [];
  const entry = native.entry;
  const fm = native.frontmatter;

  // Required: name — frontmatter name → discovery entry name
  const name = firstNonEmptyString(fm?.name, entry?.name);
  if (!name) {
    diagnostics.push({
      field: 'name',
      message:
        'name: no valid display name found in frontmatter or discovery entry',
    });
    return { record: null, diagnostics };
  }

  // Optional scalars with D3 precedence
  const description = firstNonEmptyString(fm?.description, entry?.description);
  if (!description) {
    diagnoseOptionalStringField('description', fm?.description, diagnostics);
    diagnoseOptionalStringField('description', entry?.description, diagnostics);
  }

  // Version: frontmatter metadata.version → frontmatter version
  const version = firstNonEmptyString(fm?.metadata?.version, fm?.version);
  if (!version) {
    diagnoseOptionalStringField('version', fm?.metadata?.version, diagnostics);
    diagnoseOptionalStringField('version', fm?.version, diagnostics);
  }

  const license = firstNonEmptyString(fm?.license);
  if (!license) {
    diagnoseOptionalStringField('license', fm?.license, diagnostics);
  }

  const compatibility = firstNonEmptyString(fm?.compatibility);
  if (!compatibility) {
    diagnoseOptionalStringField(
      'compatibility',
      fm?.compatibility,
      diagnostics,
    );
  }

  // Owner and lifecycle — only from frontmatter metadata
  const owner = firstNonEmptyString(fm?.metadata?.owner);
  const lifecycle = firstNonEmptyString(fm?.metadata?.lifecycle);

  // Authors: frontmatter metadata.author only
  const authors = normalizeAuthors([fm?.metadata?.author], diagnostics);

  // Tags: frontmatter metadata.tags only
  const tags = normalizeTags([fm?.metadata?.tags], diagnostics);

  // Build the record with trusted identity fields
  const record: NpxSkillRecord = {
    key: trusted.key,
    name,
    sourceUri: trusted.sourceUri,
    digest: trusted.digest,
  };

  // Add optional fields only when present
  if (description) record.description = description;
  if (version) record.version = version;
  if (license) record.license = license;
  if (authors) record.authors = authors;
  if (tags) record.tags = tags;
  if (compatibility) record.compatibility = compatibility;
  if (owner) record.owner = owner;
  if (lifecycle) record.lifecycle = lifecycle;

  // Allowlisted npx extension: type
  if (entry?.type === 'skill-md') {
    record.extensions = { npx: { type: 'skill-md' } };
  } else if (entry?.type !== undefined && entry?.type !== null) {
    diagnostics.push({
      field: 'extensions.npx.type',
      message: `extensions.npx.type: unsupported type value '${String(
        entry.type,
      )}' — only 'skill-md' is allowed; extension omitted`,
    });
  }

  return { record, diagnostics };
}
