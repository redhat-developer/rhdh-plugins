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
  CommonValidatorFunctions,
  type Entity,
  parseEntityRef,
} from '@backstage/catalog-model';
import type {
  IdentityTuple,
  SkillRecord,
  SkillSnapshot,
  SkillSourceType,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import {
  ANNOTATION_AI_ASSET_CATEGORY,
  ANNOTATION_AI_ASSET_SOURCE,
  ANNOTATION_AI_ASSET_VERSION,
  ANNOTATION_NPX_SKILL_REF,
  ANNOTATION_OCI_SKILL_REF,
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
 *
 * Discriminated union on `ok`: success branches carry entities and
 * snapshot metadata; failure branches carry an error message.
 */
export type ConsumeResult =
  | {
      /** Snapshot was successfully obtained and validated. */
      ok: true;
      /** Mapped entities (empty for loading/failed status). */
      entities: MappedSkillEntity[];
      /** Snapshot status from the connector. */
      status: SkillSnapshot['status'];
      /** Observation timestamp from the connector. */
      observedAt: string | null;
      /**
       * Skilldocs revision from the connector's `X-Skilldocs-Revision`
       * response header. Present only for completed OCI snapshots per
       * design D8.
       */
      revision: string | undefined;
      error?: never;
    }
  | {
      /** Snapshot fetch or validation failed. */
      ok: false;
      /** Empty array (no entities on failure). */
      entities: [];
      /** Error description. */
      error: string;
      status?: never;
      observedAt?: never;
      revision?: never;
    };

/**
 * Sentinel error thrown when the response body exceeds the byte limit.
 */
class ResponseTooLargeError extends Error {
  constructor(limit: number) {
    super(`Response body exceeds ${limit} byte limit`);
    this.name = 'ResponseTooLargeError';
  }
}

/**
 * Reads a response body as text with an explicit byte counter.
 *
 * If the response has a Content-Length header that exceeds `maxBytes`,
 * rejects immediately without reading the body. Otherwise reads
 * chunks from the body stream, aborting as soon as the accumulated
 * byte count exceeds `maxBytes`. This prevents a misbehaving
 * connector from exhausting memory when Content-Length is absent
 * (chunked transfer).
 *
 * @throws ResponseTooLargeError when the body exceeds `maxBytes`.
 */
async function readBoundedBody(
  response: Response,
  maxBytes: number,
): Promise<string> {
  // Fast-reject via Content-Length when present
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    throw new ResponseTooLargeError(maxBytes);
  }

  // Stream the body with a byte counter
  if (response.body) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new ResponseTooLargeError(maxBytes);
      }
      chunks.push(value);
    }

    const decoder = new TextDecoder();
    return (
      chunks.map(c => decoder.decode(c, { stream: true })).join('') +
      decoder.decode()
    );
  }

  // Fallback when response.body is not available (e.g., in tests)
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    throw new ResponseTooLargeError(maxBytes);
  }
  return text;
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
 * @param connectorBaseUrl - Connector base URL from Backstage discovery.
 * @param token - Service token for the connector.
 * @param source - Source consumer configuration.
 * @param namespace - Catalog namespace for produced entities.
 * @param defaultOwner - Default catalog owner.
 * @param defaultLifecycle - Default catalog lifecycle.
 * @param logger - Logger service.
 * @returns The consume result.
 */
export async function consumeSnapshot(
  connectorBaseUrl: string,
  token: string,
  source: SourceConsumerConfig,
  namespace: string,
  defaultOwner: string,
  defaultLifecycle: string,
  logger: LoggerService,
  signal?: AbortSignal,
): Promise<ConsumeResult> {
  const normalizedBaseUrl = connectorBaseUrl.replace(/\/+$/, '');
  const url = `${normalizedBaseUrl}/skills/${encodeURIComponent(
    source.sourceId,
  )}`;
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: 'error',
      signal,
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
    await response.body?.cancel();
    const msg = `Connector returned ${response.status} for source ${source.sourceId}`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  // Capture the skilldocs revision header (D8). Present only for
  // completed OCI snapshots; initial loading may omit it.
  const revision = response.headers.get('X-Skilldocs-Revision') ?? undefined;

  // Bound the response read per design D2.
  // Use a streaming reader with an explicit byte counter so that
  // oversized responses from a misbehaving connector are aborted
  // before the entire body is buffered into memory.
  let bodyText: string;
  try {
    bodyText = await readBoundedBody(response, MAX_RESPONSE_BYTES);
  } catch (error) {
    const msg =
      error instanceof ResponseTooLargeError
        ? `Response for source ${source.sourceId} exceeds ${MAX_RESPONSE_BYTES} byte limit`
        : `Failed to read response body for source ${source.sourceId}: ${error}`;
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
      revision,
    };
  }

  // Validate source references for ALL records before mapping.
  // An invalid source reference rejects the entire snapshot without
  // additions, updates, or removals (spec requirement).
  const refError = validateSourceReferences(
    snapshot.skills,
    snapshot.source.type,
  );
  if (refError) {
    const msg = `Invalid source reference from source ${source.sourceId}: ${refError}`;
    logger.error(msg);
    return { ok: false, entities: [], error: msg };
  }

  // Map accepted records to entities
  const entities = mapRecordsToEntities(
    snapshot.skills,
    snapshot.source.type,
    source.sourceId,
    normalizedBaseUrl,
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
    revision,
  };
}

