/*
 * Copyright 2024 The Backstage Authors
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
import React from 'react';
import { AppTheme } from '@backstage/core-plugin-api';
import { UnifiedTheme, UnifiedThemeProvider, themes } from '@backstage/theme';
import LightIcon from '@material-ui/icons/WbSunny';
import DarkIcon from '@material-ui/icons/Brightness2';
import { createTheme } from '@mui/material/styles';

import * as backstage from './backstage';
import * as rhdh from './rhdh';
import { ThemeConfig } from './types';
import { useTheme } from './hooks/useTheme';
import { useThemeConfig } from './hooks/useThemeConfig';

const createThemeProvider = (theme: UnifiedTheme): AppTheme['Provider'] =>
  function RHDHThemeProvider({ children }) {
    return (
      <UnifiedThemeProvider theme={theme}>{children}</UnifiedThemeProvider>
    );
  };

const createThemeProviderForThemeConfig = (
  themeConfig: ThemeConfig,
): AppTheme['Provider'] =>
  function RHDHThemeProviderForThemeConfig({ children }) {
    const theme = useTheme(themeConfig);
    return (
      <UnifiedThemeProvider theme={theme}>{children}</UnifiedThemeProvider>
    );
  };

const createThemeProviderForThemeName = (
  themeName: string,
): AppTheme['Provider'] =>
  function RHDHThemeProviderForThemeName({ children }) {
    const themeConfig = useThemeConfig(themeName);
    const theme = useTheme(themeConfig);
    return (
      <UnifiedThemeProvider theme={theme}>{children}</UnifiedThemeProvider>
    );
  };

export const getAllThemes = (): AppTheme[] => {
  return [
    {
      id: 'light',
      title: 'RHDH Light (latest)',
      variant: 'light',
      icon: <LightIcon />,
      Provider: createThemeProviderForThemeName('light'),
    },
    {
      id: 'dark',
      title: 'RHDH Dark (latest)',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: createThemeProviderForThemeName('dark'),
    },
    {
      id: 'light-customized',
      title: 'RHDH Light (customized)',
      variant: 'light',
      icon: <LightIcon />,
      Provider: createThemeProviderForThemeConfig({
        mode: 'light',
        variant: 'rhdh',
        palette: {
          primary: { main: '#ff0000' },
          secondary: { main: '#00ff00' },
        },
      }),
    },
    {
      id: 'dark-customized',
      title: 'RHDH Dark (customized)',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: createThemeProviderForThemeConfig({
        mode: 'dark',
        variant: 'rhdh',
        palette: {
          primary: { main: '#ff0000' },
          secondary: { main: '#00ff00' },
        },
      }),
    },
    {
      id: 'backstage-light',
      title: 'Backstage Light',
      variant: 'light',
      icon: <LightIcon />,
      Provider: createThemeProvider(themes.light),
    },
    {
      id: 'backstage-dark',
      title: 'Backstage Dark',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: createThemeProvider(themes.dark),
    },
  ];
};

export const useAllThemes = (): AppTheme[] => {
  return React.useMemo(() => getAllThemes(), []);
};

export const getThemes = (): AppTheme[] => {
  return [
    {
      id: 'light',
      title: 'Light',
      variant: 'light',
      icon: <LightIcon />,
      Provider: createThemeProviderForThemeName('light'),
    },
    {
      id: 'dark',
      title: 'Dark',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: createThemeProviderForThemeName('dark'),
    },
  ];
};

export const useThemes = (): AppTheme[] => {
  return React.useMemo(() => getThemes(), []);
};

export const useLoaderTheme = () => {
  return React.useMemo(() => {
    const latestTheme = localStorage.getItem('theme');
    const mode = latestTheme?.includes('dark') ? 'dark' : 'light';
    const variant = latestTheme?.includes('backstage') ? 'backstage' : 'rhdh';
    const themeOptions =
      variant === 'backstage'
        ? backstage.getDefaultThemeConfig(mode)
        : rhdh.getDefaultThemeConfig(mode);
    return createTheme(themeOptions);
  }, []);
};
