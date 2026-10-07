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

import { z } from 'zod';

import { Breakpoint, HomePageCardConfig, Layout } from '../types';

const breakpointSchema = z
  .record(
    z.string(),
    z.object({
      w: z.number().optional(),
      h: z.number().optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    }),
  )
  .optional();

const widgetLayoutEntrySchema = z.object({
  priority: z.number().optional(),
  breakpoints: breakpointSchema,
  props: z.record(z.string(), z.unknown()).optional(),
});

/**
 * `widgetLayout` config for `home-page-layout:homepage/dynamic-homepage-layout`.
 * Keys are the widget `name`, same as scorecard's homepage layout entries.
 * The extension id also matches.
 */
export const widgetLayoutSchema = z
  .record(z.string(), widgetLayoutEntrySchema)
  .optional();

export type WidgetLayoutConfig = NonNullable<
  z.infer<typeof widgetLayoutSchema>
>;

type WidgetLayoutEntry = z.infer<typeof widgetLayoutEntrySchema>;

function widgetExtensionId(widget: HomePageCardConfig): string {
  const id = widget.node?.spec?.id ?? '';
  const fromId = id.includes('/') ? id.split('/').pop() : undefined;
  return fromId || widget.name || '';
}

function layoutEntry(
  layoutConfig: WidgetLayoutConfig,
  widget: HomePageCardConfig,
): WidgetLayoutEntry | undefined {
  const extensionId = widgetExtensionId(widget);
  return (
    layoutConfig[extensionId] ??
    (widget.name ? layoutConfig[widget.name] : undefined)
  );
}

function withLayout(
  widget: HomePageCardConfig,
  entry: WidgetLayoutEntry | undefined,
  props?: Record<string, unknown>,
): HomePageCardConfig {
  const breakpoints = entry?.breakpoints ?? widget.breakpointLayouts;
  return {
    ...widget,
    ...(breakpoints
      ? {
          breakpointLayouts: breakpoints as Record<Breakpoint, Layout>,
        }
      : {}),
    ...(props ? { props } : {}),
  };
}

/**
 * Copy configured breakpoints onto widgets. Used by the editable homepage,
 * which takes per-card values from settings.
 */
export function applyWidgetLayoutBreakpoints(
  widgets: HomePageCardConfig[],
  layoutConfig: WidgetLayoutConfig = {},
): HomePageCardConfig[] {
  return widgets.map(widget => {
    const entry = layoutEntry(layoutConfig, widget);
    if (!entry?.breakpoints) {
      return widget;
    }
    return withLayout(widget, entry, widget.props);
  });
}

/**
 * On a read-only homepage, forward `widgetLayout.props` into each widget
 * and apply its breakpoints and priority.
 */
export function applyReadOnlyWidgetLayout(
  widgets: HomePageCardConfig[],
  layoutConfig: WidgetLayoutConfig = {},
): HomePageCardConfig[] {
  return widgets
    .map((widget, order) => {
      const entry = layoutEntry(layoutConfig, widget);
      return {
        card: withLayout(widget, entry, entry?.props ?? widget.props),
        priority: entry?.priority ?? 0,
        order,
      };
    })
    .sort((a, b) => b.priority - a.priority || a.order - b.order)
    .map(item => item.card);
}
