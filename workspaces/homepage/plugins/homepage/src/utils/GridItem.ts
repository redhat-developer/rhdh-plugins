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
* Generates an MUI `sx` object for a Grid **item** that supports
* container-based responsive columns (`xs | sm | md | lg | xl`).
*
* This utility mimics MUI Grid's breakpoint inheritance behavior,
* but uses **CSS Container Queries** instead of viewport media queries.
*
* How it works:
* - Accepts column counts (1–12) per breakpoint
* - Converts columns into percentage widths
* - Falls back to the nearest smaller breakpoint if a value is missing
* - Applies widths using `@container (min-width: ...)` rules
*
* Breakpoint mapping:
* - xs  → base width
* - sm  → ≥600px
* - md  → ≥900px
* - lg  → ≥1200px
* - xl  → ≥1536px
*
* Example:
* containerGridItemSx({ xs: 12, sm: 6, md: 4 })

*/

// Breakpoint props (xs / sm / md / lg / xl)
export type ContainerGridCols = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

// Convert column count to percentage width
const col = (n?: number): string | undefined => {
  if (!n) return undefined;
  return `${(n / 12) * 100}%`;
};

// Resolve breakpoint value with fallback (MUI-style inheritance)
const resolveCol = (
  current?: number,
  fallback?: number,
): string | undefined => {
  return col(current ?? fallback);
};

// SX generator for MUI Grid Item using container queries
export const containerGridItemSx = ({
  xs = 12,
  sm,
  md,
  lg,
  xl,
}: ContainerGridCols) => ({
  width: col(xs),

  '@container (min-width: 600px)': {
    width: resolveCol(sm, xs),
  },

  '@container (min-width: 900px)': {
    width: resolveCol(md, sm ?? xs),
  },

  '@container (min-width: 1200px)': {
    width: resolveCol(lg, md ?? sm ?? xs),
  },

  '@container (min-width: 1536px)': {
    width: resolveCol(xl, lg ?? md ?? sm ?? xs),
  },
});
