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

import type { Layout, Layouts, ResponsiveProps } from 'react-grid-layout';

export const GRID_GAP = 16;

export const BREAKPOINTS = ['xl', 'lg', 'md', 'sm', 'xs', 'xxs'] as const;

export const readOnlyGridProps: ResponsiveProps = {
  margin: [GRID_GAP, GRID_GAP],
  rowHeight: 60,
  breakpoints: {
    xl: 1600,
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  },
  cols: {
    xl: 12,
    lg: 12,
    md: 12,
    sm: 12,
    xs: 12,
    xxs: 12,
  },
  isDraggable: false,
  isResizable: false,
  compactType: null,
};

export interface BreakpointLayout {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

/**
 * Build a per-breakpoint Layout entry from config or defaults.
 */
export function buildCardLayouts(
  id: string,
  breakpointLayouts?: Record<string, BreakpointLayout>,
): Record<string, Layout> {
  const layouts: Record<string, Layout> = {};

  if (breakpointLayouts) {
    for (const [breakpoint, layout] of Object.entries(breakpointLayouts)) {
      layouts[breakpoint] = {
        i: id,
        x: layout.x ?? 0,
        y: layout.y ?? 0,
        w: layout.w ?? 12,
        h: layout.h ?? 4,
        isDraggable: false,
        isResizable: false,
      };
    }
  } else {
    for (const breakpoint of BREAKPOINTS) {
      layouts[breakpoint] = {
        i: id,
        x: 0,
        y: 0,
        w: 12,
        h: 4,
        isDraggable: false,
        isResizable: false,
      };
    }
  }

  return layouts;
}

/**
 * Aggregate per-card layouts into the grouped `Layouts` structure react-grid-layout expects.
 */
export function aggregateLayouts(
  cards: Array<{ layouts: Record<string, Layout> }>,
): Layouts {
  const result: Layouts = {};
  for (const card of cards) {
    for (const [breakpoint, layout] of Object.entries(card.layouts)) {
      if (!result[breakpoint]) {
        result[breakpoint] = [];
      }
      result[breakpoint].push(layout);
    }
  }
  return result;
}
