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
import { palettes } from '@backstage/theme';
import { type PaletteOptions } from '@mui/material/styles';

import { type ThemeConfigPalette } from './types';

export const customLightTheme = (): ThemeConfigPalette => {
  const palette: (typeof palettes)['light'] & PaletteOptions = palettes.light;
  return {
    ...palette,
    primary: {
      main: '#0066CC',
    },
    secondary: {
      main: '#0066CC',
    },
    navigation: {
      background: '#222427',
      indicator: '#0066CC',
      color: '#ffffff',
      selectedColor: '#ffffff',
      navItem: {
        hoverBackground: '#3c3f42',
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
      default: '#F8F8F8',
      paper: '#FFFFFF',
    },
    rhdh: {
      general: {
        disabled: '#6A6E73',
        disabledBackground: '#D2D2D2',

        paperBackgroundImage: 'none',
        paperBorderColor: '#C7C7C7',

        cardBackgroundColor: '#FFF',
        cardBorderColor: '#C7C7C7',

        headerBottomBorderColor: '#C7C7C7',
        mainSectionBackgroundColor: '#FFF',
        formControlBackgroundColor: '#FFF',

        sidebarBackgroundColor: '#212427',
        sidebarItemSelectedBackgroundColor: '#4F5255',

        tableTitleColor: '#181818',
        tableSubtitleColor: '#616161',
        tableColumnTitleColor: '#151515',
        tableRowHover: '#F5F5F5',
        tableBorderColor: '#E0E0E0',
        tableBackgroundColor: '#FFF',
        tabsDisabledBackgroundColor: '#f5f5f5',
        tabsBottomBorderColor: '#D2D2D2',

        contrastText: '#FFF',
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
};
