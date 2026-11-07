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
 * Apply backend default-widget layouts to NFS widgets without filtering.
 *
 * All input widgets are returned. Widgets whose extension name matches a
 * `defaultWidgets` entry receive the backend-supplied layout; all other
 * widgets are included unchanged. Backend entries that don't match any
 * NFS widget are ignored.
 */
export function applyDefaultWidgetsToNfsWidgets(
  widgets: HomePageCardConfig[],
  defaultWidgets: VisibleDefaultWidget[],
): HomePageCardConfig[] {
  const layoutByRef = new Map<string, Record<string, Layout> | undefined>();
  for (const dw of defaultWidgets) {
    layoutByRef.set(dw.ref, dw.layout as Record<string, Layout> | undefined);
  }

  return widgets.map(widget => {
    const name = getHomepageWidgetExtensionName(widget);
    const layout = name ? layoutByRef.get(name) : undefined;

    if (layout) {
      return {
        ...widget,
        breakpointLayouts: layout as Record<Breakpoint, Layout>,
      };
    }

    return widget;
  });
}

/** @internal exported for tests */
export function widgetMatchesDefaultRef(
  widget: HomePageCardConfig,
  ref: string,
): boolean {
  return getHomepageWidgetExtensionName(widget) === ref;
}
