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

import type { McpServerApiEntity } from '@backstage/catalog-model/alpha';

/**
 * Input leaf from MCP Registry server.json (shared by env vars, headers,
 * variables, and arguments).
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | Input definition}
 * @public
 */
export interface McpInput {
  /** Possible values the user must select from when provided. */
  choices?: string[];
  /** Default value for the input. */
  default?: string;
  /** Human-readable description for clients. */
  description?: string;
  /** Input format hint (`string`, `number`, `boolean`, or `filepath`). */
  format?: 'string' | 'number' | 'boolean' | 'filepath';
  /** Whether the input is required. */
  isRequired?: boolean;
  /** Whether the input is a secret value. */
  isSecret?: boolean;
  /** Placeholder shown during configuration. */
  placeholder?: string;
  /** Fixed value; when set, end users should not configure it. */
  value?: string;
}

/**
 * Input that may declare nested `{curly_brace}` variables.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | InputWithVariables definition}
 * @public
 */
export interface McpInputWithVariables extends McpInput {
  /** Map of variable names to nested input definitions. */
  variables?: Record<string, McpInput>;
}

/**
 * Named key/value input (environment variable or HTTP header).
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | KeyValueInput definition}
 * @public
 */
export interface McpKeyValueInput extends McpInputWithVariables {
  /** Name of the header or environment variable. */
  name: string;
}

/**
 * Positional command-line argument.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | PositionalArgument definition}
 * @public
 */
export interface McpPositionalArgument extends McpInputWithVariables {
  type: 'positional';
  /** Whether the argument may be repeated. */
  isRepeated?: boolean;
  /** Identifier / label for the positional argument. */
  valueHint?: string;
}

/**
 * Named command-line flag argument (`--flag={value}`).
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | NamedArgument definition}
 * @public
 */
export interface McpNamedArgument extends McpInputWithVariables {
  type: 'named';
  /** Flag name, including any leading dashes. */
  name: string;
  /** Whether the argument may be repeated. */
  isRepeated?: boolean;
}

/**
 * Package or runtime argument (positional or named).
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | Argument definition}
 * @public
 */
export type McpArgument = McpPositionalArgument | McpNamedArgument;

/**
 * Stdio local transport.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | StdioTransport definition}
 * @public
 */
export interface McpStdioTransport {
  type: 'stdio';
}

/**
 * Streamable HTTP transport.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | StreamableHttpTransport definition}
 * @public
 */
export interface McpStreamableHttpTransport {
  type: 'streamable-http';
  /** URL template for the streamable-http transport. */
  url: string;
  /** Optional HTTP headers. */
  headers?: McpKeyValueInput[];
}

/**
 * Server-Sent Events transport.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | SseTransport definition}
 * @public
 */
export interface McpSseTransport {
  type: 'sse';
  /** SSE endpoint URL template. */
  url: string;
  /** Optional HTTP headers. */
  headers?: McpKeyValueInput[];
}

/**
 * Transport protocol configuration for local/package context.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | LocalTransport definition}
 * @public
 */
export type McpLocalTransport =
  | McpStdioTransport
  | McpStreamableHttpTransport
  | McpSseTransport;

/**
 * A remote transport entry from MCP Registry server.json.
 *
 * Extends streamable-http or sse transport with optional URL template
 * variables. Compatible with Backstage `McpServerRemote` (`type` + `url`).
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | RemoteTransport definition}
 * @public
 */
export type McpRegistryRemote = (
  | McpStreamableHttpTransport
  | McpSseTransport
) & {
  /** Optional URL template variables for resolving dynamic remote URLs. */
  variables?: Record<string, McpInput>;
};

/**
 * Repository metadata for the MCP server source code. Enables users
 * and security experts to inspect the code, improving transparency.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | Repository definition}
 * @public
 */
export interface McpServerRepository {
  /**
   * Repository URL for browsing source code. Should support both
   * web browsing and git clone operations.
   */
  url: string;
  /**
   * Repository hosting service identifier. Used by registries to
   * determine validation and API access methods (e.g., 'github',
   * 'gitlab', 'bitbucket', 'azure-devops').
   */
  source: string;
  /**
   * Repository identifier from the hosting service (e.g., GitHub
   * repo ID). Should remain stable across repository renames and
   * may be used to detect repository resurrection attacks.
   */
  id?: string;
  /**
   * Optional relative path from repository root to the server
   * location within a monorepo or nested package structure. Must
   * be a clean relative path.
   */
  subfolder?: string;
}