/**
 * Validates source references for all records in a snapshot.
 *
 * OCI records must have a valid `sourceUri` that agrees with `digest`
 * per design D5. npx records must have a valid `sourceUri#digest`
 * reference. If any record fails validation, the entire snapshot
 * must be rejected without additions, updates, or removals.
 *
 * @returns An error message if any record fails, or `undefined` if all pass.
 */
function validateSourceReferences(
  records: SkillRecord[],
  sourceType: SkillSourceType,
): string | undefined {
  for (const record of records) {
    try {
      if (sourceType === 'oci') {
        parseOciRef(record.sourceUri, record.digest);
      } else if (sourceType === 'npx') {
        const npxRef = `${record.sourceUri}#${record.digest}`;
        parseNpxRef(npxRef);
      }
    } catch (error) {
      return `record key '${record.key}': ${error}`;
    }
  }
  return undefined;
}

/**
 * Checks whether a string is usable as a Backstage catalog hint
 * value (e.g. `spec.owner` or `spec.lifecycle`).
 *
 * Accepts full entity refs (`group:default/team-octo`), partial refs
 * (`group:team-octo`), and bare names (`team-octo`). Rejects
 * strings with characters that are invalid in a DNS subdomain
 * name component (spaces, punctuation, etc.).
 *
 * @returns boolean indicating hint string validity
 */
function isValidHintString(value: string): boolean {
  try {
    const ref = parseEntityRef(value, {
      defaultKind: 'group',
      defaultNamespace: 'default',
    });
    return CommonValidatorFunctions.isValidDnsSubdomain(ref.name);
  } catch {
    return false;
  }
}

/**
 * Maps skill records to catalog entities per design D3/D5.
 */
function mapRecordsToEntities(
  records: SkillRecord[],
  sourceType: SkillSourceType,
  sourceId: string,
  connectorBaseUrl: string,
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
        connectorBaseUrl,
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
  connectorBaseUrl: string,
  catalogName: string,
  namespace: string,
  defaultOwner: string,
  defaultLifecycle: string,
): Entity {
  const version = resolveVersion(record.version, record.digest);

  // Use configured defaults when owner/lifecycle hints are absent,
  // blank, or invalid per design D5.
  const ownerHint = record.owner?.trim();
  const owner =
    ownerHint && isValidHintString(ownerHint) ? ownerHint : defaultOwner;

  const lifecycleHint = record.lifecycle?.trim();
  const lifecycle =
    lifecycleHint && isValidHintString(lifecycleHint)
      ? lifecycleHint
      : defaultLifecycle;

  // Build annotations
  const annotations: Record<string, string> = {};

  // Source location
  const sourceLocationUri = `url:${record.sourceUri}`;
  annotations['backstage.io/source-location'] = sourceLocationUri;
  annotations[ANNOTATION_LOCATION] = sourceLocationUri;
  annotations[ANNOTATION_ORIGIN_LOCATION] = sourceLocationUri;

  // Required RHDH AI asset annotations
  annotations[ANNOTATION_AI_ASSET_CATEGORY] = 'skill';
  annotations[ANNOTATION_AI_ASSET_VERSION] = version;
  annotations[ANNOTATION_AI_ASSET_SOURCE] = `${sourceType}/${sourceId}`;

  // Source-type-specific reference annotations per design D5.
  // Source references are validated upfront by validateSourceReferences
  // before any records are mapped, so no per-entity validation is needed.
  if (sourceType === 'oci') {
    annotations[ANNOTATION_OCI_SKILL_REF] = record.sourceUri;

    // TechDocs annotation for OCI entities per design D5/D8.
    // Constructed from trusted connector/source configuration and the
    // record's verified digest. The provider does not download or
    // extract Markdown. npx entities do not receive this annotation.
    annotations[
      'backstage.io/techdocs-ref'
    ] = `url:${connectorBaseUrl}/skilldocs/${encodeURIComponent(
      sourceId,
    )}/${encodeURIComponent(record.digest)}`;
  } else if (sourceType === 'npx') {
    const npxRef = `${record.sourceUri}#${record.digest}`;
    annotations[ANNOTATION_NPX_SKILL_REF] = npxRef;
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
