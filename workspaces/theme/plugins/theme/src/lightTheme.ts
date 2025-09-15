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

import { palettes } from '@backstage/theme';
import { type PaletteOptions } from '@mui/material/styles';

import { type ThemeConfigPalette } from './types';

export const lightThemeOverrides: Partial<ThemeConfigPalette> = {
  primary: {
    main: '#0066CC',
  },
  secondary: {
    main: '#0066CC',
  },
  navigation: {
    background: '#222427',
    indicator: 'transparent',
    color: '#151515',
    selectedColor: '#151515',
    navItem: {
      hoverBackground: '#ffffff',
    },
    submenu: {
      background: '#222427',
    },
  },
  text: {
    primary: '#151515',
    secondary: '#757575',
  },
  background: {
    default: '#FFFFFF',
    paper: '#FFFFFF',
  },
  rhdh: {
    general: {
      pageInset: '1.5rem',

      disabled: '#6A6E73',
      disabledBackground: '#D2D2D2',

      paperBackgroundImage: 'none',
      paperBorderColor: '#C7C7C7',

      // Box shadow from PatternFly 5 (--pf-v5-global--BoxShadow--sm)
      popoverBoxShadow:
        '0 0.25rem 0.5rem 0rem rgba(3, 3, 3, 0.12), 0 0 0.25rem 0 rgba(3, 3, 3, 0.06)',

      cardBackgroundColor: '#FFF',
      cardBorderColor: '#C7C7C7',

      mainSectionBackgroundColor: '#FFF',
      formControlBackgroundColor: '#FFF',

      sidebarBackgroundColor: '#f2f2f2',
      sidebarDividerColor: '#c7c7c7',
      sidebarItemSelectedBackgroundColor: '#FFF',

      tableTitleColor: '#181818',
      tableSubtitleColor: '#616161',
      tableColumnTitleColor: '#151515',
      tableRowHover: '#F5F5F5',
      tableBorderColor: '#E0E0E0',
      tableBackgroundColor: '#FFF',
      tabsLinkHoverBackgroundColor: 'rgba(199, 199, 199, 0.2500)',

      contrastText: '#FFF',

      appBarBackgroundScheme: 'light',

      appBarBackgroundColor: '#f2f2f2',
      appBarForegroundColor: '#1f1f1f',
      appBarBackgroundImage: 'none',

      starredItemsColor: '#F3BA37',
    },
    primary: {
      main: '#0066CC',
      focusVisibleBorder: '#0066CC',
    },
    secondary: {
      main: '#0066CC',
      focusVisibleBorder: '#0066CC',
    },
    cards: {
      headerTextColor: '#151515',
      headerBackgroundColor: '#FFF',
      headerBackgroundImage: 'none',
    },
  },
};

export const customLightTheme = (): ThemeConfigPalette => {
  const palette: (typeof palettes)['light'] & PaletteOptions = palettes.light;
  return {
    ...palette,
    ...lightThemeOverrides,
  };
};
