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

import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Breakpoints aligned with the previous Masonry `columns={{ xs: 1, sm: 2, lg: 3 }}`
 * and RHDH entity page Grid — applied to the tab content width, not the viewport.
 */
export const ENTITY_SCORECARD_COLUMN_BREAKPOINTS = {
  sm: 600,
  lg: 1200,
} as const;

/** Map a container width to Masonry column count. */
export const resolveEntityScorecardColumns = (width: number): number => {
  if (width >= ENTITY_SCORECARD_COLUMN_BREAKPOINTS.lg) return 3;
  if (width >= ENTITY_SCORECARD_COLUMN_BREAKPOINTS.sm) return 2;
  return 1;
};

/**
 * Observes an element's width and returns a Masonry column count.
 * Uses ResizeObserver so docked drawers (e.g. Quickstart) that shrink the
 * entity tab without resizing the viewport still update columns.
 */
export const useEntityScorecardColumns = (
  ref: RefObject<HTMLElement | null>,
): number => {
  // Default to 1 to avoid a wide-column flash before the first measurement.
  const [columns, setColumns] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = (width: number) => {
      const next = resolveEntityScorecardColumns(width);
      setColumns(prev => (prev === next ? prev : next));
    };

    update(el.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(entries => {
      if (!entries.length) return;
      update(entries[0].contentRect.width);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return columns;
};
