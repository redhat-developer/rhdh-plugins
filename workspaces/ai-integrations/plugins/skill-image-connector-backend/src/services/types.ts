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

/** Maximum allowed blob download size in bytes (5 MB). */
export const MAX_BLOB_SIZE = 5 * 1024 * 1024;

/**
 * Maximum aggregate content retained in memory across all images (50 MB).
 * Limits the combined size of decoded skillimage.yaml and SKILLS.md strings
 * to prevent unbounded memory growth with many configured images.
 */
export const MAX_AGGREGATE_CONTENT_SIZE = 50 * 1024 * 1024;

/** Default fetch timeout in milliseconds (30 seconds). */
export const FETCH_TIMEOUT_MS = 30_000;

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
}

/** Plugin configuration for a single skill image source. */
export interface SkillImageConfig {
  /** Identifier for this image config entry. */
  id: string;
  /** Full image reference (e.g. "quay.io/gabemontero/hello-world-skill:1.0.0-draft"). */
  imageRef: string;
  /** Optional credentials for a private registry. */
  credentials?: RegistryCredentials;
}
