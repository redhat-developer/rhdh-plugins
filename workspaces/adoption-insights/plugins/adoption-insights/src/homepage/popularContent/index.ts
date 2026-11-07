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

export type {
  PopularContentMode,
  PopularContentItem,
  PopularContentConfigItem,
  PopularContentCardConfig,
} from './types';
export {
  DEFAULT_POPULAR_CONTENT_DISPLAY_COUNT,
  DEFAULT_POPULAR_CONTENT_MODE,
} from './types';
export {
  resolvePopularContentConfig,
  shouldFetchAdoptionInsights,
} from './resolvePopularContentConfig';
export { resolvePopularContentItems } from './resolvePopularContentItems';
export {
  normalizePluginId,
  parsePluginDestinations,
  resolvePluginDestination,
} from './pluginDestinations';
export type { PluginDestinationOverrides } from './pluginDestinations';
export {
  useAdoptionInsightsRanking,
  POPULAR_CONTENT_DEFAULT_LOOKBACK_DAYS,
} from './useAdoptionInsightsRanking';
export type {
  AdoptionInsightsRankingFetcher,
  UseAdoptionInsightsRankingOptions,
  UseAdoptionInsightsRankingResult,
} from './useAdoptionInsightsRanking';
export { PopularContentListCard } from './PopularContentListCard';
export type { PopularContentListCardProps } from './PopularContentListCard';
