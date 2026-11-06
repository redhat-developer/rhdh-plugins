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
import { resolvePluginDestination } from './pluginDestinations';

/**
 * Map Adoption Insights plugin trends into the shared Popular Content list model.
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
        href: resolvePluginDestination(id),
        visitCount: plugin.visit_count,
        trendPercentage: plugin.trend_percentage,
      };
    });
}
