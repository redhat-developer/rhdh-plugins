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
  McpServerApiEntity,
  McpServerRemote,
} from '@backstage/catalog-model/alpha';

export type { McpServerApiEntity, McpServerRemote };

/**
 * A remote transport entry from MCP Registry server.json.
 *
 * Extends the Backstage {@link McpServerRemote} with optional
 * source-document fields that the direct mapping does not carry
 * through to the entity.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json | RemoteTransport definition}
 * @public
 */
export interface McpRegistryRemote extends McpServerRemote {
  headers?: unknown[];
  variables?: unknown;
}

/**
 * Repository metadata from MCP Registry server.json.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json | Repository definition}
 * @public
 */
export interface McpServerRepository {
  /** Repository URL for browsing source code. */
  url: string;
  /** Repository hosting service identifier (e.g., 'github', 'gitlab'). */
  source?: string;
  /** Repository identifier from the hosting service. */
  id?: string;
  /** Relative path from repository root to the server location. */
  subfolder?: string;
}

/**
 * An icon entry from MCP Registry server.json.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json | Icon definition}
 * @public
 */
export interface McpRegistryIcon {
  /** URI pointing to an icon resource. */
  src: string;
  /** Optional MIME type override. */
  mimeType?: string;
  /** Size specifications (e.g., '48x48', 'any'). */
  sizes?: string[];
  /** Theme this icon is designed for. */
  theme?: 'light' | 'dark';
}

/**
 * A package entry from MCP Registry server.json.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json | Package definition}
 * @public
 */
export interface McpRegistryPackage {
  /** Registry type (e.g., 'npm', 'pypi', 'cargo', 'oci'). */
  registryType: string;
  /** Package identifier — name (for registries) or URL (for downloads). */
  identifier: string;
  /** Transport protocol configuration. */
  transport: unknown;
  /** Package version (specific, no ranges). */
  version?: string;
  /** Base URL of the package registry. */
  registryBaseUrl?: string;
  /** Runtime hint (e.g., 'npx', 'uvx', 'docker'). */
  runtimeHint?: string;
  /** SHA-256 hash of the package file for integrity verification. */
  fileSha256?: string;
  /** Environment variables for the package. */
  environmentVariables?: unknown[];
  /** Arguments passed to the package binary. */
  packageArguments?: unknown[];
  /** Arguments passed to the runtime command. */
  runtimeArguments?: unknown[];
}

/**
 * A single MCP Registry server.json document. Fields match the
 * ServerDetail definition in the draft server.json schema. Unknown
 * fields are passed through to the annotation projection sibling.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json | ServerDetail definition}
 * @public
 */
export interface McpServerDocument {
  /** Server name in reverse-DNS format. */
  name: string;
  /** Optional human-readable display name. */
  title?: string;
  /** Human-readable explanation of server functionality. */
  description: string;
  /** Version string (SHOULD follow semver). */
  version: string;
  /** Optional URL to the server's homepage or documentation. */
  websiteUrl?: string;
  /** Optional repository metadata for source code. */
  repository?: McpServerRepository;
  /** Remote transport entries. */
  remotes?: McpRegistryRemote[];
  /** Optional set of icons for UI display. */
  icons?: McpRegistryIcon[];
  /** Package entries for installation. */
  packages?: McpRegistryPackage[];
  /** JSON Schema URI for the server.json format. */
  $schema?: string;
  /** Extension metadata using reverse DNS namespacing. */
  _meta?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Caller-provided defaults for the mapping transform.
 *
 * @public
 */
export interface McpServerMappingDefaults {
  /** Identity prefix for metadata.name (default: 'mcp.registry'). */
  prefix?: string;
  /** Entity owner reference (default: 'unknown'). */
  owner?: string;
  /** Entity lifecycle (default: 'production'). */
  lifecycle?: string;
}

/**
 * Result of the direct mapping transform, including hand-off
 * information for the annotation projection sibling.
 *
 * @public
 */
export interface McpServerMappingResult {
  /** The produced Backstage API entity. */
  entity: McpServerApiEntity;
  /**
   * Source paths consumed by the direct mapping. The annotation
   * projection sibling must not re-project these paths.
   */
  consumedPaths: string[];
  /**
   * Annotation keys set by the direct mapping. The annotation
   * projection sibling must not overwrite these keys.
   */
  reservedAnnotationKeys: string[];
}
