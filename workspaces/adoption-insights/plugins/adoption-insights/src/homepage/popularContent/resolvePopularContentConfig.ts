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

import { parsePluginDestinations } from './pluginDestinations';
import {
  DEFAULT_POPULAR_CONTENT_DISPLAY_COUNT,
  DEFAULT_POPULAR_CONTENT_MODE,
  PopularContentCardConfig,
  PopularContentConfigItem,
  PopularContentMode,
} from './types';

const VALID_MODES: readonly PopularContentMode[] = [
  'auto',
  'hybrid',
  'curated',
];

function isPopularContentMode(value: unknown): value is PopularContentMode {
  return (
    typeof value === 'string' &&
    (VALID_MODES as readonly string[]).includes(value)
  );
}

function parseConfigItems(
  value: unknown,
): PopularContentConfigItem[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items: PopularContentConfigItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== 'string' || record.id.trim() === '') {
      continue;
    }
    items.push({
      id: record.id.trim(),
      title: typeof record.title === 'string' ? record.title : undefined,
      subtitle:
        typeof record.subtitle === 'string' ? record.subtitle : undefined,
      href: typeof record.href === 'string' ? record.href : undefined,
      iconUrl: typeof record.iconUrl === 'string' ? record.iconUrl : undefined,
    });
  }

  return items;
}

/**
 * Normalize homepage widget props / settings into a {@link PopularContentCardConfig}.
 * Unknown or invalid values fall back to safe defaults so the homepage stays loadable.
 */
export function resolvePopularContentConfig(
  props: Record<string, unknown> | undefined | null,
  defaults?: { title?: string },
): PopularContentCardConfig {
  const raw = props ?? {};

  const mode = isPopularContentMode(raw.mode)
    ? raw.mode
    : DEFAULT_POPULAR_CONTENT_MODE;

  const rawCount = raw.displayCount ?? raw.limit;
  let displayCount = DEFAULT_POPULAR_CONTENT_DISPLAY_COUNT;
  if (
    typeof rawCount === 'number' &&
    Number.isFinite(rawCount) &&
    rawCount > 0
  ) {
    displayCount = Math.floor(rawCount);
  } else if (typeof rawCount === 'string') {
    const parsed = Number.parseInt(rawCount, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      displayCount = parsed;
    }
  }

  const title =
    typeof raw.title === 'string' && raw.title.trim() !== ''
      ? raw.title.trim()
      : defaults?.title;

  return {
    mode,
    displayCount,
    title,
    items: parseConfigItems(raw.items),
    pluginDestinations: parsePluginDestinations(raw.pluginDestinations),
  };
}

/**
 * Whether the resolved mode should call Adoption Insights.
 * Curated mode never fetches; auto and hybrid do.
 */
export function shouldFetchAdoptionInsights(mode: PopularContentMode): boolean {
  return mode === 'auto' || mode === 'hybrid';
}
