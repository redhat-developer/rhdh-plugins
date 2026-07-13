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

import {
  type RemixiconComponentType,
  RiMagicLine,
  RiShieldCheckLine,
  RiServerLine,
  RiRobotLine,
  RiBrainLine,
  RiToolsLine,
  RiDatabase2Line,
} from '@remixicon/react';

export interface CategoryMeta {
  label: string;
  icon: RemixiconComponentType;
  color: string;
}

const categoryMetaMap: Record<string, CategoryMeta> = {
  skill: {
    label: 'Skills',
    icon: RiMagicLine,
    color: 'var(--boost-color-skill, #4ade80)',
  },
  rule: {
    label: 'Rules',
    icon: RiShieldCheckLine,
    color: 'var(--boost-color-rule, #c084fc)',
  },
  'mcp-server': {
    label: 'MCP Servers',
    icon: RiServerLine,
    color: 'var(--boost-color-mcp-server, #38bdf8)',
  },
  'ai-agent': {
    label: 'Agents',
    icon: RiRobotLine,
    color: 'var(--boost-color-agent, #60a5fa)',
  },
  'ai-model': {
    label: 'Models',
    icon: RiBrainLine,
    color: 'var(--boost-color-model, #f472b6)',
  },
  'ai-tool': {
    label: 'Tools',
    icon: RiToolsLine,
    color: 'var(--boost-color-tool, #fb923c)',
  },
  'vector-store': {
    label: 'Vector Stores',
    icon: RiDatabase2Line,
    color: 'var(--boost-color-vector-store, #2dd4bf)',
  },
};

const fallbackMeta: CategoryMeta = {
  label: 'Unknown',
  icon: RiBrainLine,
  color: 'var(--boost-color-unknown, #6b7280)',
};

export function getCategoryMeta(specType: string | undefined): CategoryMeta {
  if (!specType) return fallbackMeta;
  return categoryMetaMap[specType.toLowerCase()] ?? fallbackMeta;
}

export function getAllCategories(): { id: string; label: string }[] {
  return Object.entries(categoryMetaMap).map(([id, meta]) => ({
    id,
    label: meta.label,
  }));
}
