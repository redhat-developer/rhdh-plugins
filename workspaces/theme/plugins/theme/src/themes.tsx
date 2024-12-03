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
import {
  createBaseThemeOptions,
  createUnifiedTheme,
  palettes,
  themes as backstageThemes,
  UnifiedThemeProvider,
} from '@backstage/theme';
import LightIcon from '@material-ui/icons/WbSunny';
import DarkIcon from '@material-ui/icons/Brightness2';

/**
 * @public
 */
export const lightTheme = createUnifiedTheme({
  ...createBaseThemeOptions({
    palette: {
      ...palettes.light,
      primary: {
        main: '#0066CC',
      },
      secondary: {
        main: '#0066CC',
      },
      error: {
        main: '#B1380B',
      },
      warning: {
        main: '#FFCC17',
      },
      info: {
        main: '#5E40CE',
      },
      success: {
        main: '#3D7317',
      },
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
      banner: {
        info: '#5E40CE',
        error: '#B1380B',
        text: '#343b58', // TODO
        link: '#565a6e', // TODO
      },
      // errorBackground: '#8c4351',
      // warningBackground: '#8f5e15',
      // infoBackground: '#343b58',
      navigation: {
        background: '#F2F2F2',
        indicator: '#0066CC',
        color: '#4D4D4D',
        selectedColor: '#151515',
        navItem: {
          hoverBackground: '#FFFFFF',
        },
      },
    },
  }),
  defaultPageTheme: 'home',
});

/**
 * @public
 */
export const darkTheme = createUnifiedTheme({
  ...createBaseThemeOptions({
    palette: {
      ...palettes.dark,
      primary: {
        main: '#0066CC',
      },
      secondary: {
        main: '#0066CC',
      },
      error: {
        main: '#B1380B',
      },
      warning: {
        main: '#FFCC17',
      },
      info: {
        main: '#5E40CE',
      },
      success: {
        main: '#3D7317',
      },
      background: {
        default: '#292929',
        paper: '#292929',
      },
      banner: {
        info: '#5E40CE',
        error: '#B1380B',
        text: '#343b58', // TODO
        link: '#565a6e', // TODO
      },
      // errorBackground: '#8c4351',
      // warningBackground: '#8f5e15',
      // infoBackground: '#343b58',
      navigation: {
        background: '#151515',
        indicator: '#0066CC',
        color: '#C7C7C7',
        selectedColor: '#FFFFFF',
        navItem: {
          hoverBackground: '#292929',
        },
      },
    },
  }),
  defaultPageTheme: 'home',
});

/**
 * @public
 */
export const themes: AppTheme[] = [
  {
    id: 'light-theme',
    title: 'Light Theme',
    variant: 'light',
    icon: <LightIcon />,
    Provider: ({ children }: { children: React.ReactNode }) => (
      <UnifiedThemeProvider theme={lightTheme} children={children} />
    ),
  },
  {
    id: 'dark-theme',
    title: 'Dark Theme',
    variant: 'dark',
    icon: <DarkIcon />,
    Provider: ({ children }: { children: React.ReactNode }) => (
      <UnifiedThemeProvider theme={darkTheme} children={children} />
    ),
  },
];

/**
 * @public
 */
export const allThemes: AppTheme[] = [
  ...themes,
  {
    id: 'backstage-light-theme',
    title: 'Backstage Light Theme',
    variant: 'light',
    icon: <LightIcon />,
    Provider: ({ children }: { children: React.ReactNode }) => (
      <UnifiedThemeProvider theme={backstageThemes.light} children={children} />
    ),
  },
  {
    id: 'backstage-dark-theme',
    title: 'backstage Dark Theme',
    variant: 'dark',
    icon: <DarkIcon />,
    Provider: ({ children }: { children: React.ReactNode }) => (
      <UnifiedThemeProvider theme={backstageThemes.dark} children={children} />
    ),
  },
];