/**
 * An icon entry from MCP Registry server.json.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | Icon definition}
 * @public
 */
export interface McpRegistryIcon {
  /** URI pointing to an icon resource. */
  src: string;
  /** Optional MIME type override. */
  mimeType?:
    | 'image/png'
    | 'image/jpeg'
    | 'image/jpg'
    | 'image/svg+xml'
    | 'image/webp';
  /** Size specifications (e.g., '48x48', 'any'). */
  sizes?: string[];
  /** Theme this icon is designed for. */
  theme?: 'light' | 'dark';
}

/**
 * A package entry from MCP Registry server.json.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | Package definition}
 * @public
 */
export interface McpRegistryPackage {
  /** Registry type (e.g., 'npm', 'pypi', 'cargo', 'oci'). */
  registryType: string;
  /** Package identifier — name (for registries) or URL (for downloads). */
  identifier: string;
  /** Transport protocol configuration. */
  transport: McpLocalTransport;
  /** Package version (specific, no ranges). */
  version?: string;
  /** Base URL of the package registry. */
  registryBaseUrl?: string;
  /** Runtime hint (e.g., 'npx', 'uvx', 'docker'). */
  runtimeHint?: string;
  /** SHA-256 hash of the package file for integrity verification. */
  fileSha256?: string;
  /** Environment variables for the package. */
  environmentVariables?: McpKeyValueInput[];
  /** Arguments passed to the package binary. */
  packageArguments?: McpArgument[];
  /** Arguments passed to the runtime command. */
  runtimeArguments?: McpArgument[];
}

/**
 * Extension metadata using reverse DNS namespacing for vendor-specific
 * data (`ServerDetail._meta`). Additional reverse-DNS keys are allowed.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | ServerDetail._meta}
 * @public
 */
export interface McpServerMeta {
  /** Publisher-provided metadata for downstream registries. */
  'io.modelcontextprotocol.registry/publisher-provided'?: Record<
    string,
    unknown
  >;
  /** Additional reverse-DNS namespaced extension metadata. */
  [key: string]: unknown;
}

/**
 * A single MCP Registry server.json document derived from the
 * ServerDetail definition in the draft server.json schema.
 *
 * The shape is closed: only ServerDetail properties are permitted.
 *
 * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | ServerDetail definition}
 * @public
 */
export interface McpServerDocument {
  /**
   * JSON Schema URI for the server.json format. Required so callers
   * and runtime validation can confirm a Registry server.json document.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | ServerDetail.$schema}
   */
  $schema: string;
  /**
   * Server name in reverse-DNS format. Must contain exactly one
   * forward slash separating namespace from server name.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | ServerDetail.name}
   */
  name: string;
  /**
   * Optional human-readable title or display name for the MCP server.
   * Clients MAY choose to use this for display purposes.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | ServerDetail.title}
   */
  title?: string;
  /**
   * Clear human-readable explanation of server functionality. Should
   * focus on capabilities, not implementation details.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | ServerDetail.description}
   */
  description: string;
  /**
   * Version string for this server. SHOULD follow semantic versioning
   * (e.g., '1.0.2', '2.1.0-alpha'). Version ranges are rejected.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | ServerDetail.version}
   */
  version: string;
  /**
   * Optional URL to the server's homepage, documentation, or project
   * website. Provides a central link for users to learn more about
   * the server.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | ServerDetail.websiteUrl}
   */
  websiteUrl?: string;
  /**
   * Optional repository metadata for the MCP server source code.
   * Recommended for transparency and security inspection.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | Repository}
   */
  repository?: McpServerRepository;
  /**
   * Remote transport entries (streamable-http or sse with optional
   * variables for URL template resolution).
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | RemoteTransport}
   */
  remotes?: McpRegistryRemote[];
  /**
   * Optional set of sized icons that the client can display in a
   * user interface.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | Icon}
   */
  icons?: McpRegistryIcon[];
  /**
   * Package entries for installation via registries (npm, pypi,
   * cargo, oci, etc.) or direct download.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | Package}
   */
  packages?: McpRegistryPackage[];
  /**
   * Extension metadata using reverse DNS namespacing for
   * vendor-specific data.
   *
   * @see {@link https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json | ServerDetail._meta}
   */
  _meta?: McpServerMeta;
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
  /**
   * Optional URL for the D8 placeholder remote when no valid remotes
   * are present. Tried before falling back to `websiteUrl`. Must pass
   * the emitted-URL scheme policy (D11 / `isAllowedUrl`).
   */
  placeholderRemoteUrl?: string;
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
