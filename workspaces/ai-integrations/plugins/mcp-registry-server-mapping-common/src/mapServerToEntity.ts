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
import type {
  McpServerDocument,
  McpServerMappingDefaults,
  McpServerMappingResult,
} from './types';
import { deriveMetadataName } from './identity';
import { isAllowedUrl } from './urlPolicy';
import { computeRepositoryUrl } from './repository';
import { assertServerJsonSchema } from './util';

/**
 * Validate required source fields and throw actionable errors.
 *
 * @public
 */
export function validateRequiredFields(doc: McpServerDocument): void {
  assertServerJsonSchema(doc);

  const missing: string[] = [];

  if (doc.name === undefined || doc.name === null || doc.name === '') {
    missing.push('name');
  }
  if (
    doc.description === undefined ||
    doc.description === null ||
    doc.description === ''
  ) {
    missing.push('description');
  }
  if (doc.version === undefined || doc.version === null || doc.version === '') {
    missing.push('version');
  }

  if (missing.length > 0) {
    throw new Error(
      `MCP Registry server.json is missing required field(s): ${missing.join(
        ', ',
      )}. ` +
        `These fields are required by the MCP server schema ` +
        `(https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/heads/main/docs/reference/server-json/draft/server.schema.json).`,
    );
  }
}

/**
 * Map server.json remotes to spec.remotes per D8/D11
 * (see openspec/changes/mcp-registry-server-mapping/design.md § D8, D11).
 *
 * Returns the array of entity remotes. Throws when upstream
 * minItems: 1 cannot be satisfied.
 *
 * When no valid remotes remain, a D8 placeholder is synthesized from
 * `placeholderRemoteUrl` (if it passes D11) before falling back to
 * `doc.websiteUrl`.
 *
 * @public
 */
export function mapRemotes(
  doc: McpServerDocument,
  placeholderRemoteUrl?: string,
): McpServerRemote[] {
  assertServerJsonSchema(doc);

  const sourceRemotes = doc.remotes ?? [];

  // Filter remotes whose url passes D11
  // (see openspec/changes/mcp-registry-server-mapping/design.md § D11)
  // and type is a non-empty string,
  // preserving source order
  const validRemotes: McpServerRemote[] = [];
  for (const remote of sourceRemotes) {
    if (
      typeof remote.type === 'string' &&
      remote.type.length > 0 &&
      remote.url !== undefined &&
      remote.url !== null &&
      isAllowedUrl(remote.url)
    ) {
      validRemotes.push({
        type: remote.type,
        url: remote.url.trim(),
      });
    }
  }

  if (validRemotes.length > 0) {
    return validRemotes;
  }

  // No valid remotes — D8 placeholder: caller override, then websiteUrl
  // (see openspec/changes/mcp-registry-server-mapping/design.md § D8)
  if (isAllowedUrl(placeholderRemoteUrl)) {
    return [
      {
        type: 'undefined',
        url: placeholderRemoteUrl!.trim(),
      },
    ];
  }

  if (isAllowedUrl(doc.websiteUrl)) {
    return [
      {
        type: 'undefined',
        url: doc.websiteUrl!.trim(),
      },
    ];
  }

  // Cannot satisfy upstream minItems: 1 — produce an actionable message
  const typeFilteredCount = sourceRemotes.filter(
    r => typeof r.type !== 'string' || r.type.length === 0,
  ).length;
  const typeFilteredHint =
    typeFilteredCount > 0
      ? ` (${typeFilteredCount} remote(s) were filtered because their ` +
        `"type" field is missing or empty)`
      : '';

  const placeholderSources =
    placeholderRemoteUrl !== undefined
      ? 'placeholderRemoteUrl or websiteUrl'
      : 'websiteUrl';

  throw new Error(
    `MCP Registry server.json has no valid remotes and no valid ` +
      `${placeholderSources} to use as a placeholder` +
      `${typeFilteredHint}. At least one remote with an http/https URL ` +
      `and a non-empty "type" string, or a valid ${placeholderSources}, ` +
      `is required to satisfy upstream ` +
      `spec.remotes minItems: 1 (McpServerApiEntity schema).`,
  );
}

/**
 * Intermediate result from building links and their tracking data.
 *
 * @public
 */
export interface LinksResult {
  /** URL links to include in entity metadata. */
  links: Array<{ url: string; title: string }>;
  /** Source document paths consumed during link building. */
  consumedPaths: string[];
  /** Annotation keys reserved by the direct mapping (not available to projection). */
  reservedAnnotationKeys: string[];
  /** Annotations produced during link building (source-location, repository URL). */
  annotations: Record<string, string>;
}

/**
 * Build metadata links, associated annotations, and consumed-path
 * tracking for websiteUrl and repository fields.
 *
 * @public
 */
