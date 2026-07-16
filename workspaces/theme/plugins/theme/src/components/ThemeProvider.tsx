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

import { type ReactNode, useMemo } from 'react';
import { AppTheme } from '@backstage/core-plugin-api';
import { UnifiedTheme, UnifiedThemeProvider } from '@backstage/theme';

import {
  StyledEngineProvider,
  ThemeProvider as Mui5Provider,
  Theme as Mui5Theme,
} from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';

import { useTheme } from '../hooks/useTheme';
import { useThemeConfig } from '../hooks/useThemeConfig';
import { useBranding } from '../hooks/useBranding';
import { buiTokensToCSS } from '../utils/buiTokensToCSS';
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
  const branding = useBranding();

  const buiTokenStyles = useMemo(() => {
    const themes = branding?.theme;
    if (!themes) return null;
    const styles: Record<string, Record<string, string>> = {};
    for (const [themeName, themeConfig] of Object.entries(themes)) {
      const tokens = themeConfig?.bui?.tokens;
      if (!tokens) continue;
      const cssMap = buiTokensToCSS(tokens);
      if (Object.keys(cssMap).length === 0) continue;
      const mode =
        themeConfig.mode ?? (themeName.includes('dark') ? 'dark' : 'light');
      styles[`[data-theme-mode='${mode}']`] = {
        ...styles[`[data-theme-mode='${mode}']`],
        ...cssMap,
      };
    }
    return Object.keys(styles).length > 0 ? styles : null;
  }, [branding?.theme]);

  const customCSS = branding?.customCSS ?? '';

  return (
    <UnifiedThemeProvider theme={theme}>
      <StyledEngineProvider injectFirst>
        <Mui5Provider theme={theme.getTheme('v5') as Mui5Theme}>
          {buiTokenStyles && <GlobalStyles styles={buiTokenStyles} />}
          {customCSS && <style>{customCSS}</style>}
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
