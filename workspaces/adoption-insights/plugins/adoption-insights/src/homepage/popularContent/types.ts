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

import type { ReactNode } from 'react';

/**
 * Admin-controlled content selection modes for Popular Content homepage cards.
 *
 * - `auto` — usage-ranked from Adoption Insights
 * - `hybrid` — admin pins/overrides merged with usage ranking
 * - `curated` — explicit admin list only (no Adoption Insights call)
 */
export type PopularContentMode = 'auto' | 'hybrid' | 'curated';

/** Dimension-agnostic list item rendered by the shared Popular Content shell. */
export type PopularContentItem = {
  /** Stable identity used for pins, overrides, and React keys. */
  id: string;
  /** User-facing label. */
  title: string;
  /** Optional secondary line (kind, namespace, site, etc.). */
  subtitle?: string;
  /**
   * Navigation target. When omitted, the item is rendered non-clickable
   * (invalid destinations must not become broken routes).
   */
  href?: string;
  /** Optional icon image URL handled by the card. */
  iconUrl?: string;
  /**
   * Optional leading icon (e.g. 16px MUI icon). Preferred over {@link iconUrl}
   * when both are set.
   */
  icon?: ReactNode;
  /**
   * Optional visit / hit count shown as trailing muted text
   * (e.g. `1,284 visits`).
   */
  visitCount?: number;
  /**
   * Optional trend percentage from Adoption Insights
   * (e.g. `"12.5"` or `"-5"`). Color/arrow derived at render time.
   */
  trendPercentage?: string | number;
};

/** Admin-supplied pin / curated entry (and optional overrides for hybrid). */
export type PopularContentConfigItem = {
  id: string;
  title?: string;
  subtitle?: string;
  href?: string;
  iconUrl?: string;
};

/** Shared widget config resolved from homepage card settings / layout props. */
export type PopularContentCardConfig = {
  mode: PopularContentMode;
  /** Visible row count. Default: 3. */
  displayCount: number;
  /** Overridable card title. */
  title?: string;
  /**
   * Curated list (curated mode) or pins/overrides (hybrid mode).
   * Ignored in auto mode.
   */
  items?: PopularContentConfigItem[];
  /**
   * Extra / overriding `plugin_id` → app path map for ranked rows (and curated
   * items that omit `href`). Keys are normalized like built-in destinations.
   */
  pluginDestinations?: Record<string, string>;
};

export const DEFAULT_POPULAR_CONTENT_DISPLAY_COUNT = 3;
export const DEFAULT_POPULAR_CONTENT_MODE: PopularContentMode = 'auto';
