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
 * */

import { useLayoutEffect, useState, RefObject } from 'react';

// Container Breakpoints (MUI-like, but container-based)
export type containerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const CONTAINER_BREAKPOINTS = {
  xs: 0, // <600
  sm: 600, // ≥600
  md: 900, // ≥900
  lg: 1200, // ≥1200
  xl: 1536, // ≥1536
} as const;

// Width → containerSize mapper
const resolveContainerSize = (width: number): containerSize => {
  if (width >= CONTAINER_BREAKPOINTS.xl) return 'xl';
  if (width >= CONTAINER_BREAKPOINTS.lg) return 'lg';
  if (width >= CONTAINER_BREAKPOINTS.md) return 'md';
  if (width >= CONTAINER_BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

// Hook: useContainerQuery

export const useContainerQuery = (
  ref: RefObject<HTMLElement>,
): containerSize => {
  const [containerSize, setContainerSize] = useState<containerSize>('lg');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const updateSize = (width: number) => {
      const next = resolveContainerSize(width);
      setContainerSize(prev => (prev === next ? prev : next));
    };

    // Initial read
    updateSize(el.getBoundingClientRect().width);

    const observer = new ResizeObserver(entries => {
      if (!entries.length) return;
      updateSize(entries[0].contentRect.width);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return containerSize;
};
