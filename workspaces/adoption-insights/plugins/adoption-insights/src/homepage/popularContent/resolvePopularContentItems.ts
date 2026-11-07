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
  PopularContentCardConfig,
  PopularContentConfigItem,
  PopularContentItem,
} from './types';

function applyOverride(
  base: PopularContentItem,
  override?: PopularContentConfigItem,
): PopularContentItem {
  if (!override) {
    return base;
  }
  return {
    ...base,
    title: override.title ?? base.title,
    subtitle: override.subtitle ?? base.subtitle,
    href: override.href ?? base.href,
    iconUrl: override.iconUrl ?? base.iconUrl,
  };
}

function configItemToPopularContentItem(
  item: PopularContentConfigItem,
): PopularContentItem {
  return {
    id: item.id,
    title: item.title?.trim() || item.id,
    subtitle: item.subtitle,
    href: item.href,
    iconUrl: item.iconUrl,
  };
}

/**
 * Build the final ordered list for a Popular Content card from mode + ranked data.
 *
 * - **auto** — first `displayCount` ranked items
 * - **curated** — admin `items` only (no ranked data used); truncated to `displayCount`
 * - **hybrid** — admin pins first (with overrides), then fill from ranked items not already pinned
 */
export function resolvePopularContentItems(options: {
  config: PopularContentCardConfig;
  ranked: PopularContentItem[];
}): PopularContentItem[] {
  const { config, ranked } = options;
  const { mode, displayCount, items: configItems = [] } = config;

  if (mode === 'curated') {
    return configItems
      .slice(0, displayCount)
      .map(configItemToPopularContentItem);
  }

  if (mode === 'auto') {
    return ranked.slice(0, displayCount);
  }

  // hybrid
  const overrideById = new Map(
    configItems.map(item => [item.id, item] as const),
  );
  const rankedById = new Map(ranked.map(item => [item.id, item] as const));

  const result: PopularContentItem[] = [];
  const used = new Set<string>();

  for (const pin of configItems) {
    if (result.length >= displayCount) {
      break;
    }
    if (used.has(pin.id)) {
      continue;
    }
    const rankedMatch = rankedById.get(pin.id);
    const base = rankedMatch ?? configItemToPopularContentItem(pin);
    result.push(applyOverride(base, pin));
    used.add(pin.id);
  }

  for (const item of ranked) {
    if (result.length >= displayCount) {
      break;
    }
    if (used.has(item.id)) {
      continue;
    }
    result.push(applyOverride(item, overrideById.get(item.id)));
    used.add(item.id);
  }

  return result;
}
