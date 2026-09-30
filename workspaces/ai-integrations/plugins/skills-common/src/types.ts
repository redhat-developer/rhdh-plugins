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
 * Supported source types for skill connectors.
 *
 * @public
 */
export type SkillSourceType = 'oci' | 'npx';

/**
 * Supported snapshot statuses per design D6.
 *
 * - `loading` — first acquisition is in progress
 * - `ready` — all discovery pages and candidates completed without failures
 * - `partial` — discovery or processing was incomplete
 * - `failed` — no usable discovery result could be obtained
 *
 * @public
 */
export type SnapshotStatus = 'loading' | 'ready' | 'partial' | 'failed';

/**
 * An author entry with a required name and optional email.
 *
 * @public
 */
export interface SkillAuthor {
  name: string;
  email?: string;
}

/**
 * A normalized v1 skill record per design D2.
 *
 * `key`, `name`, `sourceUri`, and `digest` are non-empty required fields.
 * Optional fields are omitted when absent.
 *
 * @public
 */
export interface SkillRecord {
  /** Stable identity within this source; never a content digest. */
  key: string;
  /** Published human-readable name. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Declared version, before catalog SemVer fallback. */
  version?: string;
  /** SPDX license identifier or free-text license. */
  license?: string;
  /** Skill authors — informational only, never implies catalog ownership. */
  authors?: SkillAuthor[];
  /** Metadata tags. */
  tags?: string[];
  /** Compatibility information. */
  compatibility?: string;
  /** Optional catalog owner hint. */
  owner?: string;
  /** Optional catalog lifecycle hint. */
  lifecycle?: string;
  /**
   * Digest-addressed OCI URI or fragment-free HTTPS URL.
   * OCI: `oci://<registry>/<repository>@sha256:<hex>`
   * npx: absolute HTTPS artifact URL.
   */
  sourceUri: string;
  /** Content digest in `sha256:<64 lowercase hex digits>` format. */
  digest: string;
}

/**
 * OCI-specific extension fields.
 *
 * @public
 */
export interface OciExtensions {
  namespace?: string;
  prompt?: string;
}

/**
 * npx-specific extension fields.
 *
 * @public
 */
export interface NpxExtensions {
  type?: 'skill-md';
}

/**
 * A skill record from an OCI source with optional OCI-specific extensions.
 *
 * @public
 */
export interface OciSkillRecord extends SkillRecord {
  extensions?: { oci?: OciExtensions };
}

/**
 * A skill record from an npx source with optional npx-specific extensions.
 *
 * @public
 */
export interface NpxSkillRecord extends SkillRecord {
  extensions?: { npx?: NpxExtensions };
}

/**
 * Source identity within a snapshot.
 *
 * @public
 */
export interface SnapshotSource {
  /** Configured source ID. */
  id: string;
  /** Source type discriminator. */
  type: SkillSourceType;
}

/**
 * A versioned v1 skill snapshot per design D2.
 *
 * One response contains one bounded snapshot: at most 1,000 records and
 * 5 MiB of serialized JSON.
 *
 * @public
 */
export interface SkillSnapshot {
  /** Schema version; must be `'1'` for v1. */
  schemaVersion: '1';
  /** Source identity. */
  source: SnapshotSource;
  /** Snapshot completeness status per design D6. */
  status: SnapshotStatus;
  /**
   * UTC completion time as ISO 8601 string, or `null` before first attempt.
   * `loading` snapshots have `null`; completed attempts have a UTC time.
   */
  observedAt: string | null;
  /** Successfully normalized skill records. */
  skills: Array<OciSkillRecord | NpxSkillRecord>;
  /** Stable keys of skills that failed processing; disjoint from skill keys. */
  failedSkillKeys: string[];
}
