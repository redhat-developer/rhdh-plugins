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

import type { Entity } from '@backstage/catalog-model';

/**
 * AI asset kind/type combinations from the entity model:
 *
 * | Category       | Kind              | spec.type        |
 * |--------------- |------------------ |----------------- |
 * | Skills         | AiResource        | skill            |
 * | Rules          | AiResource        | rule             |
 * | Agents         | AiResource        | agent            |
 * | Model Servers  | AiModelServerAPI  | ai-model-server  |
 * | MCP Servers    | API               | mcp-server       |
 * | Tools          | Resource          | ai-tool          |
 * | Vector Stores  | Resource          | vector-store     |
 *
 * This map is the single source of truth used by {@link isAiAsset} and
 * {@link buildAiAssetCatalogFilter}, shared by both the `boost` frontend
 * plugin and the `boost-backend` plugin so the AI asset taxonomy can never
 * drift between the two.
 *
 * @public
 */
export const AI_ASSET_SPEC_TYPES: Record<string, Set<string>> = {
  airesource: new Set(['skill', 'rule', 'agent']),
  aimodelserverapi: new Set(['ai-model-server']),
  api: new Set(['mcp-server']),
  resource: new Set(['ai-tool', 'vector-store']),
};

/**
 * Checks whether an entity's `kind`/`spec.type` combination is in the AI
 * asset taxonomy ({@link AI_ASSET_SPEC_TYPES}). Both `kind` and `spec.type`
 * are required and matched case-insensitively — AiResource entities without
 * a `spec.type` are not considered AI assets.
 *
 * @public
 */
export function isAiAsset(entity: Entity): boolean {
  const kind = entity.kind.toLocaleLowerCase('en-US');
  const specType = (entity.spec as Record<string, unknown> | undefined)
    ?.type as string | undefined;
  if (!specType) {
    return false;
  }
  const allowed = AI_ASSET_SPEC_TYPES[kind];
  return (
    allowed !== undefined && allowed.has(specType.toLocaleLowerCase('en-US'))
  );
}

/**
 * Builds the catalog entity filter (OR across kind/spec.type pairs) used to
 * select only AI catalog assets from the Backstage catalog, for use with
 * `catalogApi.getEntities({ filter: buildAiAssetCatalogFilter() })`.
 *
 * @public
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
