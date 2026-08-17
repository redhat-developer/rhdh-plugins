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

import type { AuthService } from '@backstage/backend-plugin-api';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import {
  buildAiAssetCatalogFilter,
  isAiAsset,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type { AiCatalogAsset, AiCatalogAssetLoader } from './routes';
import type { AiCatalogAssetResource } from './rules';

// ---------------------------------------------------------------------------
// Entity → AiCatalogAsset mapping
// ---------------------------------------------------------------------------

function getSpecField(entity: Entity, field: string): unknown {
  return (entity.spec as Record<string, unknown> | undefined)?.[field];
}

function getStringSpecField(entity: Entity, field: string): string | undefined {
  const value = getSpecField(entity, field);
  return typeof value === 'string' ? value : undefined;
}

/** Runtime check that a value is a non-null plain object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Maps a Backstage catalog {@link @backstage/catalog-model#Entity} to the
 * `AiCatalogAsset` view model used by the AI catalog routes.
 *
 * @internal
 */
export function entityToAiCatalogAsset(entity: Entity): AiCatalogAsset {
  const remotes = getSpecField(entity, 'remotes') as
    | Array<{ type?: string; url?: string }>
    | undefined;
  // When multiple remotes share the same `type`, the last entry wins
  // (standard Object.fromEntries behavior).  This is acceptable because
  // entity schemas treat `type` as a discriminator — duplicates indicate
  // a malformed entity rather than intentional multi-URL support.
  const connectionEndpoints = remotes?.length
    ? Object.fromEntries(
        remotes
          .filter((r): r is { type: string; url: string } =>
            Boolean(r.type && r.url),
          )
          .map(r => [r.type, r.url]),
      )
    : undefined;

  const versions = getSpecField(entity, 'versions');

  return {
    id: stringifyEntityRef(entity),
    name: entity.metadata.title ?? entity.metadata.name,
    description: entity.metadata.description,
    category: entity.metadata.annotations?.['rhdh.io/ai-asset-category'],
    lifecycleStage: getStringSpecField(entity, 'lifecycle'),
    versionCount: Array.isArray(versions) ? versions.length : undefined,
    tags: entity.metadata.tags,
    usageDocs: getStringSpecField(entity, 'usageDocs'),
    connectionEndpoints:
      connectionEndpoints && Object.keys(connectionEndpoints).length > 0
        ? connectionEndpoints
        : undefined,
    config: isPlainObject(getSpecField(entity, 'config'))
      ? (getSpecField(entity, 'config') as Record<string, unknown>)
      : undefined,
    deploymentParameters: isPlainObject(
      getSpecField(entity, 'deploymentParameters'),
    )
      ? (getSpecField(entity, 'deploymentParameters') as Record<
          string,
          unknown
        >)
      : undefined,
  };
}

/**
 * Maps a Backstage catalog {@link @backstage/catalog-model#Entity} to the
 * minimal {@link AiCatalogAssetResource} shape used for permission rule
 * evaluation.
 *
 * @internal
 */
export function entityToAiCatalogAssetResource(
  entity: Entity,
): AiCatalogAssetResource {
  return {
    metadata: {
      annotations: entity.metadata.annotations,
      namespace: entity.metadata.namespace,
    },
  };
}

// ---------------------------------------------------------------------------
// CatalogAssetLoader
// ---------------------------------------------------------------------------

/**
 * `AiCatalogAssetLoader` implementation backed by the Backstage software
 * catalog. Loads AI catalog assets (`AI_ASSET_SPEC_TYPES`) using the
 * plugin's own service credentials.
 *
 * @remarks
 * Queries are performed with the plugin's own service credentials
 * (`auth.getOwnServiceCredentials()`). This intentionally bypasses
 * catalog-level RBAC so that the AI catalog's own permission layer
 * (ai-catalog.asset.access / ai-catalog.asset.access.usage-docs) is the
 * sole authorization gate. Without this, users whose catalog-level
 * policies hide certain entity kinds would never see AI assets at all,
 * regardless of their AI catalog permissions.
 *
 * @internal
 */
export class CatalogAssetLoader implements AiCatalogAssetLoader {
  constructor(
    private readonly catalog: CatalogService,
    private readonly auth: AuthService,
  ) {}

  async list(options?: {
    isAuthorized?: (resource: AiCatalogAssetResource) => boolean;
  }): Promise<AiCatalogAsset[]> {
    const credentials = await this.auth.getOwnServiceCredentials();
    const response = await this.catalog.getEntities(
      { filter: buildAiAssetCatalogFilter() },
      { credentials },
    );
    const entities = options?.isAuthorized
      ? response.items.filter(entity =>
          options.isAuthorized!(entityToAiCatalogAssetResource(entity)),
        )
      : response.items;
    return entities.map(entityToAiCatalogAsset);
  }

  async findById(id: string): Promise<AiCatalogAsset | undefined> {
    const credentials = await this.auth.getOwnServiceCredentials();
    const entity = await this.catalog.getEntityByRef(id, { credentials });
    // Unlike list() (filtered server-side via buildAiAssetCatalogFilter()),
    // getEntityByRef() can resolve any entity ref — reject non-AI entities
    // here so this loader never exposes catalog data outside the AI asset
    // taxonomy, regardless of what ref a caller passes in.
    return entity && isAiAsset(entity)
      ? entityToAiCatalogAsset(entity)
      : undefined;
  }
}

// ---------------------------------------------------------------------------
// getResources for the AI catalog permission integration router
// ---------------------------------------------------------------------------

/**
 * Creates the `getResources` callback required by
 * `createPermissionIntegrationRouter` for the `ai-catalog-asset` resource
 * type. It resolves entity-ref `resourceRefs` (as produced by
 * `permissions.authorize()`/`authorizeConditional()` calls that pass an
 * entity ref as `resourceRef`) to {@link AiCatalogAssetResource} instances
 * via the Backstage catalog, so that `/apply-conditions` requests from the
 * RBAC backend can evaluate `isAiAssetCategory`/`isFromConnector`/
 * `isInTenant` against real entity data instead of throwing
 * `NotImplementedError`.
 *
 * @internal
 */
export function createGetAiCatalogAssetResources(
  catalog: CatalogService,
  auth: AuthService,
) {
  return async (
    resourceRefs: string[],
  ): Promise<Array<AiCatalogAssetResource | undefined>> => {
    const credentials = await auth.getOwnServiceCredentials();
    const { items } = await catalog.getEntitiesByRefs(
      { entityRefs: resourceRefs },
      { credentials },
    );
    return items.map(entity =>
      entity ? entityToAiCatalogAssetResource(entity) : undefined,
    );
  };
}
