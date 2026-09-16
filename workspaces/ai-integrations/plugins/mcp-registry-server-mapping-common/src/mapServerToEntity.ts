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

import type { McpServerRemote } from '@backstage/catalog-model/alpha';
import type {
  McpServerDocument,
  McpServerMappingDefaults,
  McpServerMappingResult,
  McpServerApiEntity,
} from './types';
import { deriveMetadataName } from './identity';
import { isAllowedUrl } from './urlPolicy';
import { computeRepositoryUrl } from './repository';

/**
 * Validate required source fields and throw actionable errors.
 *
 * @public
 */
export function validateRequiredFields(doc: McpServerDocument): void {
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
 * Map server.json remotes to spec.remotes per D8/D11.
 *
 * Returns the array of entity remotes. Throws when upstream
 * minItems: 1 cannot be satisfied.
 *
 * @public
 */
export function mapRemotes(doc: McpServerDocument): McpServerRemote[] {
  const sourceRemotes = doc.remotes ?? [];

  // Filter remotes whose url passes D11 and type is a non-empty string,
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
        url: remote.url,
      });
    }
  }

  if (validRemotes.length > 0) {
    return validRemotes;
  }

  // D8: No valid remotes — use placeholder with websiteUrl
  if (isAllowedUrl(doc.websiteUrl)) {
    return [
      {
        type: 'undefined',
        url: doc.websiteUrl!,
      },
    ];
  }

  // Cannot satisfy upstream minItems: 1
  throw new Error(
    `MCP Registry server.json has no valid remotes and no valid websiteUrl ` +
      `to use as a placeholder. At least one remote with an http/https URL, ` +
      `or a valid websiteUrl, is required to satisfy upstream ` +
      `spec.remotes minItems: 1 (McpServerApiEntity schema).`,
  );
}

/**
 * Intermediate result from building links and their tracking data.
 *
 * @public
 */
export interface LinksResult {
  links: Array<{ url: string; title: string }>;
  consumedPaths: string[];
  reservedAnnotationKeys: string[];
  annotations: Record<string, string>;
}

/**
 * Build metadata links, associated annotations, and consumed-path
 * tracking for websiteUrl and repository fields.
 *
 * @public
 */
export function buildLinks(doc: McpServerDocument): LinksResult {
  const links: Array<{ url: string; title: string }> = [];
  const consumedPaths: string[] = [];
  const reservedAnnotationKeys: string[] = [];
  const annotations: Record<string, string> = {};

  // websiteUrl → Website link (D11)
  if (
    doc.websiteUrl !== undefined &&
    doc.websiteUrl !== null &&
    isAllowedUrl(doc.websiteUrl)
  ) {
    links.push({ url: doc.websiteUrl, title: 'Website' });
    consumedPaths.push('websiteUrl');
  } else if (doc.websiteUrl !== undefined && doc.websiteUrl !== null) {
    // websiteUrl present but refused by D11 — consumed but not emitted
    consumedPaths.push('websiteUrl');
  }

  // Repository URL combination (D10)
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
    consumedPaths.push('repository.url');
  }

  return { links, consumedPaths, reservedAnnotationKeys, annotations };
}

/**
 * Track consumed remote paths: type and url of all remotes are consumed
 * regardless of D11 outcome (symmetric with websiteUrl consumption).
 * Headers and variables are NOT consumed — they go to projection.
 *
 * @public
 */
export function trackConsumedRemotePaths(doc: McpServerDocument): string[] {
  const consumedPaths: string[] = [];
  if (doc.remotes) {
    for (let i = 0; i < doc.remotes.length; i++) {
      const remote = doc.remotes[i];
      consumedPaths.push(`remotes.${i}.type`);
      // Consume remote URL regardless of D11 outcome — symmetric with
      // websiteUrl consumption (present but refused → still consumed)
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
  // Step 1: Validate required fields
  validateRequiredFields(doc);

  // Step 2: Resolve caller defaults
  const effectiveOwner = defaults?.owner ?? 'unknown';
  const effectiveLifecycle = defaults?.lifecycle ?? 'production';

  // Step 3: Derive identity
  const metadataName = deriveMetadataName(
    doc.name,
    doc.version,
    defaults?.prefix,
  );

  // Step 4: Build identity annotations
  const annotations: Record<string, string> = {};
  annotations['modelcontextprotocol.io/name'] = doc.name;
  annotations['modelcontextprotocol.io/version'] = doc.version;

  const consumedPaths: string[] = ['name', 'description', 'version'];
  const reservedAnnotationKeys: string[] = [
    'modelcontextprotocol.io/name',
    'modelcontextprotocol.io/version',
  ];

  // Step 5: Build links, repository annotations, and track consumed paths
  const linksResult = buildLinks(doc);
  const links = linksResult.links;
  consumedPaths.push(...linksResult.consumedPaths);
  reservedAnnotationKeys.push(...linksResult.reservedAnnotationKeys);
  Object.assign(annotations, linksResult.annotations);

  // title is consumed
  if (doc.title !== undefined && doc.title !== null) {
    consumedPaths.push('title');
  }

  // Step 6: Map remotes
  const specRemotes = mapRemotes(doc);

  // Track consumed remote paths symmetrically
  consumedPaths.push(...trackConsumedRemotePaths(doc));

  // Step 7: Sort annotation keys for determinism
  const annotationKeys = Object.keys(annotations);
  annotationKeys.sort((a, b) => a.localeCompare(b));
  const sortedAnnotations: Record<string, string> = {};
  for (const key of annotationKeys) {
    sortedAnnotations[key] = annotations[key];
  }

  // Step 8: Build the entity
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
