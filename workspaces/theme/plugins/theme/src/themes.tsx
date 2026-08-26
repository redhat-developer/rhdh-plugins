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

import { useMemo } from 'react';
import { AppTheme } from '@backstage/core-plugin-api';
import { themes } from '@backstage/theme';

import LightIcon from '@mui/icons-material/WbSunnyRounded';
import DarkIcon from '@mui/icons-material/Brightness2Rounded';
import { createTheme } from '@mui/material/styles';

import { createSharedThemeProvider } from './components/ThemeProvider';
import * as backstage from './backstage';
import * as rhdh from './rhdh';

const sharedProvider = createSharedThemeProvider({
  light: { name: 'light' },
  dark: { name: 'dark' },
  'light-customized': {
    config: {
      mode: 'light',
      variant: 'rhdh',
      palette: {
        primary: { main: '#ff0000' },
        secondary: { main: '#00ff00' },
      },
    },
  },
  'dark-customized': {
    config: {
      mode: 'dark',
      variant: 'rhdh',
      palette: {
        primary: { main: '#ff0000' },
        secondary: { main: '#00ff00' },
      },
    },
  },
  'backstage-light': { theme: themes.light },
  'backstage-dark': { theme: themes.dark },
});

export const lightThemeProvider = sharedProvider;

export const darkThemeProvider = sharedProvider;

export const getAllThemes = (): AppTheme[] => {
  return [
    {
      id: 'light',
      title: 'RHDH Light (latest)',
      variant: 'light',
      icon: <LightIcon />,
      Provider: sharedProvider,
    },
    {
      id: 'dark',
      title: 'RHDH Dark (latest)',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: sharedProvider,
    },
    {
      id: 'light-customized',
      title: 'RHDH Light (customized)',
      variant: 'light',
      icon: <LightIcon />,
      Provider: sharedProvider,
    },
    {
      id: 'dark-customized',
      title: 'RHDH Dark (customized)',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: sharedProvider,
    },
    {
      id: 'backstage-light',
      title: 'Backstage Light',
      variant: 'light',
      icon: <LightIcon />,
      Provider: sharedProvider,
    },
    {
      id: 'backstage-dark',
      title: 'Backstage Dark',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: sharedProvider,
    },
  ];
};

export const useAllThemes = (): AppTheme[] => {
  return useMemo(() => getAllThemes(), []);
};

export const getThemes = (): AppTheme[] => {
  return [
    {
      id: 'light',
      title: 'Light',
      variant: 'light',
      icon: <LightIcon />,
      Provider: sharedProvider,
    },
    {
      id: 'dark',
      title: 'Dark',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: sharedProvider,
    },
  ];
};

export const useThemes = (): AppTheme[] => {
  return useMemo(() => getThemes(), []);
};

export const useLoaderTheme = () => {
  return useMemo(() => {
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
