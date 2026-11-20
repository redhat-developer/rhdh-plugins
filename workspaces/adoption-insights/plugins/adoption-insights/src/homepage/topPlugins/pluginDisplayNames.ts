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

import { normalizePluginId } from '../popularContent/pluginDestinations';

/**
 * Friendly labels for well-known Backstage / RHDH plugin ids.
 * Unknown ids fall back to a light title-case of the slug.
 */
const KNOWN_PLUGIN_DISPLAY_NAMES: Record<string, string> = {
  catalog: 'Software Catalog',
  'catalog-graph': 'Catalog Graph',
  scaffolder: 'Software Templates',
  techdocs: 'TechDocs',
  'tech-docs': 'TechDocs',
  search: 'Search',
  kubernetes: 'Kubernetes',
  ansible: 'Ansible',
  homepage: 'Homepage',
  home: 'Home',
  app: 'App',
  'user-settings': 'User Settings',
  notifications: 'Notifications',
  'adoption-insights': 'Adoption Insights',
  'bulk-import': 'Bulk Import',
  'global-header': 'Global Header',
  rbac: 'RBAC',
  'tech-radar': 'Tech Radar',
  extensions: 'Extensions',
  orchestrator: 'Orchestrator',
  'intelligent-assistant': 'Intelligent Assistant',
  quay: 'Quay',
  scorecard: 'Scorecard',
  'quick-start': 'Quickstart',
  quickstart: 'Quickstart',
};

function titleCaseSlug(pluginId: string): string {
  return pluginId
    .split(/[-_]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Resolve a user-facing display name for a plugin id.
 */
export function resolvePluginDisplayName(pluginId: string): string {
  const key = normalizePluginId(pluginId);
  return KNOWN_PLUGIN_DISPLAY_NAMES[key] ?? titleCaseSlug(key);
}