export function buildLinks(doc: McpServerDocument): LinksResult {
  assertServerJsonSchema(doc);

  const links: Array<{ url: string; title: string }> = [];
  const consumedPaths: string[] = [];
  const reservedAnnotationKeys: string[] = [];
  const annotations: Record<string, string> = {};

  // websiteUrl → Website link
  // (see openspec/changes/mcp-registry-server-mapping/design.md § D11)
  if (
    doc.websiteUrl !== undefined &&
    doc.websiteUrl !== null &&
    isAllowedUrl(doc.websiteUrl)
  ) {
    links.push({ url: doc.websiteUrl.trim(), title: 'Website' });
    consumedPaths.push('websiteUrl');
  } else if (doc.websiteUrl !== undefined && doc.websiteUrl !== null) {
    // websiteUrl present but refused by D11
    // (see openspec/changes/mcp-registry-server-mapping/design.md § D11)
    // — consumed but not emitted
    consumedPaths.push('websiteUrl');
  }

  // Repository URL combination
  // (see openspec/changes/mcp-registry-server-mapping/design.md § D10)
  if (doc.repository?.url !== undefined && doc.repository?.url !== null) {
    const repoResult = computeRepositoryUrl(doc.repository);

    if (repoResult) {
      // Source Code link
      links.push({
        url: repoResult.combinedUrl,
        title: 'Source Code',
      });

      // backstage.io/source-location annotation
      annotations[
        'backstage.io/source-location'
      ] = `url:${repoResult.combinedUrl}`;
      reservedAnnotationKeys.push('backstage.io/source-location');

      // Dedicated repository.url annotation (unnormalized)
      annotations['modelcontextprotocol.io/repository.url'] =
        repoResult.originalUrl;
      reservedAnnotationKeys.push('modelcontextprotocol.io/repository.url');
    }

    // repository.url is consumed regardless of D11 outcome
    // (see openspec/changes/mcp-registry-server-mapping/design.md § D11)
    consumedPaths.push('repository.url');
  }

  return { links, consumedPaths, reservedAnnotationKeys, annotations };
}

/**
 * Track consumed remote paths: type and url of all remotes are consumed
 * regardless of D11 outcome (symmetric with websiteUrl consumption).
 * See openspec/changes/mcp-registry-server-mapping/design.md § D11.
 * Headers and variables are NOT consumed — they go to projection.
 *
 * @public
 */
export function trackConsumedRemotePaths(doc: McpServerDocument): string[] {
  assertServerJsonSchema(doc);

  const consumedPaths: string[] = [];
  if (doc.remotes) {
    for (let i = 0; i < doc.remotes.length; i++) {
      const remote = doc.remotes[i];
      consumedPaths.push(`remotes.${i}.type`);
      // Consume remote URL regardless of D11 outcome
      // (see openspec/changes/mcp-registry-server-mapping/design.md § D11)
      // — symmetric with websiteUrl consumption (present but refused → still consumed)
      if (remote.url !== undefined && remote.url !== null) {
        consumedPaths.push(`remotes.${i}.url`);
      }
    }
  }
  return consumedPaths;
}

/**
 * Transform one MCP Registry server.json document into one Backstage
 * API entity with spec.type: mcp-server.
 *
 * Pure function: no I/O, no timestamps, no randomness.
 * Deterministic: identical inputs produce byte-identical output.
 *
 * @public
 */
export function mapServerToEntity(
  doc: McpServerDocument,
  defaults?: McpServerMappingDefaults,
): McpServerMappingResult {
  assertServerJsonSchema(doc);

  // Validate required fields
  validateRequiredFields(doc);

  // Resolve caller defaults
  const effectiveOwner = defaults?.owner ?? 'unknown';
  const effectiveLifecycle = defaults?.lifecycle ?? 'production';

  // Derive identity
  const metadataName = deriveMetadataName(
    doc.name,
    doc.version,
    defaults?.prefix,
  );

  // Build identity annotations
  const annotations: Record<string, string> = {};
  annotations['modelcontextprotocol.io/name'] = doc.name;
  annotations['modelcontextprotocol.io/version'] = doc.version;

  const consumedPaths: string[] = ['name', 'description', 'version'];
  const reservedAnnotationKeys: string[] = [
    'modelcontextprotocol.io/name',
    'modelcontextprotocol.io/version',
  ];

  // Build links, repository annotations, and track consumed paths
  const linksResult = buildLinks(doc);
  const links = linksResult.links;
  consumedPaths.push(...linksResult.consumedPaths);
  reservedAnnotationKeys.push(...linksResult.reservedAnnotationKeys);
  Object.assign(annotations, linksResult.annotations);

  // title is consumed
  if (doc.title !== undefined && doc.title !== null) {
    consumedPaths.push('title');
  }

  // Map remotes (caller placeholder override before websiteUrl fallback)
  const specRemotes = mapRemotes(doc, defaults?.placeholderRemoteUrl);

  // Track consumed remote paths symmetrically
  consumedPaths.push(...trackConsumedRemotePaths(doc));

  // Sort annotation keys for determinism
  const annotationKeys = Object.keys(annotations);
  annotationKeys.sort((a, b) => a.localeCompare(b));
  const sortedAnnotations: Record<string, string> = {};
  for (const key of annotationKeys) {
    sortedAnnotations[key] = annotations[key];
  }

  // Build the entity
  const entity: McpServerApiEntity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'API',
    metadata: {
      name: metadataName,
      description: doc.description,
      tags: ['mcp', 'ai'],
      annotations: sortedAnnotations,
    },
    spec: {
      type: 'mcp-server',
      lifecycle: effectiveLifecycle,
      owner: effectiveOwner,
      remotes: specRemotes,
    },
  };

  // Set optional metadata fields
  if (doc.title !== undefined && doc.title !== null && doc.title !== '') {
    entity.metadata.title = doc.title;
  }

  if (links.length > 0) {
    entity.metadata.links = links;
  }

  // Sort for deterministic output (separate statements per review feedback)
  consumedPaths.sort((a, b) => a.localeCompare(b));
  reservedAnnotationKeys.sort((a, b) => a.localeCompare(b));

  return {
    entity,
    consumedPaths,
    reservedAnnotationKeys,
  };
}
