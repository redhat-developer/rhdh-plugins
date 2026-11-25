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

import { PluginTrend } from '../../types';
import { PopularContentItem } from '../popularContent';
import { resolvePluginDisplayName } from './pluginDisplayNames';

/**
 * Map Adoption Insights plugin trends into the shared Popular Content list model.
 * Rank numbers (via `showRank`) replace per-row icons in the Top Plugins card.
 *
 * Destinations are resolved at render time via {@link usePluginDestinationMap}
 * (admin config → NFS app tree → static fallback). This mapper leaves `href`
 * unset so the card can fill it from the live app.
 */
export function mapPluginTrendsToPopularContentItems(
  plugins: PluginTrend[],
): PopularContentItem[] {
  return plugins
    .filter(plugin => typeof plugin.plugin_id === 'string' && plugin.plugin_id)
    .map(plugin => {
      const id = plugin.plugin_id;
      return {
        id,
        title: resolvePluginDisplayName(id),
        subtitle: id,
        visitCount: plugin.visit_count,
        trendPercentage: plugin.trend_percentage,
      };
    });
}

/**
 * Apply a pre-resolved destination map to list items.
 * Explicit item hrefs (curated / hybrid pins) are preserved.
 */
export function applyResolvedDestinations(
  items: PopularContentItem[],
  destinations: ReadonlyMap<string, string | undefined>,
  normalizeId: (id: string) => string,
): PopularContentItem[] {
  return items.map(item => {
    if (item.href) {
      return item;
    }
    const href = destinations.get(normalizeId(item.id));
    return href ? { ...item, href } : item;
  });
}
