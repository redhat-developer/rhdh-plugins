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

import type { VisibleDefaultWidget } from '../api/DefaultWidgetsApiClient';
import type { HomePageCardConfig, Breakpoint, Layout } from '../types';

/**
 * Extension name from `home-page-widget:<plugin>/<name>`.
 */
export function getHomepageWidgetExtensionName(
  widget: HomePageCardConfig,
): string {
  const id = widget.node?.spec?.id ?? '';
  const fromId = id.includes('/') ? id.split('/').pop() : undefined;
  return fromId || widget.name || '';
}

/**
 * Filter/order NFS widgets using backend persona visibility (`defaultWidgets`).
 * Applies per-widget layouts from the visible default-widget entries.
 */
export function applyDefaultWidgetsToNfsWidgets(
  widgets: HomePageCardConfig[],
  defaultWidgets: VisibleDefaultWidget[],
): HomePageCardConfig[] {
  const byExtensionName = new Map<string, HomePageCardConfig>();
  for (const widget of widgets) {
    const name = getHomepageWidgetExtensionName(widget);
    if (name) {
      byExtensionName.set(name, widget);
    }
  }

  const result: HomePageCardConfig[] = [];

  for (const defaultWidget of defaultWidgets) {
    const match = byExtensionName.get(defaultWidget.ref);
    if (!match) {
      continue;
    }

    const layout = defaultWidget.layout as Record<string, Layout> | undefined;

    result.push({
      ...match,
      breakpointLayouts: layout
        ? (layout as Record<Breakpoint, Layout>)
        : match.breakpointLayouts,
    });
  }

  return result;
}

/** @internal exported for tests */
export function widgetMatchesDefaultRef(
  widget: HomePageCardConfig,
  ref: string,
): boolean {
  return getHomepageWidgetExtensionName(widget) === ref;
}
