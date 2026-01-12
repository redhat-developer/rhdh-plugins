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

export const darkThemeOverrides: Partial<ThemeConfigPalette> = {
  primary: {
    main: '#92c5f9',
  },
  secondary: {
    main: '#92c5f9',
  },
  navigation: {
    background: '#292929',
    indicator: 'transparent',
    color: '#ffffff',
    selectedColor: '#ffffff',
    navItem: {
      hoverBackground: '#292929',
    },
    submenu: {
      background: '#292929',
    },
  },
  text: {
    primary: '#ffffff',
    secondary: '#c7c7c7',
  },
  background: {
    default: '#292929',
    paper: '#292929',
  },
  rhdh: {
    general: {
      pageInset: '1.5rem',

      disabled: '#AAABAC',
      disabledBackground: '#444548',

      paperBackgroundImage: 'none',
      paperBorderColor: '#A3A3A3',

      // Box shadow from PatternFly 5 (--pf-v5-global--BoxShadow--sm)
      popoverBoxShadow:
        '0 0.25rem 0.5rem 0rem rgba(3, 3, 3, 0.48), 0 0 0.25rem 0 rgba(3, 3, 3, 0.24)',

      cardBackgroundColor: '#292929',
      cardBorderColor: '#A3A3A3',

      mainSectionBackgroundColor: '#292929',
      formControlBackgroundColor: '#36373A',

      sidebarBackgroundColor: '#151515',
      sidebarDividerColor: '#383838',
      sidebarItemSelectedBackgroundColor: '#292929',

      tableTitleColor: '#E0E0E0',
      tableSubtitleColor: '#E0E0E0',
      tableColumnTitleColor: '#E0E0E0',
      tableRowHover: '#292929',
      tableBorderColor: '#515151',
      tableBackgroundColor: '#292929',
      tabsLinkHoverBackgroundColor: 'rgba(199, 199, 199, 0.1500)',

      contrastText: '#FFF',

      appBarBackgroundScheme: 'dark',

      appBarBackgroundColor: '#151515',
      appBarForegroundColor: '#ffffff',
      appBarBackgroundImage: 'none',

      starredItemsColor: '#F3BA37',
    },
    primary: {
      main: '#92c5f9',
      focusVisibleBorder: '#ADD6FF',
    },
    secondary: {
      main: '#92c5f9',
      focusVisibleBorder: '#ADD6FF',
    },
    cards: {
      headerTextColor: '#FFF',
      headerBackgroundColor: '#292929',
      headerBackgroundImage: 'none',
    },
  },
};

export const customDarkTheme = (): ThemeConfigPalette => {
  const palette: (typeof palettes)['dark'] & PaletteOptions = palettes.dark;
  return {
    ...palette,
    ...darkThemeOverrides,
  };
};
