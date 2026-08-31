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

import type { AIAssetCategory } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';
import type { MappingRule } from './types';

/**
 * Per-category mapping rules from RHDH current entity model to upstream
 * Backstage target kinds. Based on ai-catalog-entity-model/design.md
 * Decision 1 and the annotation specification.
 *
 * @public
 */
export const MAPPING_RULES: Record<AIAssetCategory, MappingRule> = {
  'mcp-server': {
    currentKind: 'API',
    currentSpecType: 'mcp-server',
    targetKind: 'API',
    targetModel: 'McpServerApiEntity',
    confidence: 'high',
    transformations: [
      'Kind already aligned (API). No kind change required.',
      'Adopt spec.remotes instead of spec.definition',
      'Opt in to @backstage/plugin-catalog-backend-module-ai-model',
    ],
    rfcIds: ['backstage#34016', 'backstage#32062'],
  },
  skill: {
    currentKind: 'AIResource',
    currentSpecType: 'skill',
    targetKind: 'AiResource',
    targetModel: undefined,
    confidence: 'medium-high',
    transformations: [
      'Kind/name casing alignment: AIResource → AiResource',
      'Field alignment per upstream AiResource schema',
    ],
    rfcIds: ['backstage#33575'],
  },
  rule: {
    currentKind: 'AIResource',
    currentSpecType: 'rule',
    targetKind: 'AiResource',
    targetModel: undefined,
    confidence: 'medium-high',
    transformations: [
      'Kind/name casing alignment: AIResource → AiResource',
      'Field alignment per upstream AiResource schema',
    ],
    rfcIds: ['backstage#33575'],
  },
  'model-server': {
    currentKind: 'Resource',
    currentSpecType: 'ai-model-server',
    targetKind: 'API',
    targetModel: undefined,
    confidence: 'medium-low',
    transformations: [
      'Kind change: Resource → API (if upstream PR merges)',
      'Field mapping for API-specific fields',
    ],
    rfcIds: ['backstage#34476', 'backstage#33060'],
  },
  'ai-model': {
    currentKind: 'Resource',
    currentSpecType: 'ai-model',
    targetKind: undefined,
    targetModel: undefined,
    confidence: 'low',
    transformations: ['No upstream kind yet. Continue using current mapping.'],
    rfcIds: [],
  },
  'skill-bundle': {
    currentKind: 'AIResource',
    currentSpecType: 'ai-skill-bundle',
    targetKind: undefined,
    targetModel: undefined,
    confidence: 'low',
    transformations: [
      'No upstream kind yet. Stay on current mapping; track future RFCs.',
    ],
    rfcIds: [],
  },
  agent: {
    currentKind: 'Component',
    currentSpecType: 'ai-agent',
    targetKind: undefined,
    targetModel: undefined,
    confidence: 'low',
    transformations: [
      'No upstream kind via RFC #32062 (MCP-only). Track agent-kind ownership under RHDHPLAN-1113.',
    ],
    rfcIds: [],
  },
};
