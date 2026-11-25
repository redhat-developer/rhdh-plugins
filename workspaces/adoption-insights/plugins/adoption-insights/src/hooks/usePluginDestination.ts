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

import { useMemo } from 'react';

import {
  type ApiHolder,
  configApiRef,
  useApiHolder,
} from '@backstage/core-plugin-api';
import {
  appTreeApiRef,
  coreExtensionData,
  routeResolutionApiRef,
} from '@backstage/frontend-plugin-api';
import type { AppTree, RouteRef } from '@backstage/frontend-plugin-api';

import {
  DEFAULT_PLUGIN_DESTINATIONS,
  isAbsoluteAppPath,
  normalizePluginId,
  type PluginDestinationOverrides,
} from '../homepage/popularContent/pluginDestinations';

const CONFIG_ROOT = 'adoptionInsights';
const CONFIG_KEY = 'pluginDestinations';

/** Where a resolved destination came from. Useful for debugging and tests. */
export type PluginDestinationSource = 'config' | 'app' | 'default';

export interface PluginDestination {
  /** App-relative path, for example `/catalog`. */
  href: string;
  source: PluginDestinationSource;
}

export type ResolvePluginDestinationOptions = {
  /** Widget-layout overrides; win over app-config for this card. */
  widgetOverrides?: PluginDestinationOverrides;
};

/**
 * Shell plugin ids that host many unrelated pages (Learning Paths, homepage
 * chrome, nav, …). Matching destinations by these ids alone picks an arbitrary
 * page — e.g. analytics `app` → `/learning-paths`.
 */
const SHARED_SHELL_PLUGIN_IDS = new Set(['app', 'root']);

/**
 * Rank the routes a plugin registered so that we pick its "main" page.
 *
 * There is no formal main page in the new frontend system, so this prefers an
 * explicit `root` or `index` route, then the shallowest path without params.
 */
export function rankRoute(
  name: string | undefined,
  path: string | undefined,
): number {
  if (name === 'root') {
    return 0;
  }
  if (name === 'index') {
    return 1;
  }
  if (!path || path.includes(':')) {
    return 100;
  }
  return 2 + path.split('/').filter(Boolean).length;
}

/**
 * Page name from an NFS page extension id.
 *
 * Examples:
 * - `page:catalog` → `catalog`
 * - `page:app/learning-paths` → `learning-paths`
 * - `page:bulk-import` → `bulk-import`
 */
export function pageNameFromExtensionId(
  extensionId: string,
): string | undefined {
  if (!extensionId.startsWith('page:')) {
    return undefined;
  }
  const parts = extensionId.slice('page:'.length).split('/').filter(Boolean);
  if (parts.length === 0) {
    return undefined;
  }
  if (parts.length >= 2 && SHARED_SHELL_PLUGIN_IDS.has(parts[0])) {
    return parts[1];
  }
  return parts[0];
}

/**
 * Whether this app-tree node is the page for the given analytics plugin id.
 *
 * Prefers `page:<id>` / `page:app/<id>` extension ids so shared shell modules
 * (`pluginId: 'app'`) are not treated as a single navigable destination.
 */
export function nodeMatchesPluginId(
  extensionId: string,
  nodePluginId: string | undefined,
  pluginId: string,
): boolean {
  const normalized = normalizePluginId(pluginId);
  const pageName = pageNameFromExtensionId(extensionId);
  if (pageName && normalizePluginId(pageName) === normalized) {
    return true;
  }

  if (!nodePluginId) {
    return false;
  }
  const normalizedNodePlugin = normalizePluginId(nodePluginId);
  if (SHARED_SHELL_PLUGIN_IDS.has(normalizedNodePlugin)) {
    return false;
  }
  return normalizedNodePlugin === normalized;
}

/**
 * Find the preferred route ref for a plugin in the NFS app tree.
 * Prefers routes named `root` / `index`, then the shallowest non-param path.
 */
export function findMainRouteRef(
  tree: AppTree,
  pluginId: string,
): RouteRef | undefined {
  const candidates: Array<{ ref: RouteRef; rank: number }> = [];

  for (const node of tree.nodes.values()) {
    if (
      !nodeMatchesPluginId(node.spec.id, node.spec.plugin?.pluginId, pluginId)
    ) {
      continue;
    }

    const ref = node.instance?.getData(coreExtensionData.routeRef);
    if (!ref) {
      continue;
    }

    const name = Object.entries(node.spec.plugin.routes ?? {}).find(
      ([, candidate]) => candidate === ref,
    )?.[0];
    const path = node.instance?.getData(coreExtensionData.routePath);

    candidates.push({ ref, rank: rankRoute(name, path) });
  }

  candidates.sort((a, b) => a.rank - b.rank);
  return candidates[0]?.ref;
}

