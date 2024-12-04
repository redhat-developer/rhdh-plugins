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
      main: '#8476D1',
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
    rhdh: {
      general: {
        disabledBackground: '#D2D2D2',
        disabled: '#6A6E73',
        searchBarBorderColor: '#E4E4E4',
        formControlBackgroundColor: '#FFF',
        mainSectionBackgroundColor: '#FFF',
        headerBottomBorderColor: '#C7C7C7',
        cardBackgroundColor: '#FFF',
        sideBarBackgroundColor: '#212427',
        cardBorderColor: '#C7C7C7',
        tableTitleColor: '#181818',
        tableSubtitleColor: '#616161',
        tableColumnTitleColor: '#151515',
        tableRowHover: '#F5F5F5',
        tableBorderColor: '#E0E0E0',
        tableBackgroundColor: '#FFF',
        tabsBottomBorderColor: '#D2D2D2',
        contrastText: '#FFF',
      },
      primary: {
        main: '#0066CC',
        focusVisibleBorder: '#0066CC',
      },
      secondary: {
        main: '#8476D1',
        focusVisibleBorder: '#8476D1',
      },
      cards: {
        headerTextColor: '#151515',
        headerBackgroundColor: '#FFF',
        headerBackgroundImage: 'none',
      },
    },
  };
};
