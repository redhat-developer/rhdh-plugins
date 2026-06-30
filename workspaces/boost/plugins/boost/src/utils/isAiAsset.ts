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
 */

const AI_ASSET_SPEC_TYPES: Record<string, Set<string>> = {
  airesource: new Set(['skill', 'rule']),
  api: new Set(['mcp-server']),
  component: new Set(['ai-agent']),
  resource: new Set(['ai-model', 'ai-tool', 'vector-store']),
};

/** Condition filter for NFS Blueprints — returns true for AI asset entities. */
export function isAiAsset(entity: {
  kind: string;
  spec?: { type?: string };
}): boolean {
  const kind = entity.kind.toLowerCase();
  const specType = entity.spec?.type;
  if (!specType) {
    return kind === 'airesource';
  }
  const allowed = AI_ASSET_SPEC_TYPES[kind];
  return allowed !== undefined && allowed.has(specType.toLowerCase());
}
