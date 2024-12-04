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

import '../fonts/font.css';

import { ThemeConfig } from './types';
import { customDarkTheme } from './darkTheme';
import { customLightTheme } from './lightTheme';
import { fonts, typography } from './typography';

export const getDefaultThemeConfig = (mode: 'light' | 'dark'): ThemeConfig => {
  const palette = mode === 'dark' ? customDarkTheme() : customLightTheme();

  return {
    variant: 'rhdh',
    mode: mode === 'dark' ? 'dark' : 'light',
    palette,
    fontFamily: fonts.text,
    typography,
    defaultPageTheme: 'default',
    pageTheme: {
      default: {
        backgroundColor: mode === 'dark' ? '#0f1214' : '#ffffff',
        fontColor: mode === 'dark' ? '#ffffff' : '#000000',
      },
    },
    options: {},
  };
};
