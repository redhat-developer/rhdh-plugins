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

/*
 * A React hook that observes the width of a DOM element and
 * returns a responsive "container size" (`xs | sm | md | lg | xl`)
 * based on predefined breakpoints.
 *
 * Unlike window-based media queries, this hook is **container-based**:
 * the returned size depends on the element's own width, not the viewport.
 *
 * Internally, it:
 * - Reads the element's initial layout width on mount
 * - Uses ResizeObserver to track width changes
 * - Maps the width to MUI-like breakpoints
 * - Updates state only when the breakpoint actually changes
 *
 * Optional `notifyWindowResize`: when true, also dispatches a `window` `resize`
 * event when the observed width changes meaningfully. Dispatches are coalesced
 * to at most once per animation frame to avoid resize storms during continuous
 * container resizes. That lets react-grid-layout's `WidthProvider` (used by
 * `CustomHomepageGrid`) remeasure when the main column shrinks without a
 * viewport resize (e.g. RHDH docked drawer).
 * */

import { useLayoutEffect, useState, RefObject } from 'react';

export type UseContainerQueryOptions = {
  notifyWindowResize?: boolean;
};

// Container Breakpoints (MUI-like, but container-based)
export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const CONTAINER_BREAKPOINTS = {
  xs: 0, // <600
  sm: 600, // ≥600
  md: 900, // ≥900
  lg: 1200, // ≥1200
  xl: 1536, // ≥1536
} as const;

// Width → containerSize mapper
const resolveContainerSize = (width: number): ContainerSize => {
  if (width >= CONTAINER_BREAKPOINTS.xl) return 'xl';
  if (width >= CONTAINER_BREAKPOINTS.lg) return 'lg';
  if (width >= CONTAINER_BREAKPOINTS.md) return 'md';
  if (width >= CONTAINER_BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

/** Ignore sub-pixel jitter when deciding whether to fire a synthetic resize. */
const NOTIFY_WIDTH_EPSILON = 0.5;

// Hook: useContainerQuery

export const useContainerQuery = (
  ref: RefObject<HTMLElement>,
  options?: UseContainerQueryOptions,
): ContainerSize => {
  const notifyWindowResize = options?.notifyWindowResize ?? false;
  const [containerSize, setContainerSize] = useState<ContainerSize>('lg');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const updateSize = (width: number) => {
      const next = resolveContainerSize(width);
      setContainerSize(prev => (prev === next ? prev : next));
    };

    let lastNotifiedWidth: number | null = null;
    let resizeNotifyRafId: number | null = null;
    let pendingNotifyWidth: number | null = null;

    const scheduleWindowResizeNotify = (width: number) => {
      if (!notifyWindowResize || typeof window === 'undefined') {
        return;
      }
      pendingNotifyWidth = width;
      if (resizeNotifyRafId !== null) {
        return;
      }
      resizeNotifyRafId = window.requestAnimationFrame(() => {
        resizeNotifyRafId = null;
        const w = pendingNotifyWidth;
        if (w === null) {
          return;
        }
        if (
          lastNotifiedWidth !== null &&
          Math.abs(w - lastNotifiedWidth) < NOTIFY_WIDTH_EPSILON
        ) {
          return;
        }
        lastNotifiedWidth = w;
        window.dispatchEvent(new Event('resize'));
      });
    };

    const onObservedWidth = (width: number) => {
      updateSize(width);
      scheduleWindowResizeNotify(width);
    };

    onObservedWidth(el.getBoundingClientRect().width);

    const observer = new ResizeObserver(entries => {
      if (!entries.length) return;
      onObservedWidth(entries[0].contentRect.width);
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (resizeNotifyRafId !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(resizeNotifyRafId);
      }
    };
  }, [ref, notifyWindowResize]);

  return containerSize;
};
