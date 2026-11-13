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
 * Best-effort map from Adoption Insights `plugin_id` values to OOTB RHDH routes.
 * Unknown plugins render non-clickable (no broken routes).
 *
 * Covers core Backstage pages plus GA/TP frontend plugins from
 * `rhdh-plugin-export-overlays/default.packages.yaml` that expose a primary page.
 * Deployments can extend / override via widget `pluginDestinations` props.
 *
 * Keys are matched after {@link normalizePluginId}.
 */
const KNOWN_PLUGIN_DESTINATIONS: Record<string, string> = {
  // Core Backstage / RHDH shell
  catalog: '/catalog',
  'catalog-graph': '/catalog-graph',
  scaffolder: '/create',
  techdocs: '/docs',
  'tech-docs': '/docs',
  search: '/search',
  homepage: '/',
  home: '/',
  'user-settings': '/settings',
  notifications: '/notifications',

  // Supported overlay / community frontends with a primary page
  'adoption-insights': '/adoption-insights',
  'bulk-import': '/bulk-import',
  rbac: '/rbac',
  'tech-radar': '/tech-radar',
  extensions: '/extensions',
  orchestrator: '/orchestrator',
  'intelligent-assistant': '/intelligent-assistant',
  quay: '/quay',
  ansible: '/ansible',

  // Entity-mounted plugins (relative tab path; kept for historical ids)
  kubernetes: '/kubernetes',
};

export type PluginDestinationOverrides = Record<string, string>;

export function normalizePluginId(pluginId: string): string {
  return pluginId.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * True for absolute in-app paths (`/catalog`), false for protocol-relative
 * URLs (`//evil.com`) and other non-path values.
 */
export function isAbsoluteAppPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

/**
 * Parse admin `pluginDestinations` from widget layout / settings props.
 * Only absolute app paths (starting with `/`, not `//`) are accepted.
 */
export function parsePluginDestinations(
  value: unknown,
): PluginDestinationOverrides | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const destinations: PluginDestinationOverrides = {};
  for (const [rawId, rawPath] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (typeof rawId !== 'string' || rawId.trim() === '') {
      continue;
    }
    if (typeof rawPath !== 'string') {
      continue;
    }
    const path = rawPath.trim();
    if (!isAbsoluteAppPath(path)) {
      continue;
    }
    destinations[normalizePluginId(rawId)] = path;
  }

  return Object.keys(destinations).length > 0 ? destinations : undefined;
}

/**
 * Resolve a navigation path for a plugin id, or undefined when unknown.
 * Admin overrides win over the built-in map.
 */
export function resolvePluginDestination(
  pluginId: string,
  overrides?: PluginDestinationOverrides,
): string | undefined {
  const key = normalizePluginId(pluginId);
  return overrides?.[key] ?? KNOWN_PLUGIN_DESTINATIONS[key];
}
