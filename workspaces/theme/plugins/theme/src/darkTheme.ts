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

export const customDarkTheme = (): ThemeConfigPalette => {
  const palette: (typeof palettes)['dark'] & PaletteOptions = palettes.dark;
  return {
    ...palette,
    primary: {
      main: '#1FA7F8',
    },
    secondary: {
      main: '#1FA7F8',
    },
    navigation: {
      background: '#0f1214',
      indicator: '#0066CC',
      color: '#ffffff',
      selectedColor: '#ffffff',
      navItem: {
        hoverBackground: '#3c3f42',
      },
      submenu: {
        background: '#0f1214',
      },
    },
    background: {
      default: '#333333',
      paper: '#1b1d21',
    },
    rhdh: {
      general: {
        disabled: '#AAABAC',
        disabledBackground: '#444548',

        paperBackgroundImage: 'none',
        paperBorderColor: '#A3A3A3',

        // Box shadow from PatternFly 5 (--pf-v5-global--BoxShadow--sm)
        popoverBoxShadow:
          '0 0.25rem 0.5rem 0rem rgba(3, 3, 3, 0.48), 0 0 0.25rem 0 rgba(3, 3, 3, 0.24)',

        cardBackgroundColor: '#1b1d21',
        cardBorderColor: '#A3A3A3',

        headerBottomBorderColor: '#A3A3A3',
        mainSectionBackgroundColor: '#0f1214',
        formControlBackgroundColor: '#36373A',

        sidebarBackgroundColor: '#1b1d21',
        sidebarItemSelectedBackgroundColor: '#4F5255',

        tableTitleColor: '#E0E0E0',
        tableSubtitleColor: '#E0E0E0',
        tableColumnTitleColor: '#E0E0E0',
        tableRowHover: '#0f1214',
        tableBorderColor: '#515151',
        tableBackgroundColor: '#1b1d21',
        tabsDisabledBackgroundColor: '#444548',
        tabsBottomBorderColor: '#444548',

        contrastText: '#FFF',

        appBarBackgroundColor: '#1b1d21',
        appBarBackgroundImage: 'none',
      },
      primary: {
        main: '#1FA7F8',
        focusVisibleBorder: '#ADD6FF',
      },
      secondary: {
        main: '#1FA7F8',
        focusVisibleBorder: '#ADD6FF',
      },
      cards: {
        headerTextColor: '#FFF',
        headerBackgroundColor: '#0f1214',
        headerBackgroundImage: 'none',
      },
    },
  };
};
