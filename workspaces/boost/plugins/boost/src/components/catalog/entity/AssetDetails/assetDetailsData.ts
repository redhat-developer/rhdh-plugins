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

import {
  getAgentModel,
  getDistinctSpecField,
  getHandoffRefs,
  getModelsAvailable,
  getSpecField,
  getSpecRemotes,
  getStringArraySpecField,
  type EntityRemote,
} from '../../../../utils/entityFields';

function getBooleanSpecField(
  entity: Entity,
  field: string,
): boolean | undefined {
  const spec = entity.spec as Record<string, unknown> | undefined;
  const value = spec?.[field];
  return typeof value === 'boolean' ? value : undefined;
}

function getModelField(entity: Entity, field: string): string | undefined {
  const spec = entity.spec as Record<string, unknown> | undefined;
  const models = spec?.models as Record<string, unknown> | undefined;
  const value = models?.[field];
  return typeof value === 'string' ? value : undefined;
}

export interface AgentDetailsData {
  readonly type: 'agent';
  readonly model?: string;
  readonly modelsAvailable: string[];
  readonly handoffDescription?: string;
  readonly handoffRefs: string[];
  readonly enableRAG?: boolean;
  readonly tools: string[];
}

export interface ModelServerDetailsData {
  readonly type: 'ai-model-server';
  readonly serverType?: string;
  readonly defaultModel?: string;
  readonly requiresApiKey?: boolean;
  readonly modelsAvailable: string[];
}

export interface McpServerDetailsData {
  readonly type: 'mcp-server';
  readonly remotes: EntityRemote[];
  readonly definition?: string;
}

export interface SkillDetailsData {
  readonly type: 'skill';
  readonly disciplines: string[];
  readonly categories: string[];
  readonly agents: string[];
}

export interface RuleDetailsData {
  readonly type: 'rule';
  readonly category?: string;
}

export type AssetTypeDetailsData =
  | AgentDetailsData
  | ModelServerDetailsData
  | McpServerDetailsData
  | SkillDetailsData
  | RuleDetailsData;

export interface AssetDetailsData {
  readonly description?: string;
  readonly rationale?: string;
  readonly version?: string;
  readonly typeDetails?: AssetTypeDetailsData;
}

export function getAssetDetailsData(entity: Entity): AssetDetailsData {
  const type = getSpecField(entity, 'type')?.toLowerCase();
  let typeDetails: AssetTypeDetailsData | undefined;

  switch (type) {
    case 'agent':
      typeDetails = {
        type,
        model: getAgentModel(entity),
        modelsAvailable: getModelsAvailable(entity),
        handoffDescription: getDistinctSpecField(entity, 'handoffDescription'),
        handoffRefs: getHandoffRefs(entity),
        enableRAG: getBooleanSpecField(entity, 'enableRAG'),
        tools: getStringArraySpecField(entity, 'tools'),
      };
      break;
    case 'ai-model-server':
      typeDetails = {
        type,
        serverType: getSpecField(entity, 'serverType'),
        defaultModel: getModelField(entity, 'default'),
        requiresApiKey: getBooleanSpecField(entity, 'requiresApiKey'),
        modelsAvailable: getModelsAvailable(entity),
      };
      break;
    case 'mcp-server':
      typeDetails = {
        type,
        remotes: getSpecRemotes(entity),
        definition: getDistinctSpecField(entity, 'definition'),
      };
      break;
    case 'skill':
      typeDetails = {
        type,
        disciplines: getStringArraySpecField(entity, 'disciplines'),
        categories: getStringArraySpecField(entity, 'categories'),
        agents: getStringArraySpecField(entity, 'agents'),
      };
      break;
    case 'rule':
      typeDetails = { type, category: getSpecField(entity, 'category') };
      break;
    default:
      break;
  }

  return {
    description: entity.metadata.description?.trim() || undefined,
    rationale: getDistinctSpecField(entity, 'rationale'),
    version: entity.metadata.annotations?.['rhdh.io/ai-asset-version'],
    typeDetails,
  };
}

export function hasAssetDetails(data: AssetDetailsData): boolean {
  const details = data.typeDetails;
  if (data.description || data.rationale || data.version) return true;
  if (!details) return false;

  switch (details.type) {
    case 'agent':
      return Boolean(
        details.model ||
        details.modelsAvailable.length ||
        details.handoffDescription ||
        details.handoffRefs.length ||
        details.enableRAG !== undefined ||
        details.tools.length,
      );
    case 'ai-model-server':
      return Boolean(
        details.serverType ||
        details.defaultModel ||
        details.requiresApiKey !== undefined ||
        details.modelsAvailable.length,
      );
    case 'mcp-server':
      return Boolean(details.remotes.length || details.definition);
    case 'skill':
      return Boolean(
        details.disciplines.length ||
        details.categories.length ||
        details.agents.length,
      );
    case 'rule':
      return Boolean(details.category);
    default:
      return false;
  }
}
