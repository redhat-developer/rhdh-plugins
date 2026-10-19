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
 * Consumer-side snapshot validation and entity mapping.
 *
 * Validates a connector response against the v1 contract, checks
 * source identity agreement with configuration, and maps accepted
 * records to catalog entities.
 */

import type { LoggerService } from '@backstage/backend-plugin-api';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import type { Entity } from '@backstage/catalog-model';
import type {
  IdentityTuple,
  SkillRecord,
  SkillSnapshot,
  SkillSourceType,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import {
  MAX_RESPONSE_BYTES,
  computeCatalogName,
  normalizeTags,
  parseNpxRef,
  parseOciRef,
  resolveVersion,
  validateSnapshot,
  validateSnapshotSize,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import type { MappedSkillEntity, SourceConsumerConfig } from './types';

/**
 * Result of consuming a snapshot from a connector source.
 */
export interface ConsumeResult {
  /** Whether a valid snapshot was obtained. */
  ok: boolean;
  /** Mapped entities when ok is true. */
  entities: MappedSkillEntity[];
  /** Snapshot status when ok is true. */
  status?: SkillSnapshot['status'];
  /** Observation timestamp when ok is true. */
  observedAt?: string | null;
  /** Error message when ok is false. */
  error?: string;
}

/**
 * Fetches and validates a snapshot from a connector, then maps
 * accepted records to catalog entities.
 *
 * Consumer-side validation per design D2:
 * - Bounds the response read
 * - Validates the snapshot schema and source identity
 * - Rejects oversized, malformed, unsupported-version, or
 *   source-mismatched snapshots
 *
 * @param baseUrl - Connector base URL from Backstage discovery.
 * @param token - Service token for the connector.
 * @param source - Source consumer configuration.
 * @param namespace - Catalog namespace for produced entities.
 * @param defaultOwner - Default catalog owner.
 * @param defaultLifecycle - Default catalog lifecycle.
 * @param logger - Logger service.
 * @returns The consume result.
 */
export async function consumeSnapshot(
  baseUrl: string,
  token: string,
  source: SourceConsumerConfig,
  namespace: string,
  defaultOwner: string,
  defaultLifecycle: string,
  logger: LoggerService,
): Promise<ConsumeResult> {
  const url = `${baseUrl}/skills/${encodeURIComponent(source.sourceId)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  } catch (error) {
    const msg = `HTTP request failed for source ${source.sourceId}: ${error}`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  if (!response.ok) {
    const msg = `Connector returned ${response.status} for source ${source.sourceId}`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  // Bound the response read per design D2
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
    const msg =
      `Response for source ${source.sourceId} exceeds ` +
      `${MAX_RESPONSE_BYTES} byte limit (content-length: ${contentLength})`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  let bodyText: string;
  try {
    bodyText = await response.text();
  } catch (error) {
    const msg = `Failed to read response body for source ${source.sourceId}: ${error}`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  if (Buffer.byteLength(bodyText, 'utf8') > MAX_RESPONSE_BYTES) {
    const msg =
      `Response body for source ${source.sourceId} exceeds ` +
      `${MAX_RESPONSE_BYTES} byte limit`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  let snapshot: SkillSnapshot;
  try {
    snapshot = JSON.parse(bodyText);
  } catch (error) {
    const msg = `Malformed JSON from source ${source.sourceId}: ${error}`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  // Validate the complete snapshot
  const validation = validateSnapshot(snapshot);
  if (!validation.valid) {
    const msg = `Invalid snapshot from source ${
      source.sourceId
    }: ${validation.errors.join('; ')}`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  // Validate serialized size
  const sizeValidation = validateSnapshotSize(snapshot);
  if (!sizeValidation.valid) {
    const msg = `Oversized snapshot from source ${
      source.sourceId
    }: ${sizeValidation.errors.join('; ')}`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  // Validate source identity agreement with configuration
  if (snapshot.source.id !== source.sourceId) {
    const msg =
      `Source ID mismatch for ${source.sourceId}: ` +
      `snapshot says '${snapshot.source.id}'`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  if (snapshot.source.type !== source.sourceType) {
    const msg =
      `Source type mismatch for ${source.sourceId}: ` +
      `expected '${source.sourceType}', got '${snapshot.source.type}'`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  // For loading/failed status, no entities to map
  if (snapshot.status === 'loading' || snapshot.status === 'failed') {
    logger.info(
      `Source ${source.sourceId}: status=${snapshot.status}, no entities to process`,
    );
    return {
      ok: true,
      entities: [],
      status: snapshot.status,
      observedAt: snapshot.observedAt,
    };
  }

  // Map accepted records to entities
  const entities = mapRecordsToEntities(
    snapshot.skills,
    snapshot.source.type,
    source.sourceId,
    namespace,
    defaultOwner,
    defaultLifecycle,
    logger,
  );

  logger.info(
    `Source ${source.sourceId}: status=${snapshot.status}, ` +
      `records=${snapshot.skills.length}, mapped=${entities.length}, ` +
      `failedKeys=${snapshot.failedSkillKeys.length}`,
  );

  return {
    ok: true,
    entities,
    status: snapshot.status,
    observedAt: snapshot.observedAt,
  };
}

/**
 * Maps skill records to catalog entities per design D3/D5.
 */
function mapRecordsToEntities(
  records: SkillRecord[],
  sourceType: SkillSourceType,
  sourceId: string,
  namespace: string,
  defaultOwner: string,
  defaultLifecycle: string,
  logger: LoggerService,
): MappedSkillEntity[] {
  const mapped: MappedSkillEntity[] = [];
  const seenNames = new Map<string, IdentityTuple>();

  for (const record of records) {
    const tuple: IdentityTuple = {
      type: sourceType,
      id: sourceId,
      key: record.key,
    };
    const catalogName = computeCatalogName(tuple);

    // Check for identity hash collision
    const existingTuple = seenNames.get(catalogName);
    if (existingTuple) {
      logger.error(
        `Identity hash collision: name '${catalogName}' maps to both ` +
          `[${existingTuple.type}, ${existingTuple.id}, ${existingTuple.key}] ` +
          `and [${tuple.type}, ${tuple.id}, ${tuple.key}]; ` +
          `skipping second record`,
      );
      continue;
    }
    seenNames.set(catalogName, tuple);

    try {
      const entity = buildEntity(
        record,
        sourceType,
        sourceId,
        catalogName,
        namespace,
        defaultOwner,
        defaultLifecycle,
      );
      mapped.push({ tuple, catalogName, digest: record.digest, entity });
    } catch (error) {
      logger.error(`Failed to build entity for key '${record.key}': ${error}`);
    }
  }

  return mapped;
}

/**
 * Builds a single catalog entity from a skill record per design D3/D5.
 */
function buildEntity(
  record: SkillRecord,
  sourceType: SkillSourceType,
  sourceId: string,
  catalogName: string,
  namespace: string,
  defaultOwner: string,
  defaultLifecycle: string,
): Entity {
  const version = resolveVersion(record.version, record.digest);
  const owner = record.owner?.trim() || defaultOwner;
  const lifecycle = record.lifecycle?.trim() || defaultLifecycle;

  // Build annotations
  const annotations: Record<string, string> = {};

  // Source location
  const sourceLocationUri = `url:${record.sourceUri}`;
  annotations['backstage.io/source-location'] = sourceLocationUri;
  annotations[ANNOTATION_LOCATION] = sourceLocationUri;
  annotations[ANNOTATION_ORIGIN_LOCATION] = sourceLocationUri;

  // Required RHDH AI asset annotations
  annotations['rhdh.io/ai-asset-category'] = 'skill';
  annotations['rhdh.io/ai-asset-version'] = version;
  annotations['rhdh.io/ai-asset-source'] = `${sourceType}/${sourceId}`;

  // Source-type-specific reference annotations per design D5
  if (sourceType === 'oci') {
    // Validate OCI URI/digest agreement
    parseOciRef(record.sourceUri, record.digest);
    annotations['rhdh.io/oci-skill-ref'] = record.sourceUri;
  } else if (sourceType === 'npx') {
    // npx reference: <sourceUri>#<digest>
    const npxRef = `${record.sourceUri}#${record.digest}`;
    parseNpxRef(npxRef);
    annotations['rhdh.io/npx-skill-ref'] = npxRef;
  }

  // Build tags
  let metadataTags: string[] | undefined;
  if (record.tags && record.tags.length > 0) {
    const tagResult = normalizeTags(record.tags);
    if (tagResult.tags.length > 0) {
      metadataTags = tagResult.tags;
    }
  }

  const entity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: catalogName,
      namespace,
      title: record.name,
      ...(record.description ? { description: record.description } : {}),
      annotations,
      ...(metadataTags ? { tags: metadataTags } : {}),
    },
    spec: {
      type: 'skill',
      owner,
      lifecycle,
    },
  };

  return entity;
}
