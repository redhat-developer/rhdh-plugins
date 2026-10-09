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

import type { OciSkillRecord } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

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

/** Default fetch timeout in milliseconds (30 seconds). */
export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

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
export const MAX_REDIRECTS = 3;
/** Shared logical-page budget for Quay repository and tag enumeration. */
export const MAX_DISCOVERY_PAGES = 100;
/** Maximum page size accepted by the Quay tag-list API. */
export const QUAY_TAG_PAGE_SIZE = 100;
export const MAX_TAR_ENTRIES = 200;
export const MAX_CONCURRENT_IMAGE_FETCHES = 4;
/** Largest delay supported by Node's timers without clamping to 1 ms. */
export const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

/** Validated backend settings, resolved once at plugin initialization. */
export interface SkillImageOptions {
  readonly fetchTimeoutMs: number;
  readonly maxBlobSizeBytes: number;
  readonly maxAggregateContentSizeBytes: number;
  readonly maxDiscoveryResponseSizeBytes: number;
  readonly maxImages: number;
  readonly maxRetries: number;
  readonly retryBaseDelayMs: number;
}

export const DEFAULT_SKILL_IMAGE_OPTIONS: SkillImageOptions = Object.freeze({
  fetchTimeoutMs: DEFAULT_FETCH_TIMEOUT_MS,
  maxBlobSizeBytes: DEFAULT_MAX_BLOB_SIZE,
  maxAggregateContentSizeBytes: DEFAULT_MAX_AGGREGATE_CONTENT_SIZE,
  maxDiscoveryResponseSizeBytes: DEFAULT_MAX_DISCOVERY_RESPONSE_SIZE,
  maxImages: DEFAULT_MAX_IMAGES,
  maxRetries: DEFAULT_MAX_RETRIES,
  retryBaseDelayMs: DEFAULT_RETRY_BASE_DELAY_MS,
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
