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

import type { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import type {
  NormalizationDiagnostic,
  OciSkillRecord,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

/** Parsed OCI image reference. */
export interface ImageRef {
  /** Registry host (e.g. "quay.io"). */
  registry: string;
  /** Repository path (e.g. "gabemontero/hello-world-skill"). */
  repository: string;
  /** Tag (e.g. "1.0.0-draft"). Defaults to "latest" if omitted. */
  tag: string;
  /** Digest (e.g. "sha256:abcdef..."). When set, used instead of tag for manifest fetch. */
  digest?: string;
}

/** Credentials and optional explicit realm used for a registry's bearer token exchange. */
export interface RegistryCredentials {
  username?: string;
  password?: string;
  /** Explicit HTTPS token realm when it differs from the registry host. */
  tokenRealm?: string;
}

/** Default maximum blob download size in bytes (5 MiB). */
export const DEFAULT_MAX_BLOB_SIZE = 5 * 1024 * 1024;

/**
 * Default maximum aggregate content retained across all images (50 MiB).
 * Limits the combined size of decoded skillimage.yaml and SKILLS.md strings
 * to prevent unbounded memory growth with many configured images.
 */
export const DEFAULT_MAX_AGGREGATE_CONTENT_SIZE = 50 * 1024 * 1024;

/**
 * Default per-image work budget in bytes (50 MiB).
 * Covers all downloaded compressed blobs and decompressed layer data
 * inspected for a single OCI image, not just the retained file pair.
 * Distinct from maxAggregateContentSizeBytes which limits retained content.
 */
export const DEFAULT_MAX_IMAGE_WORK_BUDGET = 50 * 1024 * 1024;

/** Default fetch timeout in milliseconds (30 seconds). */
export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

/**
 * Default source-operation deadline in milliseconds (5 minutes).
 * Bounds the total wall-clock time for processing all images from one
 * source, including discovery, acquisition, extraction, and retries.
 */
export const DEFAULT_SOURCE_OPERATION_DEADLINE_MS = 5 * 60 * 1000;

/** Default maximum size of one Quay discovery response (5 MiB). */
export const DEFAULT_MAX_DISCOVERY_RESPONSE_SIZE = 5 * 1024 * 1024;
/** Default total candidate limit for explicit images and discovered repository tags. */
export const DEFAULT_MAX_IMAGES = 25;
/** Default additional retry attempts after an initial failure. */
export const DEFAULT_MAX_RETRIES = 2;
/** Default delay in milliseconds before retry backoff (2 seconds). */
export const DEFAULT_RETRY_BASE_DELAY_MS = 2_000;

/** Fixed acquisition ceilings. Byte limits have distinct scopes. */
export const MAX_MANIFEST_SIZE = 5 * 1024 * 1024;
export const MAX_TOKEN_RESPONSE_SIZE = 1024 * 1024;
/** D7: at most five redirects are followed. */
export const MAX_REDIRECTS = 5;
/** Shared logical-page budget for Quay repository and tag enumeration. */
export const MAX_DISCOVERY_PAGES = 100;
/** Maximum page size accepted by the Quay tag-list API. */
export const QUAY_TAG_PAGE_SIZE = 100;
export const MAX_TAR_ENTRIES = 200;
export const MAX_CONCURRENT_IMAGE_FETCHES = 4;
/**
 * Maximum candidates inspected across explicit images and discovery,
 * including non-skills and failures. Distinct from maxImages which
 * configures the subset attempted.
 */
export const MAX_CANDIDATES = 1_000;
/** Largest delay supported by Node's timers without clamping to 1 ms. */
export const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

/** Default refresh interval for Backstage scheduling (D6: ten minutes). */
export const DEFAULT_REFRESH_INTERVAL_MINUTES = 10;

/**
 * Default maximum retained Markdown bytes per source (50 MiB).
 * D8: independent of extraction's maxAggregateContentSizeBytes.
 */
export const DEFAULT_MAX_RETAINED_MARKDOWN_SIZE = 50 * 1024 * 1024;

/**
 * Fixed maximum retained unique digests per source (D8).
 * Aligned with D2's record cap and the acknowledgment body's digest-count bound.
 */
export const MAX_RETAINED_DIGESTS = 1000;

/**
 * Maximum body size for POST /skilldocs/:sourceId/reconcile (5 MiB).
 * Bodies larger than this are rejected with 413 before parsing.
 */
export const MAX_RECONCILE_BODY_SIZE = 5 * 1024 * 1024;

/** Validated backend settings, resolved once at plugin initialization. */
export interface SkillImageOptions {
  readonly fetchTimeoutMs: number;
  readonly maxBlobSizeBytes: number;
  readonly maxAggregateContentSizeBytes: number;
  readonly maxImageWorkBudgetBytes: number;
  readonly maxDiscoveryResponseSizeBytes: number;
  readonly maxImages: number;
  readonly maxRetries: number;
  readonly retryBaseDelayMs: number;
  readonly sourceOperationDeadlineMs: number;
  readonly allowedOrigins?: readonly string[];
}

export const DEFAULT_SKILL_IMAGE_OPTIONS: SkillImageOptions = Object.freeze({
  fetchTimeoutMs: DEFAULT_FETCH_TIMEOUT_MS,
  maxBlobSizeBytes: DEFAULT_MAX_BLOB_SIZE,
  maxAggregateContentSizeBytes: DEFAULT_MAX_AGGREGATE_CONTENT_SIZE,
  maxImageWorkBudgetBytes: DEFAULT_MAX_IMAGE_WORK_BUDGET,
  maxDiscoveryResponseSizeBytes: DEFAULT_MAX_DISCOVERY_RESPONSE_SIZE,
  maxImages: DEFAULT_MAX_IMAGES,
  maxRetries: DEFAULT_MAX_RETRIES,
  retryBaseDelayMs: DEFAULT_RETRY_BASE_DELAY_MS,
  sourceOperationDeadlineMs: DEFAULT_SOURCE_OPERATION_DEADLINE_MS,
});

/** Minimal OCI manifest descriptor (image manifest V2 schema 2). */
export interface OciManifest {
  schemaVersion: number;
  mediaType?: string;
  config: OciDescriptor;
  layers: OciDescriptor[];
}

/** OCI content descriptor. */
export interface OciDescriptor {
  mediaType: string;
  digest: string;
  size: number;
  annotations?: Record<string, string>;
}

/** Result of fetching and verifying an OCI manifest. */
export interface ManifestResult {
  /** The parsed OCI manifest. */
  manifest: OciManifest;
  /** SHA-256 digest of the raw manifest bytes. */
  digest: string;
}

/**
 * Verified acquisition metadata for tagged OCI skill images.
 *
 * Present only for tag-based acquisitions. Explicit digest references
 * do not establish a tag and therefore have no tagged identity.
 */
export interface AcquisitionMetadata {
  /** Stable key: `<lowercase-registry>/<repository>:<exact-tag>`. */
  key: OciSkillRecord['key'];
  /** Verified manifest digest: `sha256:<64 lowercase hex digits>`. */
  digest: OciSkillRecord['digest'];
  /** Digest-addressed source URI: `oci://<registry>/<repository>@sha256:<hex>`. */
  sourceUri: OciSkillRecord['sourceUri'];
}

/** Result of extracting a skill image. */
export interface SkillImageExtraction {
  /** Path where skillimage.yaml was written. */
  skillImageYamlPath: string;
  /** Path where SKILLS.md was written. */
  skillsMdPath: string;
  /** Parsed content of skillimage.yaml as a string. */
  skillImageYaml: string;
  /** Content of SKILLS.md as a string. */
  skillsMd: string;
  /** Present for tagged acquisitions; absent for explicit digest references. */
  acquisition?: AcquisitionMetadata;
}

/**
 * Configuration for Quay organization discovery.
 */
export interface QuayDiscoveryConfig {
  /** Quay registry host (e.g. "quay.io"). */
  registry: string;
  /** Public organization whose repositories will be discovered. */
  organization: string;
  /** Exact tag to select for each repository. Omit to discover all active tags. */
  tag?: string;
}

/**
 * Outcome of normalizing a skill image candidate.
 *
 * - `normalized` — successfully produced a schema-valid OciSkillRecord
 * - `non-skill`  — image lacks the required SkillCard/Markdown pair
 * - `ambiguous`  — multiple competing SkillCard or Markdown matches
 * - `malformed`  — files found but could not be parsed or normalized
 */
export type NormalizationOutcome =
  | 'normalized'
  | 'non-skill'
  | 'ambiguous'
  | 'malformed';

/**
 * Result of normalizing a skill image extraction.
 *
 * When `outcome` is `'normalized'`, `record` is non-null and
 * schema-valid. All other outcomes have a null record and
 * explain the failure in `diagnostics`.
 */
export interface SkillImageNormalization {
  /** Classification of the normalization result. */
  outcome: NormalizationOutcome;
  /** The normalized OCI skill record, or null when normalization failed. */
  record: OciSkillRecord | null;
  /** Diagnostics produced during normalization. */
  diagnostics: NormalizationDiagnostic[];
}

/**
 * Source configuration combining identity, images, discovery, and scheduling.
 *
 * Each source produces an independent `SkillSnapshot` served via
 * `GET /skills/:sourceId`. Source IDs are unique within the connector.
 */
export interface SourceConfig {
  /** Stable source identifier. */
  readonly id: string;
  /** Explicit image configurations for this source. */
  readonly images: readonly SkillImageConfig[];
  /** Quay organization discovery for this source. */
  readonly quayDiscovery?: QuayDiscoveryConfig;
  /** Registries allowed for this source. */
  readonly allowedRegistries: readonly string[];
  /** Additional HTTPS origins for this source's redirects. */
  readonly allowedOrigins?: readonly string[];
  /** Backstage refresh schedule, always local to the backend's in-memory cache. */
  readonly schedule: SchedulerServiceTaskScheduleDefinition;
}

/** Plugin configuration for a single skill image source. */
export interface SkillImageConfig {
  /** Identifier for this image config entry. */
  id: string;
  /** Full image reference (e.g. "quay.io/gabemontero/hello-world-skill:1.0.0-draft"). */
  imageRef: string;
  /** Optional credentials for a private registry. */
  credentials?: RegistryCredentials;
  /** Internal 404 logging policy: true logs errors (default); false logs debug for discovered candidates. */
  logNotFoundAsError?: boolean;
}
