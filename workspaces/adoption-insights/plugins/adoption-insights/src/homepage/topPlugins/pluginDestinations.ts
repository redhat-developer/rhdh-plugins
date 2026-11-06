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
 * Best-effort map from Adoption Insights plugin_id values to RHDH routes.
 * Unknown plugins render non-clickable (no broken routes).
 *
 * Keys are matched after {@link normalizePluginId}.
 */
const KNOWN_PLUGIN_DESTINATIONS: Record<string, string> = {
  catalog: '/catalog',
  scaffolder: '/create',
  techdocs: '/docs',
  'tech-docs': '/docs',
  search: '/search',
  kubernetes: '/kubernetes',
  ansible: '/ansible',
  homepage: '/',
  home: '/',
  'user-settings': '/settings',
  'adoption-insights': '/adoption-insights',
};

export function normalizePluginId(pluginId: string): string {
  return pluginId.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Resolve a navigation path for a plugin id, or undefined when unknown.
 */
export function resolvePluginDestination(pluginId: string): string | undefined {
  const key = normalizePluginId(pluginId);
  return KNOWN_PLUGIN_DESTINATIONS[key];
}
