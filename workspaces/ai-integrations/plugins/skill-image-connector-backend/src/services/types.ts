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
}

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
}
