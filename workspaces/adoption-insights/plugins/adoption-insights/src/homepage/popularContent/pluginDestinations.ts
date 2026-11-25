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
 * Fallback map from Adoption Insights `plugin_id` values to OOTB RHDH routes.
 *
 * Not the source of truth for live apps — {@link usePluginDestination} prefers
 * admin config and the NFS app tree, and only uses this map when a plugin is
 * not mounted (historical rows, removed plugins, API-only packages).
 *
 * Keys are matched after {@link normalizePluginId}.
 */
export const DEFAULT_PLUGIN_DESTINATIONS: Record<string, string> = {
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

/** @deprecated Use {@link DEFAULT_PLUGIN_DESTINATIONS}. */
export const KNOWN_PLUGIN_DESTINATIONS = DEFAULT_PLUGIN_DESTINATIONS;

export type PluginDestinationOverrides = Record<string, string | false>;

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
 * Absolute app paths override; `false` disables the row link.
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
    const key = normalizePluginId(rawId);
    if (rawPath === false) {
      destinations[key] = false;
      continue;
    }
    if (typeof rawPath !== 'string') {
      continue;
    }
    const path = rawPath.trim();
    if (!isAbsoluteAppPath(path)) {
      continue;
    }
    destinations[key] = path;
  }

  return Object.keys(destinations).length > 0 ? destinations : undefined;
}

/**
 * Static fallback only (admin overrides → default map). Prefer
 * {@link usePluginDestination} so mounted NFS routes win at runtime.
 */
export function resolvePluginDestination(
  pluginId: string,
  overrides?: PluginDestinationOverrides,
): string | undefined {
  const key = normalizePluginId(pluginId);
  const override = overrides?.[key];
  if (override === false) {
    return undefined;
  }
  if (typeof override === 'string') {
    return override;
  }
  return DEFAULT_PLUGIN_DESTINATIONS[key];
}
