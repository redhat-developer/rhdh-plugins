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

import type { ReactNode } from 'react';
import {
  type AppTheme,
  appThemeApiRef,
  type AppThemeApi,
  useApi,
} from '@backstage/core-plugin-api';
import { UnifiedTheme, UnifiedThemeProvider } from '@backstage/theme';

import {
  StyledEngineProvider,
  ThemeProvider as Mui5Provider,
  Theme as Mui5Theme,
} from '@mui/material/styles';

import { useTheme } from '../hooks/useTheme';
import { useThemeConfig } from '../hooks/useThemeConfig';
import { ThemeConfig } from '../types';

/**
 * Uses the UnifiedThemeProvider to style MUI v4 and v5 components.
 *
 * This component duplicated the StyledEngineProvider and MUI v5 ThemeProvider
 * to solve an issue that the defaultProps from the component configurations
 * (see `utils/createComponents.ts`) wasn't picked up.
 *
 * https://github.com/backstage/backstage/blob/master/packages/theme/src/unified/UnifiedThemeProvider.tsx#L94-L100
 */
const ThemeProvider = ({
  theme,
  children,
}: {
  theme: UnifiedTheme;
  children: ReactNode;
}) => {
  const mui5Theme = theme.getTheme('v5') as Mui5Theme;
  const secondary = mui5Theme.palette.text.secondary;
  return (
    <UnifiedThemeProvider theme={theme}>
      <StyledEngineProvider injectFirst>
        <Mui5Provider theme={mui5Theme}>
          {/*
            Native style tag (not Emotion) so the declaration is unlayered and
            reliably overrides @backstage/ui @layer tokens for --bui-fg-secondary.
          */}
          <style>{`
            :root, [data-theme-mode='light'], [data-theme-mode='dark'] {
              --bui-fg-secondary: ${secondary} !important;
            }
          `}</style>
          {children}
        </Mui5Provider>
      </StyledEngineProvider>
    </UnifiedThemeProvider>
  );
};

export const createThemeProvider = (
  theme: UnifiedTheme,
): AppTheme['Provider'] =>
  function RHDHThemeProvider({ children }) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  };

export const createThemeProviderForThemeConfig = (
  themeConfig: ThemeConfig,
): AppTheme['Provider'] =>
  function RHDHThemeProviderForThemeConfig({ children }) {
    const theme = useTheme(themeConfig);
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  };

export const createThemeProviderForThemeName = (
  themeName: string,
): AppTheme['Provider'] =>
  function RHDHThemeProviderForThemeName({ children }) {
    const themeConfig = useThemeConfig(themeName);
    const theme = useTheme(themeConfig);
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  };

const resolveActiveKey = (
  activeId: string | undefined,
  keys: string[],
): string => {
  if (activeId && keys.includes(activeId)) {
    return activeId;
  }
  const prefersDark = activeId
    ? activeId.includes('dark')
    : window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  return prefersDark
    ? (keys.find(n => n.includes('dark')) ?? keys[0])
    : (keys.find(n => !n.includes('dark')) ?? keys[0]);
};

const useActiveThemeId = (): string | undefined => {
  let appThemeApi: AppThemeApi | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    appThemeApi = useApi<AppThemeApi>(appThemeApiRef); // NOSONAR
  } catch {
    // appThemeApi may not be available during createApp initialization
  }
  return appThemeApi?.getActiveThemeId();
};

export type SharedThemeEntry = {
  name?: string;
  config?: ThemeConfig;
  theme?: UnifiedTheme;
};

export const createSharedThemeProvider = (
  entries: Record<string, SharedThemeEntry>,
): AppTheme['Provider'] => {
  const keys = Object.keys(entries);

  function RHDHSharedThemeProvider({ children }: { children: ReactNode }) {
    const activeId = useActiveThemeId();
    const key = resolveActiveKey(activeId, keys);
    const entry = entries[key];

    // Always call hooks unconditionally (Rules of Hooks).
    // For entries that don't need them the results are simply unused.
    const configFromName = useThemeConfig(entry.name ?? key);
    const resolvedConfig = entry.config ?? configFromName;
    const themeFromHook = useTheme(resolvedConfig);

    const theme = entry.theme ?? themeFromHook;
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  }
  return RHDHSharedThemeProvider;
};
