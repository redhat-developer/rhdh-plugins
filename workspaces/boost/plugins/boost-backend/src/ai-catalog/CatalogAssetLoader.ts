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
import type { AiCatalogAsset, AiCatalogAssetLoader } from './routes';
import type { AiCatalogAssetResource } from './rules';

// ---------------------------------------------------------------------------
// AI asset kind/spec.type map
// ---------------------------------------------------------------------------

/**
 * AI asset kind/type combinations from the entity model. Mirrors
 * `AI_ASSET_SPEC_TYPES` in the `boost` frontend plugin
 * (`plugins/boost/src/utils/isAiAsset.ts`) — duplicated here because
 * backend code cannot import from the frontend package. Keep the two in
 * sync if the taxonomy changes.
 *
 * @internal
 */
export const AI_ASSET_SPEC_TYPES: Record<string, Set<string>> = {
  airesource: new Set(['skill', 'rule']),
  api: new Set(['mcp-server']),
  component: new Set(['ai-agent']),
  resource: new Set(['ai-model', 'ai-tool', 'vector-store']),
};

/**
 * Builds the catalog entity filter (OR across kind/spec.type pairs) used
 * to select only AI catalog assets from the Backstage catalog.
 *
 * @internal
 */
export function buildAiAssetCatalogFilter(): Record<
  string,
  string | string[]
>[] {
  return Object.entries(AI_ASSET_SPEC_TYPES).map(([kind, types]) => ({
    kind,
    'spec.type': [...types],
  }));
}

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
    config: getSpecField(entity, 'config') as
      | Record<string, unknown>
      | undefined,
    deploymentParameters: getSpecField(entity, 'deploymentParameters') as
      | Record<string, unknown>
      | undefined,
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
 * @internal
 */
export class CatalogAssetLoader implements AiCatalogAssetLoader {
  constructor(
    private readonly catalog: CatalogService,
    private readonly auth: AuthService,
  ) {}

  async list(): Promise<AiCatalogAsset[]> {
    const credentials = await this.auth.getOwnServiceCredentials();
    const response = await this.catalog.getEntities(
      { filter: buildAiAssetCatalogFilter() },
      { credentials },
    );
    return response.items.map(entityToAiCatalogAsset);
  }

  async findById(id: string): Promise<AiCatalogAsset | undefined> {
    const credentials = await this.auth.getOwnServiceCredentials();
    const entity = await this.catalog.getEntityByRef(id, { credentials });
    return entity ? entityToAiCatalogAsset(entity) : undefined;
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
