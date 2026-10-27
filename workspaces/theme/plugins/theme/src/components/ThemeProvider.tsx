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
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';

import { useTheme } from '../hooks/useTheme';
import { useThemeConfig } from '../hooks/useThemeConfig';
import { useBranding } from '../hooks/useBranding';
import { buiTokensToCSS } from '../utils/buiTokensToCSS';
import { contrastTextForBackground } from '../utils/contrastTextForBackground';
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
  themeName,
  theme,
  children,
}: {
  themeName: string;
  theme: UnifiedTheme;
  children: ReactNode;
}) => {
  const branding = useBranding();
  const mui5Theme = theme.getTheme('v5') as Mui5Theme;
  const secondary = mui5Theme.palette.text.secondary;
  const primaryMain = mui5Theme.palette.primary.main;
  const primaryDark = mui5Theme.palette.primary.dark;
  // Derive from fill so app-config `primary.main` overrides don't keep a
  // stale merged contrastText (dark default #151515 on customized blues).
  const primaryContrast = contrastTextForBackground(primaryMain);
  const primaryDarkContrast = contrastTextForBackground(primaryDark);

  const buiTokenStyles = useMemo(() => {
    const themes = branding?.theme;
    if (!themes) return null;
    const styles: Record<string, Record<string, string>> = {};
    for (const [brandingThemeName, themeConfig] of Object.entries(themes)) {
      const tokens = themeConfig?.bui?.tokens;
      if (!tokens) continue;
      const cssMap = buiTokensToCSS(tokens);
      if (Object.keys(cssMap).length === 0) continue;
      const mode =
        themeConfig.mode ??
        (brandingThemeName.includes('dark') ? 'dark' : 'light');
      styles[`[data-theme-mode='${mode}']`] = {
        ...styles[`[data-theme-mode='${mode}']`],
        ...cssMap,
      };
    }
    return Object.keys(styles).length > 0 ? styles : null;
  }, [branding?.theme]);

  const customCSS = branding?.customCSS ?? '';

  return (
    <UnifiedThemeProvider themeName={themeName} theme={theme}>
      <StyledEngineProvider injectFirst>
        <Mui5Provider theme={mui5Theme}>
          {/*
            NFS does not mount CssBaseline elsewhere. Without it,
            MuiCssBaseline.styleOverrides (shell chrome, CreateButton, …)
            never reach the DOM. Backstage UnifiedThemeProvider also omits it.
          */}
          <CssBaseline />
          {/*
            Native style tag (not Emotion) so the declaration is unlayered and
            reliably overrides @backstage/ui @layer tokens for --bui-fg-secondary.
          */}
          <style>{`
            :root, [data-theme-mode='light'], [data-theme-mode='dark'] {
              --bui-fg-secondary: ${secondary} !important;
            }
            /*
              RHDHBUGS-4042: CreateButton → <a class="MuiButton-containedPrimary">
              inside BUI HeaderPage. MuiButtonBase (transparent/padding:0) +
              injectFirst beat containedPrimary; unlayered !important restores
              the OFS contained look even if Emotion CssBaseline loses cascade.
            */
            a.MuiButton-containedPrimary,
            a[class*="MuiButton-containedPrimary"] {
              color: ${primaryContrast} !important;
              background-color: ${primaryMain} !important;
              background-image: none !important;
              border: 0 !important;
              border-radius: 99em !important;
              box-shadow: none !important;
              padding: 6px 16px !important;
              min-height: 36px !important;
              min-width: 64px;
              line-height: 1.75;
              text-decoration: none !important;
              text-transform: none;
            }
            a.MuiButton-containedPrimary:hover,
            a.MuiButton-containedPrimary:focus-visible,
            a[class*="MuiButton-containedPrimary"]:hover,
            a[class*="MuiButton-containedPrimary"]:focus-visible,
            a.MuiButton-containedPrimary:active,
            a[class*="MuiButton-containedPrimary"]:active {
              color: ${primaryDarkContrast} !important;
              background-color: ${primaryDark} !important;
              background-image: none !important;
              border: 0 !important;
              box-shadow: none !important;
              text-decoration: none !important;
            }
          `}</style>
          {buiTokenStyles && <GlobalStyles styles={buiTokenStyles} />}
          {customCSS && <style>{customCSS}</style>}
          {children}
        </Mui5Provider>
      </StyledEngineProvider>
    </UnifiedThemeProvider>
  );
};

export const createThemeProvider = (
  themeName: string,
  theme: UnifiedTheme,
): AppTheme['Provider'] =>
  function RHDHThemeProvider({ children }) {
    return (
      <ThemeProvider themeName={themeName} theme={theme}>
        {children}
      </ThemeProvider>
    );
  };

export const createThemeProviderForThemeConfig = (
  themeName: string,
  themeConfig: ThemeConfig,
): AppTheme['Provider'] =>
  function RHDHThemeProviderForThemeConfig({ children }) {
    const theme = useTheme(themeConfig);
    return (
      <ThemeProvider themeName={themeName} theme={theme}>
        {children}
      </ThemeProvider>
    );
  };

export const createThemeProviderForThemeName = (
  themeName: string,
  themeNameForConfig = themeName,
): AppTheme['Provider'] =>
  function RHDHThemeProviderForThemeName({ children }) {
    const themeConfig = useThemeConfig(themeNameForConfig);
    const theme = useTheme(themeConfig);
    return (
      <ThemeProvider themeName={themeName} theme={theme}>
        {children}
      </ThemeProvider>
    );
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
    return (
      <ThemeProvider theme={theme} themeName={entry.name ?? key}>
        {children}
      </ThemeProvider>
    );
  }
  return RHDHSharedThemeProvider;
};
