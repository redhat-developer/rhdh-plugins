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

export interface DefaultWidgetLayoutEntry {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export type DefaultWidgetLayoutPerBreakpoint = Record<
  string,
  DefaultWidgetLayoutEntry
>;

export interface ResolvedDefaultWidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

const DEFAULT_WIDTH = 12;
const DEFAULT_HEIGHT = 4;

/** Breakpoints used by legacy homepage react-grid-layout grids. */
export const HOME_PAGE_GRID_BREAKPOINTS = [
  'xl',
  'lg',
  'md',
  'sm',
  'xs',
  'xxs',
] as const;

/**
 * Picks the layout entry for a breakpoint, falling back to `xl` when omitted.
 */
export function resolveLayoutEntryForBreakpoint(
  widgetLayout: DefaultWidgetLayoutPerBreakpoint | undefined,
  breakpoint: string,
): DefaultWidgetLayoutEntry {
  if (!widgetLayout) {
    return {};
  }
  if (widgetLayout[breakpoint]) {
    return widgetLayout[breakpoint]!;
  }
  return widgetLayout.xl ?? {};
}

/**
 * Resolves grid positions for default widgets. When `y` is omitted, widgets are
 * stacked vertically in config order for each breakpoint.
 */
export function resolveDefaultWidgetLayout(
  layout: DefaultWidgetLayoutEntry,
  breakpoint: string,
  nextYByBreakpoint: Map<string, number>,
): ResolvedDefaultWidgetLayout {
  const w = layout.w ?? DEFAULT_WIDTH;
  const h = layout.h ?? DEFAULT_HEIGHT;
  const x = layout.x ?? 0;

  let y: number;
  if (layout.y !== undefined) {
    y = layout.y;
    nextYByBreakpoint.set(
      breakpoint,
      Math.max(nextYByBreakpoint.get(breakpoint) ?? 0, y + h),
    );
  } else {
    y = nextYByBreakpoint.get(breakpoint) ?? 0;
    nextYByBreakpoint.set(breakpoint, y + h);
  }

  return { x, y, w, h };
}