function readConfiguredDestination(
  apiHolder: ApiHolder,
  pluginId: string,
): string | false | undefined {
  const config = apiHolder
    .get(configApiRef)
    ?.getOptionalConfig(CONFIG_ROOT)
    ?.getOptionalConfig(CONFIG_KEY);
  if (!config) {
    return undefined;
  }

  const key = normalizePluginId(pluginId);
  const raw =
    config.getOptional(pluginId) ??
    (key !== pluginId ? config.getOptional(key) : undefined);

  if (raw === false) {
    return false;
  }
  if (typeof raw === 'string' && raw.trim() && isAbsoluteAppPath(raw.trim())) {
    return raw.trim();
  }
  return undefined;
}

function resolveFromAppTree(
  apiHolder: ApiHolder,
  pluginId: string,
): string | undefined {
  const appTreeApi = apiHolder.get(appTreeApiRef);
  const routeResolutionApi = apiHolder.get(routeResolutionApiRef);
  if (!appTreeApi || !routeResolutionApi) {
    return undefined;
  }

  const ref = findMainRouteRef(appTreeApi.getTree().tree, pluginId);
  if (!ref) {
    return undefined;
  }

  try {
    const makeHref = routeResolutionApi.resolve(ref);
    const href = makeHref?.();
    if (href && isAbsoluteAppPath(href)) {
      return href;
    }
  } catch {
    // Route resolution is not available while the app is initializing.
  }
  return undefined;
}

/**
 * Pure resolver used by the hooks. Resolution order:
 * 1. Widget `pluginDestinations` (string override, `false` disables)
 * 2. `adoptionInsights.pluginDestinations.<pluginId>` (same)
 * 3. NFS app-tree route for the plugin
 * 4. {@link DEFAULT_PLUGIN_DESTINATIONS} fallback
 */
export function resolvePluginDestinationWithApis(
  apiHolder: ApiHolder,
  pluginId: string,
  options?: ResolvePluginDestinationOptions,
): PluginDestination | undefined {
  const key = normalizePluginId(pluginId);

  const widgetOverride = options?.widgetOverrides?.[key];
  if (widgetOverride === false) {
    return undefined;
  }
  if (typeof widgetOverride === 'string') {
    return { href: widgetOverride, source: 'config' };
  }

  const configured = readConfiguredDestination(apiHolder, pluginId);
  if (configured === false) {
    return undefined;
  }
  if (typeof configured === 'string') {
    return { href: configured, source: 'config' };
  }

  const appHref = resolveFromAppTree(apiHolder, pluginId);
  if (appHref) {
    return { href: appHref, source: 'app' };
  }

  const fallback = DEFAULT_PLUGIN_DESTINATIONS[key];
  return fallback ? { href: fallback, source: 'default' } : undefined;
}

/**
 * Resolves the link target for a plugin id reported by Adoption Insights.
 *
 * Returns `undefined` when the row should stay plain text.
 */
export function usePluginDestination(
  pluginId: string | undefined,
  options?: ResolvePluginDestinationOptions,
): PluginDestination | undefined {
  const apiHolder = useApiHolder();

  return useMemo(() => {
    if (!pluginId) {
      return undefined;
    }
    return resolvePluginDestinationWithApis(apiHolder, pluginId, options);
  }, [apiHolder, pluginId, options]);
}

/**
 * Batch-resolve destinations for a list of plugin ids (one memo for the card).
 * Map values are hrefs; missing keys / `undefined` mean plain-text rows.
 */
export function usePluginDestinationMap(
  pluginIds: readonly string[],
  options?: ResolvePluginDestinationOptions,
): ReadonlyMap<string, string | undefined> {
  const apiHolder = useApiHolder();
  // Stabilize ids for memo without requiring callers to memoize the array.
  const idsKey = pluginIds.map(normalizePluginId).join('\0');

  return useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const rawId of pluginIds) {
      const key = normalizePluginId(rawId);
      if (map.has(key)) {
        continue;
      }
      map.set(
        key,
        resolvePluginDestinationWithApis(apiHolder, rawId, options)?.href,
      );
    }
    return map;
    // idsKey captures pluginIds contents; options.widgetOverrides is the
    // only options field that affects resolution today.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiHolder, idsKey, options?.widgetOverrides]);
}
