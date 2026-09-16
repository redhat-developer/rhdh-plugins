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
 * @public
 */
export interface McpRegistryRemote extends McpServerRemote {
  headers?: unknown[];
  variables?: unknown;
}

/**
 * Repository metadata from MCP Registry server.json.
 *
 * @public
 */
export interface McpServerRepository {
  url: string;
  source?: string;
  id?: string;
  subfolder?: string;
}

/**
 * A single MCP Registry server.json document (subset of fields used
 * by the direct mapping). Unknown fields are passed through to the
 * annotation projection sibling.
 *
 * @public
 */
export interface McpServerDocument {
  name: string;
  title?: string;
  description: string;
  version: string;
  websiteUrl?: string;
  repository?: McpServerRepository;
  remotes?: McpRegistryRemote[];
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
