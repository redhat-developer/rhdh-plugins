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
 * | Category     | Kind        | spec.type      |
 * |------------- |------------ |--------------- |
 * | Skills       | AiResource  | skill          |
 * | Rules        | AiResource  | rule           |
 * | MCP Servers  | API         | mcp-server     |
 * | Agents       | Component   | ai-agent       |
 * | Models       | Resource    | ai-model       |
 * | Tools        | Resource    | ai-tool        |
 * | Vector Stores| Resource    | vector-store   |
 *
 * This map is the single source of truth used by both `isAiAsset`
 * and `buildCatalogFilter` in useAiAssets.ts. Keep them in sync.
 */
export const AI_ASSET_SPEC_TYPES: Record<string, Set<string>> = {
  airesource: new Set(['skill', 'rule']),
  api: new Set(['mcp-server']),
  component: new Set(['ai-agent']),
  resource: new Set(['ai-model', 'ai-tool', 'vector-store']),
};

/**
 * Condition filter for NFS Blueprints — returns true for AI asset entities.
 *
 * An entity is an AI asset if its kind is in AI_ASSET_SPEC_TYPES and its
 * spec.type matches one of the allowed types for that kind. Both kind and
 * spec.type are required — AiResource entities without a spec.type are
 * not considered AI assets (the catalog model requires spec.type for
 * concrete entity processing).
 */
export function isAiAsset(entity: Entity): boolean {
  const kind = entity.kind.toLowerCase();
  const specType = (entity.spec as Record<string, unknown> | undefined)
    ?.type as string | undefined;
  if (!specType) return false;
  const allowed = AI_ASSET_SPEC_TYPES[kind];
  return allowed !== undefined && allowed.has(specType.toLowerCase());
}
