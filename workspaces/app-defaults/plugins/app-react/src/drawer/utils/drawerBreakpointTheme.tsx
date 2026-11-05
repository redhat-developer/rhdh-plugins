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

import { useMemo, type ReactNode } from 'react';

import {
  createTheme as createThemeV5,
  ThemeProvider as ThemeProviderV5,
  useTheme as useThemeV5,
  type Theme as ThemeV5,
} from '@mui/material/styles';
// Upstream Catalog / Settings still use MUI v4 Grid + useMediaQuery. Nested
// v5 ThemeProvider alone does not update that context — keep a v4 nest until
// those pages migrate.
// eslint-disable-next-line no-restricted-imports -- intentional MUI v4 bridge
import {
  createMuiTheme,
  ThemeProvider as ThemeProviderV4,
  useTheme as useThemeV4,
  type Theme as ThemeV4,
} from '@material-ui/core/styles';

/**
 * Raises MUI breakpoint pixel values by `offset` so `@media (min-width: …)`
 * and `useMediaQuery` treat the viewport as if it were `innerWidth - offset`
 * (the width left after a docked app drawer).
 *
 * `xs` stays 0. Same cascade as before — only the threshold moves.
 */
export function shiftBreakpointValues(
  values: Record<string, number>,
  offset: number,
): Record<string, number> {
  if (offset <= 0) {
    return values;
  }
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    next[key] = key === 'xs' ? value : value + offset;
  }
  return next;
}

/**
 * Rebuild only the breakpoints object. Merging `{ breakpoints: { values } }`
 * into an existing theme via `createTheme(theme, …)` updates `.values` but
 * leaves `.up` / `.down` / `useMediaQuery` closed over the old pixels — so
 * Grid never actually shifts.
 */
function shiftThemeV5(theme: ThemeV5, offset: number): ThemeV5 {
  if (offset <= 0) {
    return theme;
  }
  const values = shiftBreakpointValues(
    theme.breakpoints.values as Record<string, number>,
    offset,
  ) as ThemeV5['breakpoints']['values'];
  const { breakpoints } = createThemeV5({ breakpoints: { values } });
  return { ...theme, breakpoints };
}

function shiftThemeV4(theme: ThemeV4, offset: number): ThemeV4 {
  if (offset <= 0) {
    return theme;
  }
  const values = shiftBreakpointValues(
    theme.breakpoints.values as Record<string, number>,
    offset,
  ) as ThemeV4['breakpoints']['values'];
  const { breakpoints } = createMuiTheme({ breakpoints: { values } });
  return { ...theme, breakpoints };
}

function MaterialUiV4BreakpointTheme({
  offset,
  children,
}: {
  offset: number;
  children: ReactNode;
}) {
  const theme = useThemeV4();
  const shifted = useMemo(() => shiftThemeV4(theme, offset), [theme, offset]);
  return <ThemeProviderV4 theme={shifted}>{children}</ThemeProviderV4>;
}

/**
 * Nested MUI v4 + v5 themes whose breakpoints are offset by the docked
 * drawer width. Upstream Backstage pages (Settings, Catalog) still use the
 * same `xs`/`md`/`lg` Grid and `useMediaQuery` behavior — they just see the
 * available content width instead of the full viewport.
 *
 * @internal
 */
export function DrawerBreakpointTheme({
  offset,
  children,
}: {
  offset: number;
  children: ReactNode;
}) {
  const themeV5 = useThemeV5();
  const shiftedV5 = useMemo(
    () => shiftThemeV5(themeV5, offset),
    [themeV5, offset],
  );

  return (
    <ThemeProviderV5 theme={shiftedV5}>
      <MaterialUiV4BreakpointTheme offset={offset}>
        {children}
      </MaterialUiV4BreakpointTheme>
    </ThemeProviderV5>
  );
}
